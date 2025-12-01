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
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.use(express.json());
app.use(cookieParser());

// --- CONNECT DATABASE ---
connectData();

// --- ROUTES ---
app.use('/', Root);

// Debug route (optional)
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Handle mounted routers
      middleware.handle.stack.forEach(handler => {
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'backend-api'
  });
});

// --- ERROR HANDLERS ---
app.use(notFound);
app.use(errorHandler);

// ❌ KHÔNG app.listen() - Vercel sẽ tự wrap app thành server
// Chỉ start server khi chạy local
const PORT = process.env.PORT || 8080;

// Export cho Vercel Serverless Functions
export default app;

// Start server chỉ khi chạy local (không phải trên Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });
}