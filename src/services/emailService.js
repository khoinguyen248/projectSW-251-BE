import nodemailer from 'nodemailer';
import emailconfigs from '../model/emailconfig.js';

// Lấy email config từ database
async function getEmailConfig() {
  try {
    const config = await emailconfigs.findOne({ isActive: true });
    
    if (!config) {
      throw new Error('No active email configuration found');
    }

    // Check và reset daily limit
    await config.checkAndResetDailyLimit();
    
    if (config.usedToday >= config.dailyLimit) {
      throw new Error('Daily email limit reached');
    }

    return config;
  } catch (error) {
    console.error('Get email config error:', error.message);
    return null;
  }
}

export async function sendVerificationEmail(email, token, userId) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&userId=${userId}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5; text-align: center;">Xác thực Email - Hệ thống Tutor</h2>
      <p>Xin chào,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống Tutor!</p>
      <p>Vui lòng click vào nút bên dưới để xác thực email của bạn:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
           XÁC THỰC EMAIL
        </a>
      </div>
      
      <p>Hoặc copy và dán link này vào trình duyệt:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
        ${verificationUrl}
      </p>
      
      <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
    </div>
  `;

  try {
    // Lấy config từ database
    const config = await getEmailConfig();
    
    if (config) {
      // Có config - gửi email thật
      const transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
      });

      await transporter.sendMail({
        from: `"Tutor System" <${config.email}>`,
        to: email,
        subject: 'Xác thực email - Hệ thống Tutor',
        html: emailHtml,
      });

      // Update usage counter
      await emailconfigs.findByIdAndUpdate(config._id, {
        $inc: { usedToday: 1 }
      });

      console.log(`✅ Email thật đã gửi đến ${email} từ ${config.email}`);
      return true;
    }
    
    // Không có config - fallback to development mode
    console.log('🎯 [DEVELOPMENT] Verification Email Details:');
    console.log('   To:', email);
    console.log('   Verification URL:', verificationUrl);
    console.log('   Token:', token);
    console.log('   User ID:', userId);
    console.log('   💡 Setup email: POST /api/email-config/setup');
    
    return true;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Fallback: vẫn log thông tin
    console.log('🔄 FALLBACK - Verification details:');
    console.log('   Email:', email);
    console.log('   Verification URL:', verificationUrl);
    
    return true;
  }
}

export async function sendEmail({ to, subject, html }) {
  try {
    const config = await getEmailConfig();
    
    if (config) {
      const transporter = nodemailer.createTransport({
        service: config.service,
        auth: { user: config.email, pass: config.appPassword },
      });

      await transporter.sendMail({
        from: `"Tutor System" <${config.email}>`,
        to,
        subject,
        html,
      });

      // Update usage
      await emailconfigs.findByIdAndUpdate(config._id, { $inc: { usedToday: 1 } });
      console.log(`✅ Email sent to ${to}`);
      return true;
    } 
    
    // Fallback log nếu chưa cấu hình email thật
    console.log('🎯 [DEV - Email Simulation]');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    return true;

  } catch (error) {
    console.error('❌ Send email failed:', error.message);
    return false;
  }
}