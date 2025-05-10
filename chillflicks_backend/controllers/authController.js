import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User
export const registerUser = async (req, res) => {
    const { fullName, username, email, password } = req.body;

    // Check if required fields are missing
    if (!fullName || !username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Check if the user already exists
        const userExist = await User.findOne({ username });
        if (userExist) return res.status(400).json({ message: "Username already exists" });

        // Create new user (password will be hashed automatically by the model)
        const user = await User.create({
            fullName,
            username,
            email,
            password, // the password is stored as plaintext here, will be hashed in the model
        });

        // Create JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            token,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Login User
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    // Check if required fields are missing
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "No user found" });

        // Compare the plain text password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

        // Create JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({
            _id: user._id,
            username: user.username,
            token,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
