import * as nodemailer from 'nodemailer';
import twilio from 'twilio';

// Debug environment variables
console.log('[Email Debug] EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('[Email Debug] EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
console.log('[Email Debug] SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
console.log('[Email Debug] SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'asserplatform@gmail.com',
    pass: 'dfij uzch cwtz plpi', // App password
  },
});

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    // Always try to send real emails now that we have Gmail configured
    console.log(`[Email] Attempting to send verification code to ${email}`);

    const mailOptions = {
      from: `"AsserCoin Platform" <asserplatform@gmail.com>`,
      to: email,
      subject: 'رمز التحقق - منصة AsserCoin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">منصة AsserCoin</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">رمز التحقق من البريد الإلكتروني</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              مرحباً بك في منصة AsserCoin! لإكمال عملية التسجيل، يرجى استخدام رمز التحقق التالي:
            </p>
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              هذا الرمز صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              منصة AsserCoin - منصة العملات الرقمية الموثوقة
            </p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`[Email] Verification code sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send code to ${email}:`, error);
    return false;
  }
}

export async function sendVerificationSMS(phone: string, code: string): Promise<boolean> {
  try {
    // In development, always use simulation for easier testing
    if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`[SMS Simulation] ✅ Code ${code} sent to ${phone} (simulated)`);
      return true; // Always succeed in development
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      // Assume Egyptian number if no country code
      formattedPhone = phone.startsWith('0') ? '+2' + phone.substring(1) : '+2' + phone;
    }

    const message = await twilioClient.messages.create({
      body: `رمز التحقق الخاص بمنصة AsserCoin هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.\n\nAsserCoin Platform`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`[SMS] Verification code sent successfully to ${phone}, Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`[SMS] Failed to send code to ${phone}:`, error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return false;
    }
    await emailTransporter.verify();
    console.log('[Email] SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('[Email] SMTP configuration error:', error);
    return false;
  }
}

// Test Twilio configuration
export async function testTwilioConfiguration(): Promise<boolean> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return false;
    }
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('[SMS] Twilio configuration is valid, Account:', account.friendlyName);
    return true;
  } catch (error) {
    console.error('[SMS] Twilio configuration error:', error);
    return false;
  }
}