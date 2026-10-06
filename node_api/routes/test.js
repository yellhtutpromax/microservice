import express from 'express';
import {countriesFilters} from "../controllers/testController.js";
const router = express.Router();

router.get('/countries', countriesFilters);

export default router;