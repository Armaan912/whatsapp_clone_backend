import { body, validationResult } from 'express-validator';

export const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('mobile')
    .trim()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid mobile number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

export const validateLogin = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateMessage = [
  body('conversationId')
    .isMongoId()
    .withMessage('Invalid conversation ID'),
  
  body('receiverId')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  
  body('text')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message text cannot exceed 1000 characters')
];

export const validateConversation = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

export const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('profilePic')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};
