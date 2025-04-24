import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { User, UserRole } from "../entities/User";
import { AppDataSource } from "../db/connection";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { Route } from "../entities/Route";
import { DriverAssignmentService } from "../services/driverAssignment.service";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Register handler with the correct typing
const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    // Validate inputs
    if (!email || !name || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Create new user
    const user = new User();
    user.email = email;
    user.name = name;
    user.role = role || UserRole.EMPLOYEE; // Default role
    await user.setPassword(password);

    await userRepository.save(user);

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login handler with the correct typing
const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await userRepository.findOne({ where: { email } });

    // Check if user exists
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Validate password
    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user handler
const updateUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { name, email, password, contact, gender } = req.body;

    // Find the user
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (contact) user.Contact = contact;
    if (gender) user.gender = gender;
    
    // Only update password if provided
    if (password) {
      await user.setPassword(password);
    }

    // Save updated user
    await userRepository.save(user);
    
    res.json({ 
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error updating user" });
  }
};

// Delete user handler
const deleteUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Find the user
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Remove the user
    await userRepository.remove(user);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// Get all users (for admin purposes)
const getAllUsersHandler: RequestHandler = async (req, res, next) => {
  try {
    const users = await userRepository.find();
    res.json(users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.Contact,
      gender: user.gender
    })));
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// Get user by ID
const getUserByIdHandler = (async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.Contact,
      gender: user.gender,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error fetching user" });
  }
}) as RequestHandler;

const saveRouteHandler: RequestHandler = async (req, res, next) => {
  try {
      const {
          routeId,
          routeGroupId,
          startTime,
          endTime,
          date,
          source,
          destination,
          totalDistance,
          estimatedTime,
          employeeIds = [],
          restTime = 0,
          assignedDriverId = null,
          routeDetails
      } = req.body;

      // Validate required fields
      const requiredFields = ['routeId', 'startTime', 'endTime', 'date', 'source', 'destination', 'totalDistance', 'estimatedTime'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
          return res.status(400).json({
              message: 'Missing required fields',
              missingFields
          });
      }

      // Validate employeeIds is an array of strings
      if (!Array.isArray(employeeIds) || employeeIds.some(id => typeof id !== 'string')) {
          return res.status(400).json({
              message: 'employeeIds must be an array of strings'
          });
      }

      const routeRepository = AppDataSource.getRepository(Route);
      
      const route = new Route();
      route.routeId = routeId;
      route.routeGroupId = routeGroupId;
      route.startTime = new Date(startTime);
      route.endTime = new Date(endTime);
      route.date = new Date(date);
      route.source = source;
      route.destination = destination;
      route.totalDistance = parseFloat(totalDistance);
      route.estimatedTime = parseFloat(estimatedTime);
      route.employeeIds = employeeIds;
      route.restTime = parseFloat(restTime) || 0;
      route.assignedDriverId = assignedDriverId;
      route.routeDetails = routeDetails;
      await routeRepository.save(route);
      // Then try to assign a driver
      const driverAssignmentService = new DriverAssignmentService(); // Create instance here
  
      // Then try to assign a driver using the instance
      const assignmentResult = await driverAssignmentService.assignDriverToRoute(route.routeId);
      
      if (!assignmentResult.success) {
        console.warn(`Could not assign driver: ${assignmentResult.message}`);
        // Still return success since the route was saved, just without a driver
        return res.status(201).json({
          message: "Route saved successfully but no driver assigned",
          routeId: route.routeId,
          warning: assignmentResult.message
        });
      }
  
      res.status(201).json({
        message: "Route saved and driver assigned successfully",
        routeId: route.routeId,
        driverId: assignmentResult.driverId
      });
    } catch (error: any) {
      // 👉 Enhanced error logging here
      console.error("Error saving route:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        stack: error.stack,
      });
    }
};

const checkDriverAvailabilityHandler: RequestHandler = async (req, res) => {
  try {
    const { driverId, startTime, endTime } = req.body;
    
    if (!driverId || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const driverAssignmentService = new DriverAssignmentService();
    const isAvailable = await driverAssignmentService.checkDriverAvailability(
      driverId,
      new Date(startTime),
      new Date(endTime)
    );

    res.json({ isAvailable });
  } catch (error) {
    console.error("Error checking driver availability:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add to your router
router.post("/check-driver-availability", checkDriverAvailabilityHandler);
router.post("/save-route", saveRouteHandler);
// Register the routes with the handlers
router.post("/register", registerHandler);
router.post("/login", loginHandler);

// User management routes
router.get("/users", getAllUsersHandler);
router.get("/users/:id", getUserByIdHandler); // Add route to get a specific user by ID
router.post("/users", registerHandler); // Add direct access to the registration handler at /users
router.put("/users/:id", updateUserHandler);
router.delete("/users/:id", deleteUserHandler);

export default router;