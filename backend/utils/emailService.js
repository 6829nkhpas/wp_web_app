import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendWelcomeEmail(userEmail, userName, phoneNumber) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Welcome to WhatsApp Web Clone! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #25D366, #128C7E); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to WhatsApp Web Clone!</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #333;">Hi ${userName}! 👋</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Thank you for joining our WhatsApp Web Clone! Your account has been successfully created.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #25D366; margin: 20px 0;">
                <h3 style="color: #25D366; margin-top: 0;">Account Details:</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Phone Number:</strong> ${phoneNumber}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div style="margin: 30px 0;">
                <h3 style="color: #333;">What's Next?</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>🔗 Access your account at the web app</li>
                  <li>💬 Start chatting with your contacts</li>
                  <li>📱 Experience WhatsApp-like features</li>
                  <li>🔄 Real-time message synchronization</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Start Chatting Now
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
            
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
              <p>© 2025 WhatsApp Web Clone. Built with ❤️ using React & Node.js</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(userEmail, userName, verificationToken) {
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Verify your WhatsApp Web Clone account 📧',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #25D366, #128C7E); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Verify Your Account</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #333;">Hi ${userName}! 👋</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! Please click the button below to verify your email address and activate your account.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <span style="background: #f0f0f0; padding: 5px; border-radius: 3px; word-break: break-all;">${verificationUrl}</span>
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  ⚠️ This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                If you didn't create this account, please ignore this email.
              </p>
            </div>
            
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
              <p>© 2025 WhatsApp Web Clone. Built with ❤️ using React & Node.js</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return { success: true };
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
