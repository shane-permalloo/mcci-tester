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
  appName: string = 'MCCI Tax Refund System'
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're Invited to Test ${appName}!</h2>
      
      <p>Hello ${testerName},</p>
      
      <p>Thank you for signing up to be a beta tester. You've been selected to participate in our beta testing program!</p>
      
      <p><strong>Important:</strong> The testing link will be sent by the Google Playstore or Apple Store and will be made available as from 
      the <span style="color: #F59E0B; font-weight: bold;">June 23rd, 2025</span>.</p>

      <p><strong>Important:</strong> Once you have accepted the invitation, you will be able to access the app from the ${platformName} store.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <h3 style="color: #333; margin-top: 0;">📱 How to Install the Mobile App - Step by Step Guide</h3>
        
        <div style="margin-bottom: 30px;">
          <h4 style="color: #333; margin-bottom: 15px; background-color: #e8f5e8; padding: 10px; border-radius: 5px;">🤖 For Android Phone Users (Samsung, Google Pixel, etc.):</h4>
          
          <div style="background-color: #fff9e6; padding: 12px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ffa500;">
            <p style="margin: 0; font-size: 14px; color: #b8860b;">
              <strong>📧 Important:</strong> You will receive a separate email with a special Google Play testing link. Please check your email!
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 1: Check Your Email for the Testing Link</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Look for an email from Google Play or MNS team<br>
              • The email will contain a special link to join the internal testing program<br>
              • This link looks like: "https://play.google.com/apps/testing/[app-package-name]"
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 2: Join the Internal Testing Program</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Tap on the testing link from your email<br>
              • This will open a webpage in your browser<br>
              • Tap <strong>"Become a tester"</strong> button<br>
              • You'll see a confirmation that you've joined the testing program
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 3: Download from Google Play Store</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • After joining, tap <strong>"Download it on Google Play"</strong> on the same webpage<br>
              • This will open the Google Play Store app<br>
              • Alternatively, find the colorful triangle "Play Store" icon on your phone
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 4: Install the Beta App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • You can search for the "${appName}" in the search bar<br>
              • You should now see "${appName}" in the Play Store<br>
              • Watch out for the "(Internal Beta)" label next to the app name<br>
              • Look for text saying "You're a beta tester for this app"<br>
              • Tap the <strong>"Install"</strong> button<br>
              • Wait for the download to complete (you'll see a progress bar)
              • PS: <strong>If the previous application was installed</strong>, you may need to manually uninstall it first to avoid any issues.
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c5530;">Step 5: Open and Use the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Once installed, tap <strong>"Open"</strong> or find the app icon on your home screen<br>
              • The app is now ready to use for testing!<br>
              • You may see a "Beta" label on the app icon
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333; margin-bottom: 15px; background-color: #e8f0ff; padding: 10px; border-radius: 5px;">🍎 For IOS Users - TestFlight Installation:</h4>
          
          <div style="background-color: #fff9e6; padding: 12px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ffa500;">
            <p style="margin: 0; font-size: 14px; color: #b8860b;">
              <strong>📧 Important:</strong> You will receive a TestFlight invitation email from Apple. Please check your email!
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 1: Download TestFlight App First</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Find the blue "App Store" icon on your home screen and tap it<br>
              • Search for "TestFlight" (it's a free app by Apple)<br>
              • Tap <strong>"Get"</strong> to download TestFlight<br>
              • Wait for it to install completely
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 2: Check Your Email for TestFlight Invitation</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Look for an email from "TestFlight" or "App Store Connect"<br>
              • The subject will be something like "You're invited to test ${appName}"<br>
              • Open this email on your iPhone (not on a computer)
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 3: Accept the TestFlight Invitation</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • In the invitation email, tap <strong>"View in TestFlight"</strong> or <strong>"Start Testing"</strong><br>
              • This will open the TestFlight app automatically<br>
              • If prompted, tap <strong>"Accept"</strong> to join the beta test
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 4: Install the Beta App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • In TestFlight, you should see "${appName}" listed<br>
              • Tap the <strong>"Install"</strong> button next to the app<br>
              • Wait for the download to complete (you'll see a progress circle)<br>
              • The app icon will appear on your home screen when ready
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a365d;">Step 5: Open and Use the App</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              • Find the "${appName}" icon on your home screen and tap it<br>
              • The app is now ready to use for testing!<br>
              • You'll see a small orange dot on the app icon indicating it's a beta version<br>
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
