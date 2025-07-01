import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { config } from 'dotenv';
import { registerRoutes } from '../../server/routes';

// Load environment variables
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for correct IP detection
app.set('trust proxy', true);

// Add CORS headers for Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize routes
(async () => {
  try {
    await registerRoutes(app);
  } catch (error) {
    console.error('Failed to register routes:', error);
  }
})();

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({ message });
  console.error("Server error:", err);
});

// Export the serverless function
const handler = serverless(app);

export { handler };