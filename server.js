import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import morgan from "morgan";
import cookieParser from 'cookie-parser';


dotenv.config();

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors:{
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
})

//Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));


//Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);


//Error handler
app.use(errorHandler);


//Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        
    });
});


//MongoDB connection

mongoose.connect(process.env.MONGO_URI)
   .then(() => console.log('Connected to MongoDB'))
   .catch((error) => console.error('MongoDB connection error '));


const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}) 