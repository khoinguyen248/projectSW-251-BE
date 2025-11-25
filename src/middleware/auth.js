import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing access token' });
  }
  const token = header.slice(7);
  try {
    const decoded = verifyToken(token); // ← Xóa tham số 'access'
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// CSRF double-submit
export function requireCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();
  const headerToken = req.get("X-CSRF-Token");
  const cookieToken = req.cookies?.csrf;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  next();
}
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}