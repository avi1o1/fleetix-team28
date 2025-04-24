// db/connection.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Driver } from "../entities/Driver";
import { Employee } from "../entities/Employee";
import { Route } from "../entities/Route";
import { RideHistory } from "../entities/RideHistory"; 
import * as dotenv from 'dotenv';

dotenv.config();

// Updated connection string - ensure this is correct in your .env file
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_lD7sJ1jxTufN@ep-frosty-bread-a5cw9csi-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon connections
  },
  synchronize: true, // Set to false in production
  logging: true,
  entities: [User, Driver, Employee, Route, RideHistory],
  subscribers: [],
  migrations: [],
  // Add connection pool settings
  connectTimeoutMS: 30000, // 30 seconds
  extra: {
    // PostgreSQL specific connection parameters
    max: 10, // Maximum number of clients in the pool
    connectionTimeoutMillis: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
    statement_timeout: 30000, // 30 seconds
    idle_in_transaction_session_timeout: 30000, // 30 seconds
  },
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");
  } catch (error: unknown) {
    console.error("Error connecting to the database:", error);
    
    // Provide more useful error information
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        console.error("Connection timed out. Please check your network connectivity and database connection string.");
        console.error("Current connection string (redacted): " + connectionString.replace(/\/\/.*?@/, "//[CREDENTIALS]@"));
      }
    }
    
    throw error;
  }
};