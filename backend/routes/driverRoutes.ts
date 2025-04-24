import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../db/connection';
import { Driver } from '../entities/Driver';
import { User } from '../entities/User';
import { Route } from '../entities/Route'; // Add this import
import { Equal } from 'typeorm';
const router = Router();
const driverRepository = AppDataSource.getRepository(Driver);
const userRepository = AppDataSource.getRepository(User);
const routeRepository = AppDataSource.getRepository(Route); // Add this line

// Get all drivers
router.get('/', (async (req, res) => {
  try {
    const drivers = await driverRepository.find({
      relations: ['user']
    });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
}) as RequestHandler);

// Create a new driver
router.post('/', (async (req, res) => {
  try {
    const { userId, vehicleLicensePlate, drivesCount, capacity } = req.body;
    
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
    
    // Create the driver entity
    const driver = new Driver();
    driver.userId = userId;
    if (vehicleLicensePlate) driver.vehicleLicensePlate = vehicleLicensePlate;
    if (drivesCount !== undefined) driver.drivesCount = drivesCount;
    if (capacity !== undefined) driver.capacity = capacity;
    
    await driverRepository.save(driver);
    
    // Fetch the complete driver with relations for the response
    const savedDriver = await driverRepository.findOne({
      where: { userId: Equal(userId) },
      relations: ['user']
    });
    
    res.status(201).json(savedDriver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ 
      message: 'Server error creating driver', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}) as RequestHandler);

// Update a driver
router.put('/:userId', (async (req, res) => {
  try {
    const userId = req.params.userId;
    const { vehicleLicensePlate, drivesCount, capacity } = req.body;
    
    // Find the driver
    const driver = await driverRepository.findOne({
      where: { userId: Equal(userId) },
      relations: ['user']
    });
    
    if (!driver) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }
    
    // Update driver fields
    if (vehicleLicensePlate !== undefined) driver.vehicleLicensePlate = vehicleLicensePlate;
    if (drivesCount !== undefined) driver.drivesCount = drivesCount;
    if (capacity !== undefined) driver.capacity = capacity;
    
    // Save the updated driver
    await driverRepository.save(driver);
    
    // Fetch the updated driver with relations
    const updatedDriver = await driverRepository.findOne({
      where: { userId: Equal(userId) },
      relations: ['user']
    });
    
    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Server error updating driver' });
  }
}) as RequestHandler);

// Get driver by userId
router.get('/:userId', (async (req, res) => {
  try {
    const userId = req.params.userId;
    const driver = await driverRepository.findOne({ 
      where: { userId: Equal(userId) },
      relations: ['user']
    });

    if (!driver) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }

    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Server error fetching driver' });
  }
}) as RequestHandler);

// Delete a driver
router.delete('/:userId', (async (req, res) => {
  try {
    const userId = req.params.userId;
    const driver = await driverRepository.findOneBy({ userId: Equal(userId) });

    if (!driver) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }

    await driverRepository.remove(driver);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error deleting driver' });
  }
}) as RequestHandler);
router.get('/:driverId/routes', (async (req, res) => {
  try {
    const driverId = req.params.driverId;
    
    // First verify the driver exists
    const driver = await driverRepository.findOneBy({ userId: driverId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get all routes assigned to this driver
    const routes = await routeRepository.find({
      where: { assignedDriverId: driverId },
      order: { date: 'DESC' }
    });

    res.json(routes.map((route: Route) => ({
      routeId: route.routeId,
      source: route.source,
      destination: route.destination,
      startTime: route.startTime,
      endTime: route.endTime,
      date: route.date,
      totalDistance: route.totalDistance,
      estimatedTime: route.estimatedTime,
      employeeIds: route.employeeIds
    })));
  } catch (error) {
    console.error('Error fetching driver routes:', error);
    res.status(500).json({ message: 'Server error fetching driver routes' });
  }
}) as RequestHandler);



export default router;