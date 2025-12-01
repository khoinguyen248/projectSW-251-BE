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

// Log CORS errors for debugging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('Request Origin:', origin);
  console.log('Request Path:', req.path);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS blocked for origin:', origin);
      console.error('Allowed origins:', ALLOWED_ORIGINS);
      callback(new Error('CORS not allowed'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

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
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });
}

export default app;