interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Determine the API URL based on environment
    let apiUrl: string;
    
    if (import.meta.env.PROD) {
      // Production (Netlify) environment
      apiUrl = '/.netlify/functions/send-email';
    } else {
      // Development environment - use local Express server
      apiUrl = 'http://localhost:3001/api/send-email';
    }
    
    console.log(`Using API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
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
  appName: string = 'MCCI Tax Refund System'
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're Invited to Test ${appName}!</h2>
      
      <p>Hello ${testerName},</p>
      
      <p>Thank you for signing up to be a beta tester. You've been selected to participate in our beta testing program!</p>
      
      <p><strong>Important:</strong> The testing link will be sent by the Google Playstore or Apple Store and will be made available as from 
      the <span style="color: #F59E0B; font-weight: bold;">June 23rd, 2025</span>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <h3 style="color: #333; margin-top: 0;">📱 How to Install the Mobile App - Step by Step Guide</h3>
        
        <div style="margin-bottom: 30px;">
          <h4 style="color: #333; margin-bottom: 15px; background-color: #e8f5e8; padding: 10px; border-radius: 5px;">🤖 For Android Phone Users (Samsung, Google Pixel, etc.):</h4>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 1: Find the Google Play Store</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Look for the colorful triangle icon on your phone's home screen<br>
              • It's usually labeled "Play Store" or "Google Play"<br>
              • If you can't find it, swipe up from the bottom of your screen to see all apps
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 2: Open the Play Store</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Tap once on the Play Store icon<br>
              • Wait for it to load (this may take a few seconds)
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 3: Search for the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • At the top of the screen, you'll see a search bar<br>
              • Tap on it and type: "<strong>${appName}</strong>"<br>
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 4: Install the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Find "${appName}" in the search results<br>
              • Tap on it to open the app page<br>
              • Make sure that the following is written "${appName} - (Internal Beta)"<br>
              • The following notice should also be displayed: "You're an internal tester. This appmay be unsecure and unstable."<br>
              • Tap the <strong>"Install"</strong> button<br>
              • Wait for the download to complete (you'll see a progress bar)
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 5: Open the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Once installed, tap <strong>"Open"</strong> or find the app icon on your home screen<br>
              • The app is now ready to use!
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333; margin-bottom: 15px; background-color: #e8f0ff; padding: 10px; border-radius: 5px;">🍎 For iPhone/iPad Users - TestFlight Installation:</h4>
          
          <div style="background-color: #fff9e6; padding: 12px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ffa500;">
            <p style="margin: 0; font-size: 14px; color: #b8860b;">
              <strong>📧 Important:</strong> You will receive TWO separate emails from Apple for the TestFlight process. Please follow both!
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 1: Accept the First Invitation</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • You will receive an email invitation from Apple<br>
              • Open the email and tap <strong>"Accept Invitation"</strong><br>
              • This will take you to a webpage where you need to sign in
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 2: Sign in with Your Apple ID</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Enter your Apple ID email address<br>
              • Enter your Apple ID password<br>
              • Complete any two-factor authentication if prompted<br>
              • <em>This is the same Apple ID you use for the App Store</em>
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 3: Wait for the Second Email</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • After signing in, our developer will add you to the specific app testing group<br>
              • You will receive a <strong>second email</strong> from Apple<br>
              • This second email will have instructions to download TestFlight<br>
              • <em>This may take a few minutes to arrive</em>
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 4: Download TestFlight App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Look for the blue "App Store" icon on your home screen<br>
              • Tap to open it<br>
              • Search for "TestFlight" (it's a free app by Apple)<br>
              • Tap <strong>"Get"</strong> to download it<br>
              • Wait for it to install completely
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 5: Open TestFlight and Find the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Open the TestFlight app (blue icon with white airplane)<br>
              • You should see "${appName}" listed in your available apps<br>
              • If you don't see it, wait a few more minutes and refresh<br>
              • Tap on "${appName}" when it appears
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 6: Install the Beta App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • In TestFlight, tap the <strong>"Install"</strong> button next to "${appName}"<br>
              • Wait for the download to complete (you'll see a progress circle)<br>
              • The app icon will appear on your home screen when ready
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 7: Open and Use the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Find the "${appName}" icon on your home screen<br>
              • Tap to open it<br>
              • The app is now ready to use for testing!<br>
              • <em>You can also open it directly from TestFlight</em>
            </p>
          </div>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border: 1px solid #ffeaa7;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>⚠️ Important Notes:</strong><br>
            • This is a test version of the app, so it might have some bugs<br>
            • Please report any problems you find - your feedback helps us improve!<br>
            • The app is free to download and use<br>
            • You won't be charged anything for participating in this beta test
          </p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin-top: 15px; border: 1px solid #bee5eb;">
          <p style="margin: 0; font-size: 14px; color: #0c5460;">
            <strong>🆘 Need Help?</strong><br>
            If you get stuck at any step or have questions:<br>
            • Ask a tech-savvy friend or family member to help<br>
            • Contact <a href="mailto:shane.permalloo@mns.mu">MNS team</a> - we're here to help!<br>
          </p>
        </div>
      </div>
      
      <p>You can access the beta version of our app on ${platformName} by clicking the link below:</p>
      
      <p>We appreciate your help in making our app better!</p>
      
      <p>Best regards,<br>The MNS Team</p>
    </div>
  `;
};

