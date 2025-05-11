import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User
export const registerUser = async (req, res) => {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) return res.status(400).json({ message: "Username already exists" });

        const emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error("Error in registerUser:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Login User
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error("Error in loginUser:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};
