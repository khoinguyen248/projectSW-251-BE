import bcrypt from "bcrypt"; 

import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";
import { randomId } from "../libs/secureRandom.js";
import Account from "../model/account.js";
import TutorProfile from "../model/tutor.js";
import StudentProfile from "../model/students.js";
import refreshtoken from "../model/refreshtoken.js";
import verificationToken from "../model/verificationToken.js";
import { sendVerificationEmail } from "../services/emailService.js";

const { REFRESH_EXPIRES, COOKIE_DOMAIN, NODE_ENV } = process.env;

// ----------------- Validation helpers -----------------
/**
 * Validate username (local-part before @ if email provided)
 * Rules:
 * - Required string
 * - min 3 chars, max 22 chars
 * - allowed chars: letters, numbers, dot, underscore, hyphen
 * - no more than 3 repeating same char consecutively
 * - no spaces
 */
function validateUsername(input) {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Tên đăng nhập không được bỏ trống" };
  }

  const email = input.trim();
  const local = email.includes("@") ? email.split("@")[0] : email;
  const username = local;

  if (username.length < 3) {
    return { valid: false, error: "Tên đăng nhập phải có ít nhất 3 ký tự" };
  }
  if (username.length > 22) {
    return { valid: false, error: "Tên đăng nhập không được vượt quá 22 ký tự" };
  }

  if (username.includes(" ")) {
    return { valid: false, error: "Tên đăng nhập không được chứa dấu cách" };
  }

  const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validUsernameRegex.test(username)) {
    return { valid: false, error: "Tên đăng nhập chỉ được chứa chữ cái, số, ., _ và -" };
  }

  // disallow 4 or more repeating chars (e.g. "aaaa")
  const repeatingCharPattern = /(.)\1{3,}/;
  if (repeatingCharPattern.test(username)) {
    return { valid: false, error: "Tên đăng nhập không được có ký tự lặp lại liên tiếp quá 3 lần" };
  }

  return { valid: true, error: null };
}

/**
 * Validate password
 * Rules:
 * - Required string
 * - min 6 chars, max 32 chars
 * - no spaces allowed
 */
function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Mật khẩu không được bỏ trống" };
  }
  if (password.length < 6) {
    return { valid: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }
  if (password.length > 32) {
    return { valid: false, error: "Mật khẩu không được vượt quá 32 ký tự" };
  }
  if (password.includes(" ")) {
    return { valid: false, error: "Mật khẩu không được chứa khoảng cách" };
  }
  return { valid: true, error: null };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email không được bỏ trống" };
  }
  const e = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(e)) {
    return { valid: false, error: "Email không hợp lệ" };
  }
  return { valid: true, error: null };
}
// -------------------------------------------------------

function setRefreshCookie(res, token) {
  const maxAgeMs =
    (REFRESH_EXPIRES?.endsWith("d") ? parseInt(REFRESH_EXPIRES) : 30) *
    24 * 60 * 60 * 1000;
    
  res.cookie("rt", token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    domain: COOKIE_DOMAIN || undefined,
    path: "/", // ← Sửa thành "/" để có thể gửi đến tất cả routes
    maxAge: maxAgeMs
  });
}


function clearRefreshCookie(res) {
  res.clearCookie("rt", {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    domain: COOKIE_DOMAIN || undefined,
    path: "/" // ← Sửa thành "/"
  });
}

