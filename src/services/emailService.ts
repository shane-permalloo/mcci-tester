interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Make sure we're using the full URL including protocol and host
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }
    
    console.log(`Email sent to ${emailData.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const generateInvitationEmailContent = (
  testerName: string,
  platformName: string,
  invitationLink: string,
  appName: string = 'Our App'
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're Invited to Test ${appName}!</h2>
      
      <p>Hello ${testerName},</p>
      
      <p>Thank you for signing up to be a beta tester. You've been selected to participate in our beta testing program!</p>
      
      <p><strong>Important:</strong> The testing link will be available starting from <span style="color: #F59E0B; font-weight: bold;">June 23rd, 2025</span>.</p>
      
      <p>You can access the beta version of our app on ${platformName} by clicking the link below:</p>
      
      <p style="text-align: center;">
        <a href="${invitationLink}" style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Join Beta Test
        </a>
      </p>
      
      <p>Or copy this link: <a href="${invitationLink}">${invitationLink}</a></p>
      
      <p>We appreciate your help in making our app better!</p>
      
      <p>Best regards,<br>The Development Team</p>
    </div>
  `;
};





