import Link from '../models/mongo/links.model.js';
import { generateRandomStr } from "./helpers/helper.js";

export const saveNote = async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ message: 'link is required' });

  try {
    const token = generateRandomStr(32);

    const savedLink = await Link.create({
      link,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({ message: 'Registered', data: savedLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // cap at 100
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      Link.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Link.countDocuments(),
    ]);

    return res.status(200).json({
      message: 'Notes fetched',
      data: notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};
