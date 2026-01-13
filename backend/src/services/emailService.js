import * as brevo from '@getbrevo/brevo';

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, firstName, otp) => {
  try {
    // Create a new API instance for each request
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = "Verify Your Laundry Planet Account";
    sendSmtpEmail.to = [{ email: email, name: firstName }];
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .otp-box {
            background-color: #f0f9ff;
            border: 2px dashed #3b82f6;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .message {
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧺 Laundry Planet</div>
            <h2 style="color: #1f2937; margin: 0;">Email Verification</h2>
          </div>
          
          <p class="message">Hi <strong>${firstName}</strong>,</p>
          
          <p class="message">
            Thank you for signing up with Laundry Planet! To complete your registration, 
            please use the following One-Time Password (OTP) to verify your email address.
          </p>
          
          <div class="otp-box">
            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code</p>
            <div class="otp-code">${otp}</div>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">Valid for 10 minutes</p>
          </div>
          
          <p class="message">
            Enter this code on the verification page to activate your account and start 
            using our laundry services.
          </p>
          
          <div class="warning">
            <strong>⚠️ Security Note:</strong> Never share this code with anyone. 
            Laundry Planet will never ask for your OTP via phone or email.
          </div>
          
          <p class="message">
            If you didn't create an account with Laundry Planet, please ignore this email.
          </p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Laundry Planet. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    sendSmtpEmail.sender = { 
      name: "Laundry Planet", 
      email: process.env.BREVO_SENDER_EMAIL || "noreply@laundryplanet.com" 
    };

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('OTP email sent successfully:', data);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send welcome email after successful verification
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    // Create a new API instance for each request
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = "Welcome to Laundry Planet! 🎉";
    sendSmtpEmail.to = [{ email: email, name: firstName }];
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .message {
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .features {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature-item {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .feature-item:last-child {
            border-bottom: none;
          }
          .cta-button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧺 Laundry Planet</div>
            <h2 style="color: #1f2937; margin: 0;">Welcome Aboard!</h2>
          </div>
          
          <p class="message">Hi <strong>${firstName}</strong>,</p>
          
          <p class="message">
            🎉 Congratulations! Your email has been successfully verified and your account is now active.
          </p>
          
          <p class="message">
            We're excited to have you join our laundry community. With Laundry Planet, managing your 
            laundry has never been easier!
          </p>
          
          <div class="features">
            <h3 style="color: #1f2937; margin-top: 0;">What's Next?</h3>
            <div class="feature-item">
              <strong>✓ Complete Your Profile</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Add your address and contact details for seamless service</span>
            </div>
            <div class="feature-item">
              <strong>✓ Place Your First Order</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Choose from our various laundry services</span>
            </div>
            <div class="feature-item">
              <strong>✓ Track Your Orders</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Monitor pickup, processing, and delivery in real-time</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/client" class="cta-button">
              Go to Dashboard
            </a>
          </div>
          
          <p class="message">
            Need help getting started? Feel free to contact our support team anytime!
          </p>
          
          <div class="footer">
            <p><strong>Laundry Planet</strong></p>
            <p>Making laundry day easier, one load at a time</p>
            <p>© ${new Date().getFullYear()} Laundry Planet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    sendSmtpEmail.sender = { 
      name: "Laundry Planet", 
      email: process.env.BREVO_SENDER_EMAIL || "noreply@laundryplanet.com" 
    };

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Welcome email sent successfully:', data);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};
