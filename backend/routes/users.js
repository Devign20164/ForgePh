const router = require("express").Router();
const { User, validateUser } = require("../models/Users.js");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser)
      return res
        .status(409)
        .send({ message: "User with given email already exists" });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create and save the user with default rank and status
    await new User({
      ...req.body,
      password: hashedPassword,
      registrationDate: new Date().toLocaleDateString("en-US"), // MM/DD/YYYY format
      rank: "Bronze", // Default rank
      userStatus: "Not Verified", // Default user status
    }).save();

    res.status(201).send({ message: "User Created Successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error In Creating User" });
  }
});

// Fetch Top 50 Retailers by Points (Using userId)
router.get("/top-retailers", async (req, res) => {
  try {
    const retailers = await User.find({ userType: "Retailer" })
      .sort({ points: -1 }) // Sort by points in descending order
      .limit(50); // Limit to top 50 retailers

    res.status(200).send(retailers);
  } catch (error) {
    res.status(500).send({ message: "Error fetching retailers" });
  }
});
module.exports = router;
