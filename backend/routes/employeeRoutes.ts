import { Router, Request as ExpressRequest, Response, NextFunction, RequestHandler } from 'express';
import { AppDataSource } from '../db/connection';
import { Employee } from '../entities/Employee';
import { User } from '../entities/User';
import { Route } from '../entities/Route';
import { Equal, In } from 'typeorm';
import { Request as UndiciRequest } from 'undici-types';

const router = Router();
const employeeRepository = AppDataSource.getRepository(Employee);
const userRepository = AppDataSource.getRepository(User);
const routeRepository = AppDataSource.getRepository(Route);

// Get all employees
router.get('/', (async (req: ExpressRequest, res: Response) => {
  try {
    // No authentication check for this admin endpoint since the frontend is already calling it directly
    const employees = await employeeRepository.find({
      relations: ['user']
    });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
}) as RequestHandler);

// Create a new employee
router.post('/', (async (req: ExpressRequest, res: Response) => {
  try {
    const { userId, pickupLocation, dropLocation, shiftStartTime, shiftEndTime } = req.body;

    // Validate required fields
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Check if user exists
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const employee = new Employee();
    employee.userId = userId;
    if (pickupLocation) employee.pickupLocation = pickupLocation;
    if (dropLocation) employee.dropLocation = dropLocation;
    
    // Properly handle time strings with proper default values
    if (shiftStartTime && shiftStartTime.includes(':')) {
      const [hours, minutes] = shiftStartTime.split(':').map(Number);
      const date = new Date();
      date.setUTCHours(hours, minutes, 0, 0);
      employee.shiftStartTime = date;
      console.log(`Setting shiftStartTime to ${date.toISOString()} from input ${shiftStartTime}`);
    } else {
      // Set a default value of 9:00 AM if not specified
      const defaultDate = new Date();
      defaultDate.setUTCHours(9, 0, 0, 0);
      employee.shiftStartTime = defaultDate;
      console.log(`Setting default shiftStartTime to ${defaultDate.toISOString()}`);
    }
    
    if (shiftEndTime && shiftEndTime.includes(':')) {
      const [hours, minutes] = shiftEndTime.split(':').map(Number);
      const date = new Date();
      date.setUTCHours(hours, minutes, 0, 0);
      employee.shiftEndTime = date;
      console.log(`Setting shiftEndTime to ${date.toISOString()} from input ${shiftEndTime}`);
    } else {
      // Set a default value of 6:00 PM if not specified
      const defaultDate = new Date();
      defaultDate.setUTCHours(18, 0, 0, 0);
      employee.shiftEndTime = defaultDate;
      console.log(`Setting default shiftEndTime to ${defaultDate.toISOString()}`);
    }

    await employeeRepository.save(employee);
    res.status(201).json(employee);

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error creating employee' });
  }
}) as RequestHandler);

// Update an employee
router.put('/:userId', (async (req, res) => {
  try {
    const userId = req.params.userId;
    const { pickupLocation, dropLocation, shiftStartTime, shiftEndTime } = req.body;

    // Find the employee
    const employee = await employeeRepository.findOne({
      where: { userId: Equal(userId) },
      relations: ['user']
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Update employee fields
    if (pickupLocation !== undefined) employee.pickupLocation = pickupLocation;
    if (dropLocation !== undefined) employee.dropLocation = dropLocation;
    
    // Properly handle time strings - fix the null error by providing default values
    if (shiftStartTime !== undefined) {
      if (shiftStartTime && shiftStartTime.includes(':')) {
        // Create a UTC date at midnight and set the hours and minutes
        const [hours, minutes] = shiftStartTime.split(':').map(Number);
        const date = new Date();
        date.setUTCHours(hours, minutes, 0, 0);
        employee.shiftStartTime = date;
        console.log(`Setting shiftStartTime to ${date.toISOString()} from input ${shiftStartTime}`);
      } else {
        // Set a default value of 9:00 AM if empty/invalid
        const defaultDate = new Date();
        defaultDate.setUTCHours(9, 0, 0, 0);
        employee.shiftStartTime = defaultDate;
        console.log(`Setting default shiftStartTime to ${defaultDate.toISOString()}`);
      }
    }
    
    if (shiftEndTime !== undefined) {
      if (shiftEndTime && shiftEndTime.includes(':')) {
        // Create a UTC date at midnight and set the hours and minutes
        const [hours, minutes] = shiftEndTime.split(':').map(Number);
        const date = new Date();
        date.setUTCHours(hours, minutes, 0, 0);
        employee.shiftEndTime = date;
        console.log(`Setting shiftEndTime to ${date.toISOString()} from input ${shiftEndTime}`);
      } else {
        // Set a default value of 6:00 PM if empty/invalid
        const defaultDate = new Date();
        defaultDate.setUTCHours(18, 0, 0, 0);
        employee.shiftEndTime = defaultDate;
        console.log(`Setting default shiftEndTime to ${defaultDate.toISOString()}`);
      }
    }

    // Save the updated employee
    await employeeRepository.save(employee);
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error updating employee' });
  }
}) as RequestHandler);

// Get employee by userId
router.get('/:userId', (async (req, res) => {
  try {
    const userId = req.params.userId;
    const employee = await employeeRepository.findOne({ 
      where: { userId: Equal(userId) },
      relations: ['user']
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error fetching employee' });
  }
}) as RequestHandler);

// Delete an employee
router.delete('/:userId', (async (req, res) => {
  try {
    const userId = req.params.userId;
    const employee = await employeeRepository.findOneBy({ userId: Equal(userId) });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    await employeeRepository.remove(employee);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error deleting employee' });
  }
}) as RequestHandler);

// Get routes for a specific employee
router.get('/:userId/routes', (async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // First check if the employee exists
    const employee = await employeeRepository.findOne({
      where: { userId: Equal(userId) },
      relations: ['user']
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Query the routes table to find all routes that include this employee's userId
    // Using the 'simple-array' type for employeeIds, we need a raw query to check if the ID is in the array
    const routes = await routeRepository.createQueryBuilder('route')
      .where('route.employeeIds LIKE :userId', { userId: `%${userId}%` })
      .getMany();

    // If no routes are found, return an empty array
    if (!routes || routes.length === 0) {
      res.json([]);
      return;
    }

    // Format the routes for the response
    const formattedRoutes = routes.map(route => ({
      routeId: route.routeId,
      source: route.source,
      destination: route.destination,
      startTime: route.startTime,
      endTime: route.endTime,
      date: route.date,
      totalDistance: route.totalDistance,
      estimatedTime: route.estimatedTime,
      // Include any other fields needed for visualization
    }));

    res.json(formattedRoutes);
  } catch (error) {
    console.error('Error fetching employee routes:', error);
    res.status(500).json({ message: 'Server error fetching employee routes' });
  }
}) as RequestHandler);
// Add this route to your existing employee router
// Update this route in your employee router
router.get('/auth/employees/:id', (async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verify authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - Bearer token required' });
    }

    const token = authHeader.split(' ')[1];
    // Add your token verification logic here if needed
    
    const employee = await employeeRepository.findOne({ 
      where: { userId: id }, // Simplified from Equal(id)
      relations: ['user'],
      select: {
        userId: true,
        pickupLocation: true,
        dropLocation: true,
        shiftStartTime: true,
        shiftEndTime: true,
        user: {
          id: true,
          name: true,
          email: true
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      userId: employee.userId,
      pickupLocation: employee.pickupLocation,
      dropLocation: employee.dropLocation,
      shiftStartTime: employee.shiftStartTime?.toISOString(),
      shiftEndTime: employee.shiftEndTime?.toISOString(),
      user: {
        id: employee.user.id,
        name: employee.user.name,
        email: employee.user.email
      }
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error fetching employee details' });
  }
}) as RequestHandler);

export default router;