export const generateFeedbackInvitationEmailContent = (
  testerName: string,
  feedbackUrl: string,
  appName: string = 'MCCI Tax Refund System'
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>We Need Your Feedback on ${appName}!</h2>
      
      <p>Hello ${testerName},</p>
      
      <p>Thank you for being part of our beta testing program! Your experience and insights are invaluable to us.</p>
      
      <p>We would love to hear about your experience using the <strong>${appName}</strong> app. Your feedback helps us improve the app and make it better for everyone.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <h3 style="color: #333; margin-top: 0;">💬 Share Your Feedback</h3>
        
        <p style="margin-bottom: 15px;">Please take a few minutes to share your thoughts about:</p>
        
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li style="margin-bottom: 8px;">What features you liked most</li>
          <li style="margin-bottom: 8px;">Any bugs or issues you encountered</li>
          <li style="margin-bottom: 8px;">Suggestions for improvements</li>
          <li style="margin-bottom: 8px;">Overall user experience</li>
          <li style="margin-bottom: 8px;">Any other comments or observations</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${feedbackUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
          📝 Submit Your Feedback
        </a>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; border: 1px solid #c3e6c3; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #2c5530;">
          <strong>🎯 Why Your Feedback Matters:</strong><br>
          • Helps us identify and fix bugs before the official release<br>
          • Guides us in improving user experience and app functionality<br>
          • Ensures the app meets the needs of our users<br>
          • Makes you a valuable contributor to the app's development
        </p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border: 1px solid #ffeaa7; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>⏰ Quick & Easy:</strong><br>
          The feedback form is designed to be quick and easy to complete. It should only take a few minutes of your time, but your input will have a lasting impact on the app's quality.
        </p>
      </div>
      
      <p>If you have any technical issues accessing the feedback form or need assistance, please don't hesitate to contact us.</p>
      
      <p>Thank you for your time and for being an essential part of our beta testing community!</p>
      
      <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #bee5eb;">
        <p style="margin: 0; font-size: 14px; color: #0c5460;">
          <strong>🆘 Need Help?</strong><br>
          If you have any questions or need assistance:<br>
          • Contact <a href="mailto:shane.permalloo@mns.mu" style="color: #0c5460;">MNS team</a> - we're here to help!<br>
        </p>
      </div>
      
      <p>Best regards,<br>The MNS Team</p>
    </div>
  `;
};
