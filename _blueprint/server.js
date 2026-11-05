import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import database from './database/db.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Database
try { await database.connect(); } catch (e) { console.error('DB FAIL'); }

// Centralized Routing
app.use('/api', routes);

app.get('/api/health', (req, res) => res.json({ status: 'UP', time: new Date() }));

app.listen(PORT, () => console.log(`🚀 API active on port ${PORT}`));
