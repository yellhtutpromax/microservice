import dotenv from 'dotenv';
dotenv.config({path:'./config/.env'});
import {responseSuccess, responseError} from "./helpers/httpResponse.js";
import {generateAccessToken, generateRefreshToken, registerValidator} from "./validate/authValidator.js";
import mysqlDb from "../database/mysql.js";
import bcrypt from "bcrypt";
import {generateRandomStr} from "./helpers/helper.js";
// const {httpCookieOptions} = require("../utils/constants");

export const register = async (req, res) => {
  let connection;
  try {
    // Validate input
    const validation = await registerValidator(req.body);
    if (!validation.success) {
      return res.status(validation.status).json(
        responseError(validation.status, validation.message, validation.errors)
      );
    }

    // Get connection from pool
    connection = await mysqlDb.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Generate tokens
    const username = generateRandomStr(14);
    const refreshToken = generateRefreshToken({ username, email: req.body.email });
    const accessToken = generateAccessToken({ username, email: req.body.email });

    // Insert user
    const [result] = await connection.query(
      `INSERT INTO users (name, username, email, password, from_where, auth_refresh_token, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        req.body.name,
        username,
        req.body.email,
        hashedPassword,
        req.body.from_where || 'manual',
        refreshToken,
        new Date().toISOString() // last_login_at
      ]
    );

    // Commit transaction
    await connection.commit();

    // Fetch created user (excluding password)
    const [users] = await connection.query(
      `SELECT id, name, username, email, email_verify, from_where, balance,
              is_ban, is_active, profile, created_at, updated_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    const newUser = {
      ...users[0],
      accessToken,
      refreshToken
    };

    return res.status(201).json(
      responseSuccess(201, 'User registered successfully.', newUser)
    );

  } catch (err) {
    // Rollback on error
    if (connection) {
      await connection.rollback();
    }

    console.error('Registration Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error during registration.', [])
    );
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json(
        responseError(400, 'Email and password are required.', [])
      );
    }

    // Find user
    const [users] = await mysqlDb.query(
      `SELECT id, name, username, email, password, email_verify, from_where, 
                    balance, is_ban, is_active, profile 
             FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json(
        responseError(401, 'Invalid email or password.', [])
      );
    }

    const user = users[0];

    // Check if user is banned or inactive
    if (user.is_ban) {
      return res.status(403).json(
        responseError(403, 'Your account has been banned.', [])
      );
    }

    if (!user.is_active) {
      return res.status(403).json(
        responseError(403, 'Your account is inactive.', [])
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(
        responseError(401, 'Invalid email or password.', [])
      );
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      email: user.email
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    // Update refresh token in database
    await mysqlDb.query(
      'UPDATE users SET auth_refresh_token = ? WHERE id = ?',
      [refreshToken, user.id]
    );

    // Remove password from response
    delete user.password;

    return res.status(200).json(
      responseSuccess(200, 'Login successful.', {
        ...user,
        accessToken,
        refreshToken
      })
    );

  } catch (err) {
    console.error('Login Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error during login.', [])
    );
  }
};

/**
 * Google OAuth Login/Register
 * Handles both registration and login in one endpoint
 */
export const googleAuth = async (req, res) => {
  let connection;
  try {
    const { googleToken, googleId, email, name, picture } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json(
        responseError(400, 'Email is required from Google auth.', [])
      );
    }

    // Optional: Verify Google token (recommended for production)
    // const googleUser = await verifyGoogleToken(googleToken);
    // if (!googleUser || googleUser.email !== email) {
    //     return res.status(401).json(
    //         responseError(401, 'Invalid Google token.', [])
    //     );
    // }

    connection = await mysqlDb.getConnection();

    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT id, name, username, email, password, from_where, is_ban, is_active FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // USER EXISTS - LOGIN
      user = existingUsers[0];

      // Check if user is banned or inactive
      if (user.is_ban) {
        return res.status(403).json(
          responseError(403, 'Your account has been banned.', [])
        );
      }

      if (!user.is_active) {
        return res.status(403).json(
          responseError(403, 'Your account is inactive.', [])
        );
      }

      // Update profile picture if provided
      if (picture) {
        await connection.query(
          'UPDATE users SET profile = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
          [picture, user.id]
        );
      } else {
        await connection.query(
          'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );
      }

    } else {
      // USER DOESN'T EXIST - REGISTER
      isNewUser = true;

      await connection.beginTransaction();

      const username = generateRandomStr(14);
      const randomPassword = await bcrypt.hash(generateRandomStr(20), 10);

      const [result] = await connection.query(
        `INSERT INTO users (name, username, email, password, from_where, profile, email_verify, last_login_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          name || 'Google User',
          username,
          email,
          randomPassword,
          'google',
          picture || null,
          1 // Email verified through Google
        ]
      );

      await connection.commit();

      // Fetch created user
      const [newUsers] = await connection.query(
        `SELECT id, name, username, email, from_where, is_ban, is_active 
                 FROM users WHERE id = ?`,
        [result.insertId]
      );

      user = newUsers[0];
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      email: user.email
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    // Update refresh token in database
    await connection.query(
      'UPDATE users SET auth_refresh_token = ? WHERE id = ?',
      [refreshToken, user.id]
    );

    // Fetch complete user data (excluding password)
    const [finalUser] = await connection.query(
      `SELECT id, name, username, email, email_verify, from_where, balance, 
                    is_ban, is_active, profile, created_at, updated_at 
             FROM users WHERE id = ?`,
      [user.id]
    );

    const responseData = {
      ...finalUser[0],
      accessToken,
      refreshToken,
      isNewUser
    };

    const message = isNewUser
      ? 'Account created and logged in successfully.'
      : 'Logged in successfully.';

    return res.status(200).json(
      responseSuccess(200, message, responseData)
    );

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Google Auth Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error during Google authentication.', [])
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Verify Google Token (Optional - for production use)
 * Uncomment and use this function to verify Google tokens
 */
/*
import { OAuth2Client } from 'google-auth-library';

const verifyGoogleToken = async (token) => {
    try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return {
            googleId: payload['sub'],
            email: payload['email'],
            name: payload['name'],
            picture: payload['picture'],
            emailVerified: payload['email_verified']
        };
    } catch (error) {
        console.error('Google token verification failed:', error);
        return null;
    }
};
*/

//
// router.post('/logout', verifyToken, async (req, res) => {
//   try {
//     // Clear refresh token from database
//     await mysqlDb.query(
//       'UPDATE users SET auth_refresh_token = NULL WHERE id = ?',
//       [req.user.id]
//     );
//
//     res.status(200).json({
//       success: true,
//       status: 200,
//       message: 'Logged out successfully.',
//       data: null
//     });
//   } catch (err) {
//     console.error('Logout Error:', err.message);
//     res.status(500).json({
//       success: false,
//       status: 500,
//       message: 'Internal server error.',
//       errors: []
//     });
//   }
// });
//

