import express from 'express';
const router = express.Router();
import {refreshAccessToken, verifyToken} from "../middleware/authMiddleware.js";

// controller
import {register, login, googleAuth,} from "../controllers/authController.js";
import {userList} from "../controllers/userController.js";

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-auth', googleAuth);
router.post('/refresh-access-token', refreshAccessToken);

// Protected Routes
router.get('/users', verifyToken ,userList);

export default router;
