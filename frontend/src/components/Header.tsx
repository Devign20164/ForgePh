import React, { useState, useEffect } from "react";
import { API_BASE_URL, SOCKET_URL } from "../config/api";
import { Link, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";
import io from "socket.io-client"; // Make sure to import socket.io-clientsss
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  Award, 
  Settings,
  AlertTriangle,
  UserCircle
} from "lucide-react";

// Define a type for navigation links
interface NavLink {
  path: string;
  label: string;
  readonly?: boolean; // Make readonly optional
}

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  points: number;
  userStatus: string; // Add this field to track verification status
}

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0); 
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const location = useLocation();

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Add a solid background color to the body when menu is open
      document.body.style.background = '#0A0D14';
    } else {
      document.body.style.overflow = '';
      // Reset background when menu is closed
      document.body.style.background = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, [isMobileMenuOpen]);

  const fetchUserData = async () => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/users/${parsedUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const { user } = await response.json();

      // Get storage method from current storage
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage;

      // Update user data with fresh information from server
      const updatedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        points: user.points,
        userStatus: user.userStatus || "Not Verified"
      };

      setUser(updatedUser);
      setCurrentPoints(user.points || 0);

      storage.setItem("user", JSON.stringify(updatedUser));

      console.log("Updated user data from server:", updatedUser);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const checkUserAuth = () => {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setCurrentPoints(parsedUser.points || 0);
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Clear invalid data
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    checkUserAuth();

    // Set up event listener for storage changes (in case user logs in from another tab)
    window.addEventListener("storage", checkUserAuth);

    // Custom event listener for user login/logout
    const handleAuthChange = () => checkUserAuth();
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", checkUserAuth);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const openLoginModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const openLogoutDialog = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleLogout = () => {
    // Clear user data from storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
    setIsLogoutDialogOpen(false);

    // Dispatch event to notify other components
    window.dispatchEvent(new Event("authChange"));

    // Redirect to home page
    window.location.href = "/home";
  };

  // Function to determine if a link is active
  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  // Determine navigation links based on user type
  const getNavLinks = (): NavLink[] => {
    if (!user) {
      // Default links for non-logged in users - remove Products
      return [
        { path: "/home", label: "Home" },
      ];
    }

    if (user.userType === "Retailer") {
      // Links for Retailer users
      return [
        { path: "/retailers", label: "Home" },
        { path: "/products", label: "Products" },
      ];
    }

    // Links for Consumer users (default) - Only show Home, Products, My Account
    const consumerLinks: NavLink[] = [
      { path: "/home", label: "Home" },
    ];

    // Add Products link with appropriate behavior based on verification status
    if (user.userStatus === "Verified") {
      // Fully functional links for verified users
      consumerLinks.push(
        { path: "/products", label: "Products" },
      );
    } else {
      // Read-only links for unverified users
      consumerLinks.push(
        { path: "#", label: "Products", readonly: true },
      );
    }

    return consumerLinks;
  };

  const navLinks = getNavLinks();

  // Toggle mobile menu with additional document handling
  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    // Set a class on the document body to control the page
    if (newState) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  };

  // Add an effect to ensure we clean up if component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-3 bg-xforge-dark bg-opacity-80 backdrop-blur shadow-md"
            : "py-5 bg-transparent"
        }`}
      >
        {/* Government Warning Section */}
        <div className="flex items-center bg-white/5 text-white/80 rounded-full px-3 py-1 text-[10px] sm:text-xs w-fit mx-auto mb-4 backdrop-blur-sm border border-white/10">
          <div className="bg-amber-500/80 text-black font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" />
            18+
          </div>
          <p className="ml-2 leading-tight">
            <span className="font-bold">GOVERNMENT WARNING:</span> THIS IS
            HARMFUL AND CONTAINS NICOTINE WHICH IS A HIGHLY ADDICTIVE SUBSTANCE.
            THIS IS FOR USE ONLY BY ADULTS AND IS NOT RECOMMENDED FOR USE BY
            NON-SMOKERS.
          </p>
        </div>
        
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/home" className="text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">FORGE</span>
              <span className="text-white"> PHILIPPINES</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden space-x-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 ${
                  isLinkActive(link.path) 
                    ? "text-emerald-400" 
                    : "text-white/80 hover:text-white"
                } ${
                  link.readonly ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={(e) => {
                  if (link.readonly) {
                    e.preventDefault();
                    alert("Your account needs to be verified to access this feature");
                  }
                }}
              >
                {link.label}
                {link.readonly && (
                  <span className="ml-1 text-xs text-amber-400 inline-flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3 w-3 mr-0.5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                    (Verify)
                  </span>
                )}
                {isLinkActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Login/Sign Up Buttons or User Profile */}
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-black/30 backdrop-blur-sm text-emerald-400 px-3 py-1.5 rounded-full text-sm flex items-center border border-emerald-500/20">
                <Award className="w-4 h-4 mr-1.5" />
                <span>{currentPoints.toLocaleString()} Points</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors duration-200">
                    <span>My Account</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#121520] border border-white/10 text-white w-48 rounded-lg shadow-xl shadow-black/50">
                  <DropdownMenuItem className="focus:bg-white/5 focus:text-emerald-400 cursor-pointer">
                    <Link to="/profile" className="flex w-full items-center">
                      <UserCircle className="w-4 h-4 mr-2 text-emerald-400" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    className="focus:bg-white/5 focus:text-red-400 cursor-pointer"
                    onClick={openLogoutDialog}
                  >
                    <LogOut className="w-4 h-4 mr-2 text-red-400" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden space-x-4 md:flex">
              <a
                href="#login"
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors duration-200"
                onClick={openLoginModal}
              >
                Login
              </a>
              <a 
                href="/home#register" 
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-medium hover:opacity-90 transition-opacity"
              >
                Sign Up
              </a>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="p-2 md:hidden flex items-center justify-center"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-emerald-400" />
            ) : (
              <Menu className="w-6 h-6 text-emerald-400" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu - Fixed Position with Scroll */}
        <div
        className={`fixed inset-0 z-[101] md:hidden bg-[#0A0D14] border-l border-r border-b border-white/10 transition-all duration-300 ease-in-out overflow-y-auto ${
            isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          }`}
        style={{ 
          top: '0', 
          height: '100%', 
          minHeight: '100vh', 
          width: '100%',
          backgroundColor: '#0A0D14',
          boxShadow: '0 0 50px 20px #0A0D14'
        }}
      >
        <div className="absolute inset-0 bg-[#0A0D14] z-[-1]"></div>
        {/* Close button at the top for easy access */}
        <div className="sticky top-0 z-[102] bg-[#0A0D14] py-4 px-4 flex justify-between items-center border-b border-white/10 shadow-md">
          <Link to="/home" className="text-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">FORGE</span>
            <span className="text-white"> PHILIPPINES</span>
          </Link>
          <button 
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
            onClick={toggleMobileMenu}
          >
            <X className="w-6 h-6 text-emerald-400" />
          </button>
        </div>

        <div className="flex flex-col p-4 mt-4 pb-20 bg-[#0A0D14]">
          {user && (
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black text-xl font-bold mb-3">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : ''}
              </div>
              <p className="text-white text-lg font-medium">{user.name}</p>
              <div className="bg-black/30 backdrop-blur-sm text-emerald-400 px-3 py-1.5 rounded-full text-sm flex items-center justify-center w-fit mx-auto mt-2 border border-emerald-500/20">
                <Award className="w-4 h-4 mr-1.5" />
                <span>{currentPoints.toLocaleString()} Points</span>
              </div>
            </div>
          )}

          <nav className="flex flex-col items-center space-y-5 text-base">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 font-medium transition-colors duration-200 ${
                  isLinkActive(link.path) 
                    ? "text-emerald-400" 
                    : "text-white/80 hover:text-white"
                } ${
                  link.readonly ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={(e) => {
                  if (link.readonly) {
                    e.preventDefault();
                    alert("Your account needs to be verified to access this feature");
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                {link.label}
                {link.readonly && (
                  <span className="ml-1 text-xs text-amber-400 inline-flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3 w-3 mr-0.5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                    (Verify)
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center mt-10 space-y-4 px-4 pb-10">
            {user ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openLogoutDialog();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            ) : (
              <>
                <a
                  href="#login"
                  className="w-full py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors duration-200 text-center"
                  onClick={(e) => {
                    openLoginModal(e);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </a>
                <a
                  href="#register"
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-medium hover:opacity-90 transition-opacity text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent className="bg-[#121520] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out of Your Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:opacity-90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Header;
