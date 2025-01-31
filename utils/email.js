const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "2fc59b2d586dab",
        pass: "06888371ad2b55"
    }
});

const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Password Link',
        html: `
            <h1>Reset Password Request</h1>
            <p>Klik link di bawah ini untuk reset password anda:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>Link ini akan kadaluarsa dalam 1 jam.</p>
            <p>Jika anda tidak meminta reset password, abaikan email ini.</p>
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendResetPasswordEmail
};