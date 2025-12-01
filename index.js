import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectData from './src/database/index.js';
import Root from './src/routes/index.js';
import { notFound, errorHandler } from './src/middleware/errors.js';

const app = express();

// --- CORS ---
const ALLOWED_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'), false);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// --- CONNECT DATABASE ---
connectData();

// --- ROUTES ---
app.use(Root);

// Debug route (optional)
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json(routes);
});

// --- ERROR HANDLERS ---
app.use(notFound);
app.use(errorHandler);

// ❌ KHÔNG app.listen()
// Vercel sẽ tự wrap app thành server
export default app;
