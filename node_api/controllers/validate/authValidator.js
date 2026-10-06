import Joi from 'joi';
import dotenv from 'dotenv';
dotenv.config({path:'./config/.env'});
import jwt from 'jsonwebtoken';
import mysqlDb from '../../database/mysql.js';

export const registerValidator = async (data) => {
  try {
    const { email, username } = data;

    // Check if user already exists
    const [existingUsers] = await mysqlDb.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username || '']
    );

    if (existingUsers.length > 0) {
      return {
        success: false,
        status: 409,
        message: 'User already exists with these credentials.',
        errors: []
      };
    }

    // Joi validation schema
    const authSchema = Joi.object({
      name: Joi.string().min(4).max(50).required(),
      email: Joi.string().email().required(),
      username: Joi.string().allow('').optional(),
      password: Joi.string()
        .min(6)
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$'))
        .required()
        .messages({
          'string.pattern.base': 'Password must be 6-30 characters and contain only letters, numbers, and !@#$%^&*'
        }),
      // phone: Joi.string().min(8).max(15).optional(),
      from_where: Joi.string().valid('manual', 'google', 'facebook').optional()
    }).options({ allowUnknown: false });

    const { error } = authSchema.validate(data);

    if (error) {
      const errorMessage = error.details[0].message.replace(/"/g, '');
      return {
        success: false,
        status: 400,
        message: errorMessage,
        errors: error.details
      };
    }

    return {
      success: true,
      status: 200,
      message: 'Validation successful.',
      errors: []
    };

  } catch (error) {
    console.error('Validation Error:', error.message);
    return {
      success: false,
      status: 500,
      message: 'Internal validation error.',
      errors: []
    };
  }
};

export const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'access-secret-key',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY }
  );
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );
};
