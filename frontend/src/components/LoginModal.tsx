import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Eye, EyeOff } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  location: {
    province: string;
    city: string;
  };
  userType: string;
  points: number;
  rewardsclaimed: any[];
  birthdate: string;
  registrationDate: string;
  userStatus: string;
  rank: string;
  shopName?: string;
  verified?: boolean;
  redemptionCount?: number;
  lastRedemptionDate?: string;
  redeemedPromoCodes?: Array<{
    promoCodeId: string;
    redeemedAt: string;
    shopName: string;
  }>;
}


const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // Added state for password visibility
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Login failed";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber || "",
        location: {
          province: data.user.location?.province || "",
          city: data.user.location?.city || ""
        },
        userType: data.user.userType,
        points: data.user.points,
        rewardsclaimed: data.user.rewardsclaimed || [],
        birthdate: data.user.birthdate || "",
        registrationDate: data.user.registrationDate || "",
        userStatus: data.user.userStatus || "Not Verified",
        rank: data.user.rank || "Bronze",
        shopName: data.user.shopName || "",
        verified: data.user.verified || false,
        redemptionCount: data.user.redemptionCount || 3,
        lastRedemptionDate: data.user.lastRedemptionDate || "",
        redeemedPromoCodes: data.user.redeemedPromoCodes || []
      };
      
      const token = data.token;

      if (rememberMe) {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        console.log("Stored user data in Local Storage:", userData);
      } else {
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("token", token);
        console.log("Stored user data in Session Storage:", userData);
      }

      toast({
        title: "Login successful",
        description: `Welcome back ${userData.name} to ForgePhilippines!`,
      });

      onClose();
      setEmail("");
      setPassword("");

      if (userData.userType === "Retailer") {
        window.location.href = "/retailers";
      } else {
        window.location.href = "/home";
      }

    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md p-6 mx-4 bg-xforge-dark border border-xforge-lightgray rounded-lg shadow-xl animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-xforge-gray hover:text-xforge-teal transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-white">
          <span className="text-xforge-teal">Forge</span> Login
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 text-xforge-gray">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block mb-2 text-xforge-gray">Password</label>
            <div className="relative">
              <Input
                id="password"
                type={passwordVisible ? "text" : "password"} // Toggle password visibility
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field pr-10" // Add padding-right for the icon
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)} // Toggle password visibility
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-xforge-gray"
              >
                {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                className="mr-2 accent-xforge-teal"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-xforge-gray">Remember me</label>
            </div>
            <a href="#" className="text-xforge-teal hover:underline">Forgot password?</a>
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
          
          <p className="text-center text-xforge-gray">
            Don't have an account?{" "}
            <a href="#register" className="text-xforge-teal hover:underline" onClick={onClose}>
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;