// src/middleware/validation.js
import { body, param, query, validationResult } from 'express-validator';

// Helper function để check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ========== AUTH VALIDATIONS ==========

export const signupValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa chữ hoa, chữ thường và số'),
  
  body('role')
    .isIn(['TUTOR', 'STUDENT'])
    .withMessage('Role phải là TUTOR hoặc STUDENT'),
  
  validate
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
  
  validate
];

export const emailValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  validate
];

export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token không được để trống')
    .isLength({ min: 32, max: 32 })
    .withMessage('Token không hợp lệ'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa chữ hoa, chữ thường và số'),
  
  validate
];

// ========== PROFILE VALIDATIONS ==========

export const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải từ 2-100 ký tự'),
  
  body('subjectSpecialty')
    .optional()
    .isArray()
    .withMessage('Môn học phải là array'),
  
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Số năm kinh nghiệm phải từ 0-50'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Giá giờ học phải từ 0-1000'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Tiểu sử không được quá 500 ký tự'),
  
  body('grade')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Lớp học không được quá 50 ký tự'),
  
  body('schoolName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tên trường không được quá 200 ký tự'),
  
  validate
];

// ========== SESSION VALIDATIONS ==========

export const scheduleSessionValidation = [
  body('tutorId')
    .notEmpty()
    .withMessage('Tutor ID không được để trống')
    .isMongoId()
    .withMessage('Tutor ID không hợp lệ'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Môn học không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Môn học phải từ 2-100 ký tự'),
  
  body('startTime')
    .notEmpty()
    .withMessage('Thời gian bắt đầu không được để trống')
    .isISO8601()
    .withMessage('Thời gian bắt đầu không hợp lệ')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Thời gian bắt đầu phải trong tương lai');
      }
      return true;
    }),
  
  body('endTime')
    .notEmpty()
    .withMessage('Thời gian kết thúc không được để trống')
    .isISO8601()
    .withMessage('Thời gian kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      return true;
    }),
  
  validate
];

export const confirmSessionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Session ID không hợp lệ'),
  
  body('action')
    .isIn(['ACCEPT', 'REJECT'])
    .withMessage('Action phải là ACCEPT hoặc REJECT'),
  
  body('meetingLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Meeting link không hợp lệ'),
  
  validate
];

// ========== FEEDBACK VALIDATIONS ==========

export const addFeedbackValidation = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID không được để trống')
    .isMongoId()
    .withMessage('Session ID không hợp lệ'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating phải từ 1-5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment không được quá 500 ký tự'),
  
  validate
];

// ========== PROGRAM REGISTRATION VALIDATIONS ==========

export const registerProgramValidation = [
  body('programName')
    .trim()
    .notEmpty()
    .withMessage('Tên chương trình không được để trống')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên chương trình phải từ 2-200 ký tự'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được quá 500 ký tự'),
  
  validate
];

// ========== QUERY VALIDATIONS ==========

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  
  validate
];

export const searchTutorsValidation = [
  query('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject không được quá 100 ký tự'),
  
  query('minRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minRate phải là số dương'),
  
  query('maxRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxRate phải là số dương'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('minRating phải từ 0-5'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search không được quá 200 ký tự'),
  
  ...paginationValidation
];

// ========== ID VALIDATIONS ==========

export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ'),
  
  validate
];

export default {
  signupValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
  updateProfileValidation,
  scheduleSessionValidation,
  confirmSessionValidation,
  addFeedbackValidation,
  registerProgramValidation,
  paginationValidation,
  searchTutorsValidation,
  mongoIdValidation,
  validate
};
