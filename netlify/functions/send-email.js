const nodemailer = require('nodemailer');

// Create transporter outside the handler for potential reuse
const createTransporter = () => {
  // Log environment variables availability (without exposing actual values)
  console.log('Environment variables check:');
  console.log('BREVO_EMAIL exists:', !!process.env.BREVO_EMAIL);
  console.log('BREVO_PASSWORD exists:', !!process.env.BREVO_PASSWORD);
  
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_EMAIL, // Use environment variables
      pass: process.env.BREVO_PASSWORD // This is the SMTP password, not API key
    }
  });
};

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  console.log('Function invoked with method:', event.httpMethod);
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    console.log('Request body:', event.body);
    const { to, subject, html } = JSON.parse(event.body);
    
    if (!to || !subject || !html) {
      console.log('Missing required fields');
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
    
    console.log('Creating transporter and sending email');
    const transporter = createTransporter();
    console.log('Mail options:', { to: mailOptions.to, subject: mailOptions.subject });
    
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
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
