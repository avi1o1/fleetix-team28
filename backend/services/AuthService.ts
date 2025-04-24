import { User, UserRole } from "../entities/User";
import { AppDataSource } from "../db/connection";
import * as jwt from "jsonwebtoken";

const userRepository = AppDataSource.getRepository(User);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable in production

export class AuthService {
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole; // Make role optional
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });
    
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create new user
    const user = new User();
    user.email = userData.email;
    user.name = userData.name;
    // Set role if provided, otherwise it will use the default (EMPLOYEE)
    if (userData.role) {
      user.role = userData.role;
    }
    
    // Set password (this will hash it)
    await user.setPassword(userData.password);
    
    // Save user to database
    return userRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await userRepository.findOne({
      where: { email },
    });
    
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token - now includes the user's role
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role // Include role in the token
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return { user, token };
  }

  async getUserById(id: string): Promise<User | null> {
    return userRepository.findOne({
      where: { id },
    });
  }
}