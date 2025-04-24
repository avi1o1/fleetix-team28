import { Router, RequestHandler } from "express";
import { User, UserRole } from "../entities/User";
import { AppDataSource } from "../db/connection";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Create user handler
const createUserHandler = (async (req, res) => {
  try {
    const { email, name, password, role, contact, gender } = req.body;

    // Validate inputs
    if (!email || !name || !password) {
      res.status(400).json({ message: "All fields are required", fields: { email: !email, name: !name, password: !password } });
      return;
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      // If force=true is provided in query params, return the existing user ID instead of an error
      if (req.query.force === 'true') {
        console.log(`User with email ${email} already exists, returning existing user ID`);
        return res.status(200).json({
          message: "User already exists",
          userId: existingUser.id,
          existing: true
        });
      }
      
      // Otherwise return the standard error
      res.status(400).json({ 
        message: "User with this email already exists. Please use a different email address.",
        field: "email",
        value: email
      });
      return;
    }

    // Create new user with a more descriptive log
    console.log(`Creating new user with email: ${email}, role: ${role}`);
    const user = new User();
    user.email = email;
    user.name = name;
    user.role = role || UserRole.EMPLOYEE;
    if (contact) user.Contact = contact;
    if (gender) user.gender = gender;
    
    await user.setPassword(password);
    await userRepository.save(user);

    res.status(201).json({
      message: "User created successfully",
      userId: user.id
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
}) as RequestHandler;

// Get all users
const getAllUsersHandler = (async (req, res) => {
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
}) as RequestHandler;

// Get user by ID
const getUserByIdHandler = (async (req, res) => {
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

// Update user
const updateUserHandler = (async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, contact, gender } = req.body;

    // Find the user
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
}) as RequestHandler;

// Delete user
const deleteUserHandler = (async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the user
    await userRepository.remove(user);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error deleting user" });
  }
}) as RequestHandler;

// Register the CRUD routes
router.post("/", createUserHandler);
router.get("/", getAllUsersHandler);
router.get("/:id", getUserByIdHandler); // Add GET route for a single user
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
