const nodemailer = require('nodemailer');

// Create transporter outside the handler for potential reuse
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL, // Use environment variables
    pass: process.env.BREVO_PASSWORD // This is the SMTP password, not API key
  }
});

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body);
    
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, or html' 
        })
      };
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
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: info.messageId })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};


