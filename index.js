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
  'http://127.0.0.1:3000',
  'https://project-sw-251-fe-54dd.vercel.app',
  'https://project-sw-251-fe-54dd-hpgrdrk82-khoinguyens-projects-f31cae95.vercel.app'
];

// Debug log (optional)
app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  console.log("Request Path:", req.path);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    console.error("CORS blocked:", origin);
    return callback(new Error("CORS not allowed"), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// ❌ XÓA HOÀN TOÀN app.options('*') — lỗi Vercel / Express 5!
// Preflight sẽ được cors middleware tự xử lý

app.use(express.json());
app.use(cookieParser());

// --- CONNECT DATABASE ---
connectData();

// --- ROUTES ---
app.use('/', Root);

// Debug route
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(mw => {
    if (mw.route) {
      routes.push({
        path: mw.route.path,
        methods: Object.keys(mw.route.methods)
      });
    } else if (mw.name === 'router') {
      mw.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json(routes);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "backend-api"
  });
});

// --- ERROR HANDLERS ---
app.use(notFound);
app.use(errorHandler);

// --- EXPORT CHO VERCEL (KHÔNG app.listen()) ---
export default app;

// --- CHỈ chạy server khi chạy local ---
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
