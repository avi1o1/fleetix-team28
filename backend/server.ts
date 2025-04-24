import express from 'express';
import cors from 'cors';
import authRoute from './routes/authRoute';
import employeeRoutes from './routes/employeeRoutes';
import driverRoutes from './routes/driverRoutes';
import userRoutes from './routes/userRoutes';
import { AppDataSource } from './db/connection';
import "reflect-metadata";
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Create Express server
const app = express();
const port = process.env.PORT || 3001;

// Define interface for route info
interface RouteInfo {
  path: string;
  method: string;
}

// Add detailed request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Enable Cross-Origin Resource Sharing with detailed options
app.use(cors({
  origin: '*', // Allow all origins for debugging
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON request body with larger size limit
app.use(express.json({ limit: '5mb' }));

// Add response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response for ${req.method} ${req.url}: Status ${res.statusCode}`);
    return originalSend.call(this, body);
  };
  next();
});

// Register auth routes
app.use('/auth', authRoute);

// Register primary user routes
app.use('/users', userRoutes);

// Register specialized routes for employees and drivers
app.use('/employees', employeeRoutes);
app.use('/drivers', driverRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Carpooling API is running');
});

// Catch-all handler for requests to non-existent routes
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Route not found", 
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Start server after database connection is established
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Available at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

export default app;
