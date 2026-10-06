import dotenv from 'dotenv';
dotenv.config({path:'./config/.env'});
import {responseSuccess, responseError} from "./helpers/httpResponse.js";
import mysqlDb from "../database/mysql.js";

export const userList = async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'inactive', 'banned'
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    // Search filter (name, email, username)
    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR username LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Status filter
    if (status === 'active') {
      whereConditions.push('is_active = 1 AND is_ban = 0');
    } else if (status === 'inactive') {
      whereConditions.push('is_active = 0');
    } else if (status === 'banned') {
      whereConditions.push('is_ban = 1');
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'name', 'email', 'username', 'created_at', 'balance'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    // Get total count
    const [countResult] = await mysqlDb.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const totalUsers = countResult[0].total;

    // Fetch users
    const [users] = await mysqlDb.query(
      `SELECT id, name, email, username, email_verify, from_where, balance, 
                    is_ban, is_active, profile, created_at, updated_at
             FROM users 
             ${whereClause}
             ORDER BY ${safeSortBy} ${sortOrder}
             LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json(
      responseSuccess(200, 'Users fetched successfully.', {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
          hasNextPage,
          hasPrevPage
        }
      })
    );
  } catch (err) {
    console.error('Fetch Users Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error while fetching users.', [])
    );
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, balance, is_active, is_ban, profile } = req.body;

    // Check if user exists
    const [existingUser] = await mysqlDb.query(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json(
        responseError(404, 'User not found.', [])
      );
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (balance !== undefined) {
      updateFields.push('balance = ?');
      updateValues.push(balance);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }
    if (is_ban !== undefined) {
      updateFields.push('is_ban = ?');
      updateValues.push(is_ban ? 1 : 0);
    }
    if (profile !== undefined) {
      updateFields.push('profile = ?');
      updateValues.push(profile);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(
        responseError(400, 'No fields to update.', [])
      );
    }

    // Add userId to the end of values array
    updateValues.push(userId);

    // Execute update
    await mysqlDb.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Fetch updated user
    const [updatedUser] = await mysqlDb.query(
      `SELECT id, name, email, username, email_verify, from_where, balance, 
                    is_ban, is_active, profile, created_at, updated_at
             FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    return res.status(200).json(
      responseSuccess(200, 'User updated successfully.', updatedUser[0])
    );

  } catch (err) {
    console.error('Update User Error:', err.message);
    return res.status(500).json(
      responseError(500, 'Internal server error while updating user.', [])
    );
  }
};
