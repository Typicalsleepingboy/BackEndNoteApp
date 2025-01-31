require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./Config/database');
const path = require('path');
const authRoutes = require('./Routes/auth');
const noteRoutes = require('./Routes/note');
// const forgotPasswordLimiter = require('./Midlleware/rateLimitter');
const app = express();
// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);
// app.use('/auth/forgot-password', forgotPasswordLimiter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
