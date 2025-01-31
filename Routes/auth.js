const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const { sendResetPasswordEmail } = require('../utils/email');
const crypto = require('crypto');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, status } = req.body;
        console.log('Request body received:', {
            username,
            email,
            password: password ? 'exists' : 'missing',
            status
        });
        
        // Check if all required fields exist
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email, dan password harus diisi',
                received: {
                    username: !!username,
                    email: !!email,
                    password: !!password
                }
            });
        }

        // Check existing user with more detail
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.status(400).json({
                message: 'Username atau email sudah terdaftar',
                conflict: {
                    username: existingUser.username === username,
                    email: existingUser.email === email
                }
            });
        }

        const hashedPassword = await hashPassword(password);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            status: status || 'active'
        });
        
        await user.save();
        const token = generateToken(user._id);
        res.status(201).json({ 
            message: 'Registrasi berhasil',
            user: {
                username: user.username,
                email: user.email,
                status: user.status
            }, 
            token 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Error saat registrasi',
            error: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || !(await comparePassword(password, user.password))) {
            throw new Error('Invalid login credentials');
        }
        
        const token = generateToken(user._id);
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }

});
// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;
        console.log('Received username:', username);

        const user = await User.findOne({ username });
        console.log('Found user:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({
                message: 'Username tidak ditemukan'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log('Generated reset token');

        // Update user with reset token
        try {
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 jam
            await user.save();
            console.log('Saved reset token to user');
        } catch (saveError) {
            console.error('Error saving reset token:', saveError);
            throw new Error('Gagal menyimpan reset token');
        }

        // Kirim email reset
        try {
            console.log('Attempting to send email to:', user.email);
            await sendResetPasswordEmail(user.email, resetToken);
            console.log('Email sent successfully');
            
            res.json({
                message: 'Email reset password telah dikirim'
            });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Rollback token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            throw new Error('Gagal mengirim email reset');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            message: 'Error saat memproses permintaan forgot password',
            error: error.message
        });
    }
});
// Verify Reset Token
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Token reset password tidak valid atau sudah kadaluarsa'
            });
        }

        res.json({ 
            message: 'Token valid',
            username: user.username 
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error saat verifikasi token'
        });
    }
});
// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Token reset password tidak valid atau sudah kadaluarsa'
            });
        }

        const { password } = req.body;
        const hashedPassword = await hashPassword(password);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            message: 'Password berhasil direset'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error saat reset password'
        });
    }
});
module.exports = router;