import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const generateToKen = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET , {
        expiresIn: '30d'
    });
};


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const token = generateToKen(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        });

        res.status(201).json({
            user: user,
            message: "Registered successfully",
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password} = req.body;

        const user = await User.findOne({ email });
        
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToKen(user._id);

            res.cookie('token', token, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 30 * 24 * 60 * 60 * 1000, 
            });

            res.status(200).json({
                user: user,
                message: 'Login successful',
            });
          } else {
            res.status(401).json({ message: 'Invalid email or password' });
          }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


export const logout = (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out' });
    }
};
