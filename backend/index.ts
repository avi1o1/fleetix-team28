// Install the dotenv package
// npm install dotenv
import "reflect-metadata";
// In your main file (e.g., index.ts)
import dotenv from 'dotenv';
dotenv.config();

// Now the database connection file will use these variables
import { initializeDatabase } from './db/connection';

// Initialize the database connection
initializeDatabase()
  .then(() => {
    console.log('Database connected successfully');
    // Start your server here
  })
  .catch(error => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });