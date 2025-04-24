// test-db.ts
import "reflect-metadata";
import { initializeDatabase, AppDataSource } from './db/connection';

async function testConnection() {
  try {
    await initializeDatabase();
    console.log('Successfully connected to Neon PostgreSQL database');
    
    // Run a simple query
    const result = await AppDataSource.query('SELECT NOW()');
    console.log('Current database time:', result[0].now);
    
    // Close the connection
    await AppDataSource.destroy();
    console.log('Connection closed');
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

testConnection();