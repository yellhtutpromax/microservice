import express from 'express';
const router = express.Router();

// controller
import {getNotes, saveNote} from "../controllers/noteController.js";

// Public Routes
router.post('/note/save', saveNote);
router.get('/note/all', getNotes);

export default router;
