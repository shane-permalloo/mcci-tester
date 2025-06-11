import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware with more permissive CORS settings
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL || 'your-actual-brevo-email@example.com',
    pass: process.env.BREVO_PASSWORD || 'your-actual-brevo-password'
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    console.log('Received email request:', req.body);
    const { to, subject, html } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, or html' 
      });
    }
    
    const mailOptions = {
      from: '"Beta Testing Team" <no-reply@yourdomain.com>',
      to,
      subject,
      html
    };
    
    console.log('Sending email with options:', mailOptions);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent to ${to} via Brevo:`, info);
    
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


