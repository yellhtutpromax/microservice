import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { connectMongoDb } from "./database/mongooseDb.js";

// import authRoutes from './routes/auth.js';
// import testRoutes from './routes/test.js';
// import seederRoutes from './routes/seeder.js';
import noteRoutes from './routes/note.js';

const app = express();

// body-parser config; these must sit above the route registrations
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// middleware
app.use(express.json());
app.use(cors());

// api version prefix — fallback in case the env var isn't set
const apiVersionPrefix = process.env.API_VERSION_PREFIX || '/api/v1';

// route group
// app.use(apiVersionPrefix, authRoutes);
// app.use(apiVersionPrefix, seederRoutes);
// app.use(apiVersionPrefix, testRoutes);
app.get('/', (req, res) => {
    res.json({ message: "Welcome form node api backend" });
});
// console.log(apiVersionPrefix)
app.use(apiVersionPrefix, noteRoutes);

const Port = process.env.PORT || 4000;
const Host = process.env.HOST || 'localhost';

await connectMongoDb();

app.listen(Port, Host, function () {
    console.log(`Server is running on ${Host}:${Port}`);
});