const authController = {
  // ─────────────────────────────────────────────
  async csrfMethod(req, res) {
    const token = randomId();
    res.cookie("csrf", token, {
      httpOnly: false,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      domain: COOKIE_DOMAIN || undefined,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ csrfToken: token });
  },

  // ─────────────────────────────────────────────
async signupMethod(req, res) {
    try {
      const { email, password, role } = req.body || {};
      
      // Validate input basic presence
      if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password and role are required" });
      }
      
      if (!["TUTOR", "STUDENT"].includes(role)) {
        return res.status(400).json({ message: "Role must be TUTOR or STUDENT" });
      }

      // ---- New: validate username (local part), email and password ----
      const usernameValidation = validateUsername(email);
      if (!usernameValidation.valid) {
        return res.status(400).json({ message: usernameValidation.error });
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.error });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.error });
      }
      // ----------------------------------------------------------------

      // Check if email already exists
      const exists = await Account.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password and create account
      const hash = await bcrypt.hash(password, 12);
      const user = await Account.create({ 
        email: email.toLowerCase().trim(), 
        password: hash, 
        role,
        isVerified: false 
      });

      // Tạo verification token - SỬA TÊN BIẾN
      const tokenValue = randomId(); // ĐỔI TÊN BIẾN
      await verificationToken.create({
        userId: user._id,
        token: tokenValue, // DÙNG BIẾN MỚI
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      });

      // Gửi verification email
      await sendVerificationEmail(email, tokenValue, user._id);

      // Tạo profile
      if (role === "TUTOR") {
        await TutorProfile.create({ accountId: user._id, fullName: "", subjectSpecialty: [] });
      } else {
        await StudentProfile.create({ accountId: user._id, fullName: "" });
      }

      return res.status(201).json({ 
        message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
        requiresVerification: true
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ─────────────────────────────────────────────
  async loginMethod(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const user = await Account.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
 if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Email chưa được xác thực. Vui lòng kiểm tra hộp thư." 
      });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { sub: String(user._id), email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);

    const jti = randomId();
    const refreshToken = signRefreshToken({ ...payload, jti });
    const rtHash = await bcrypt.hash(refreshToken, 12);
    const { exp } = verifyToken(refreshToken);
    await refreshtoken.create({
      userId: user._id,
      jti,
      tokenHash: rtHash,
      expiresAt: new Date(exp * 1000)
    });
    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      account: { id: user._id, email: user.email, role: user.role }
    });
  },

  // ─────────────────────────────────────────────
  async refreshMethod(req, res) {
    const token = req.cookies?.rt;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const record = await refreshtoken.findOne({ jti: decoded.jti, userId: decoded.sub });
    if (!record || record.revoked)
      return res.status(401).json({ message: "Refresh revoked" });

    const match = await bcrypt.compare(token, record.tokenHash);
    if (!match) return res.status(401).json({ message: "Refresh mismatch" });

    record.revoked = true;
    await record.save();

    const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role };
    const accessToken = signAccessToken(payload);

    const newJti = randomId();
    const newRt = signRefreshToken({ ...payload, jti: newJti });
    const { exp } = verifyToken(newRt);
    await refreshtoken.create({
      userId: decoded.sub,
      jti: newJti,
      tokenHash: await bcrypt.hash(newRt, 12),
      expiresAt: new Date(exp * 1000)
    });
    setRefreshCookie(res, newRt);

    return res.json({ accessToken });
  },
  
  
  // ─────────────────────────────────────────────
  async logoutMethod(req, res) {
    const token = req.cookies?.rt;
    if (token) {
      try {
        const { jti, sub } = verifyToken(token);
        await refreshtoken.updateOne({ jti, userId: sub }, { $set: { revoked: true } });
      } catch {}
    }
    clearRefreshCookie(res);
    return res.json({ message: "Logged out" });
  },

  // ─────────────────────────────────────────────
  async meMethod(req, res) {
    return res.json({
      user: { id: req.user.sub, email: req.user.email, role: req.user.role }
    });
  },
    // ─────────────────────────────────────────────
  async verifyEmail(req, res){
    try {
       const { token, userId } = req.body;

    // Tìm verification token
    const verification = await verificationToken.findOne({
      token,
      userId,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({ 
        message: "Token không hợp lệ hoặc đã hết hạn" 
      });
    }

    // Cập nhật account thành đã xác thực
    await Account.findByIdAndUpdate(userId, { isVerified: true });
    
    // Xóa verification token đã dùng
    await verificationToken.deleteOne({ _id: verification._id });

    return res.json({ 
      message: "Email đã được xác thực thành công!",
      verified: true 
    });
    } catch (error) {
       console.error("Verify email error:", error);
    return res.status(500).json({ message: "Internal server error" });
    }
  },
  async resendVerification(req,res){
    try {
       const { email } = req.body;
    
    console.log("🔄 Resend verification requested for:", email);

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    // Tìm account bằng email
    const account = await Account.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!account) {
      // Trả về success ngay cả khi email không tồn tại (bảo mật)
      console.log("📧 Email not found, but returning success for security");
      return res.json({ 
        message: "Nếu email tồn tại, chúng tôi đã gửi liên kết xác thực mới" 
      });
    }

    // Kiểm tra nếu email đã được xác thực
    if (account.isVerified) {
      return res.status(400).json({ 
        message: "Email này đã được xác thực" 
      });
    }

    // Xóa verification token cũ (nếu có)
    await verificationToken.deleteMany({ userId: account._id });

    // Tạo verification token mới
    const newToken = randomId();
    await verificationToken.create({
      userId: account._id,
      token: newToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });

    // Gửi email xác thực mới
    await sendVerificationEmail(email, verificationToken, account._id);

    console.log("✅ Resent verification email to:", email);

    return res.json({ 
      message: "Đã gửi email xác thực mới. Vui lòng kiểm tra hộp thư.",
      email: email // Optional: để frontend confirm
    });
    } catch (error) {
        console.error("❌ Resend verification error:", error);
    return res.status(500).json({ 
      message: "Lỗi hệ thống. Vui lòng thử lại sau." 
    });
    }
  }
};

export default authController;
