import dotenv from 'dotenv';
dotenv.config({path:'../config/.env'});
import {responseError} from "../controllers/helpers/httpResponse.js";
import jwt from 'jsonwebtoken';
import mysqlDb from "../database/mysql.js";

export const checkApiKey = (req,res,next) => {
  let headerToken = req.headers.authorization;
  if ( headerToken === undefined)
  {
    return res.status(404).json(responseError(404,'Api key not found [ field name key must be ( authorization in header ) ]',null));
  }else if(headerToken !== process.env.API_TOKEN){
    return res.status(403).json(responseError(403,'Api key did not match ',null));
  }else if(headerToken === process.env.API_TOKEN){
    next();
  }
}       // Check api middleware

/**
 * Verify Token
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json(
        responseError(401, 'Access token is required.', [])
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'access-secret-key'
    );

    // Fetch user from database
    const [users] = await mysqlDb.query(
      `SELECT id, name, username, email, email_verify, from_where,
              balance, is_ban, is_active, profile
       FROM users WHERE id = ? LIMIT 1`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json(
        responseError(401, 'Invalid token - user not found.', [])
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

    // Attach user to request
    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(
        responseError(401, 'Access token has expired.', [])
      );
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json(
        responseError(401, 'Invalid access token.', [])
      );
    }

    console.error('Token Verification Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error.', [])
    );
  }
};

/**
 * Refresh Access Token
 *
 * IMPORTANT: There are two approaches to handle refresh tokens:
 *
 * APPROACH 1 (Current Implementation - Recommended for Most Cases):
 * - Only generates a NEW access token
 * - Keeps the SAME refresh token
 * - Simpler, less database writes
 * - Good for: Most applications with standard security needs
 *
 * APPROACH 2 (Rotation Strategy - Higher Security):
 * - Generates BOTH new access token AND new refresh token
 * - Updates refresh token in database (token rotation)
 * - Better security (prevents replay attacks)
 * - Good for: Banking apps, financial services, high-security apps
 *
 * To use APPROACH 2, uncomment the rotation code below
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json(
        responseError(401, 'Refresh token is required.', [])
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh-secret-key'
    );

    // Check if refresh token matches in database
    const [users] = await mysqlDb.query(
      `SELECT id, username, email, auth_refresh_token, is_ban, is_active
       FROM users WHERE id = ? LIMIT 1`,
      [decoded.id]
    );

    if (users.length === 0 || users[0].auth_refresh_token !== refreshToken) {
      return res.status(401).json(
        responseError(401, 'Invalid refresh token.', [])
      );
    }

    const user = users[0];

    // Check user status
    if (user.is_ban || !user.is_active) {
      return res.status(403).json(
        responseError(403, 'Account is not accessible.', [])
      );
    }

    // Generate new access token (always)
    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_ACCESS_SECRET || 'access-secret-key',
      { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );

    // APPROACH 1: Return only new access token (current implementation)
    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Access token refreshed successfully.',
      data: {
        accessToken: newAccessToken
      }
    });

    // APPROACH 2: Token Rotation (Uncomment for higher security)
    // Generate new refresh token as well
    // const newRefreshToken = jwt.sign(
    //     { id: user.id, username: user.username, email: user.email },
    //     process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    //     { expiresIn: process.env.JWT_REFRESH_EXPIRY }
    // );
    //
    // // Update refresh token in database
    // await mysqlDb.query(
    //     'UPDATE users SET auth_refresh_token = ? WHERE id = ?',
    //     [newRefreshToken, user.id]
    // );
    //
    // return res.status(200).json({
    //     success: true,
    //     status: 200,
    //     message: 'Tokens refreshed successfully.',
    //     data: {
    //         accessToken: newAccessToken,
    //         refreshToken: newRefreshToken  // Send new refresh token to client
    //     }
    // });

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(
        responseError(401, 'Refresh token has expired. Please login again.', [])
      );
    }

    console.error('Token Refresh Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error.', [])
    );
  }
};
