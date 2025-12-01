import emailconfigs from "../model/emailconfig.js";

// Biến cứng cấu hình email
const HARDCODED_EMAIL_CONFIG = {
  email: "nguyenminhkhoi24082005@gmail.com", // Thay bằng email của bạn
  appPassword: "lnci qvkh gtjo acdg", // Thay bằng app password của bạn
  service: "gmail" // Có thể thay đổi thành service khác nếu cần
};

export async function setupEmailConfig(req, res) {
  try {
    // Sử dụng biến cứng thay vì lấy từ body
    const { email, appPassword, service } = HARDCODED_EMAIL_CONFIG;

    if (!email || !appPassword) {
      return res.status(400).json({ 
        message: "Email và App Password là bắt buộc" 
      });
    }

    // Deactivate all other configs
    await emailconfigs.updateMany({}, { isActive: false });

    // Create new config
    const emailConfig = await emailconfigs.create({
      service,
      email,
      appPassword,
      isActive: true
    });

    // Test connection
    const testResult = await testEmailConnection(emailConfig);
    
    if (!testResult.success) {
      await emailconfigs.findByIdAndDelete(emailConfig._id);
      return res.status(400).json({ 
        message: "Email configuration failed: " + testResult.error 
      });
    }

    res.json({ 
      message: "Email configuration setup successfully!",
      config: {
        id: emailConfig._id,
        email: emailConfig.email,
        service: emailConfig.service,
        isActive: emailConfig.isActive
      }
    });

  } catch (error) {
    console.error("Setup email config error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Email already configured" 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error" 
    });
  }
}

export async function getEmailConfig(req, res) {
  try {
    const config = await emailconfigs.findOne({ isActive: true })
      .select('email service isActive usedToday dailyLimit');
    
    if (!config) {
      return res.status(404).json({ 
        message: "No email configuration found" 
      });
    }

    res.json({ config });
  } catch (error) {
    console.error("Get email config error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateEmailConfig(req, res) {
  try {
    const { id } = req.params;
    const { email, appPassword, service, dailyLimit } = req.body;

    const config = await emailconfigs.findById(id);
    if (!config) {
      return res.status(404).json({ message: "Config not found" });
    }

    const updates = {};
    if (email) updates.email = email;
    if (appPassword) updates.appPassword = appPassword;
    if (service) updates.service = service;
    if (dailyLimit) updates.dailyLimit = dailyLimit;

    const updatedConfig = await emailconfigs.findByIdAndUpdate(
      id, 
      updates, 
      { new: true }
    ).select('-appPassword');

    res.json({ 
      message: "Email configuration updated",
      config: updatedConfig 
    });

  } catch (error) {
    console.error("Update email config error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Helper function to test email connection
async function testEmailConnection(config) {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.email,
        pass: config.appPassword,
      },
    });

    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Hàm mới để lấy thông tin cấu hình cứng
export function getHardcodedConfig() {
  return { ...HARDCODED_EMAIL_CONFIG };
}