// import { AppDataSource } from "../db/connection";
// import { Driver } from "../entities/Driver";
// import { Route } from "../entities/Route";

// export class DriverAssignmentService {
//   private driverRepository = AppDataSource.getRepository(Driver);
//   private routeRepository = AppDataSource.getRepository(Route);

//   async assignDriverToRoute(routeId: string): Promise<{ success: boolean; message: string; driverId?: string }> {
//     const route = await this.routeRepository.findOne({ where: { routeId } });
//     if (!route) {
//       return { success: false, message: "Route not found" };
//     }

//     if (route.assignedDriverId) {
//       return { success: false, message: "Route already has an assigned driver" };
//     }

//     // Find available drivers (not assigned to any overlapping routes)
//     const availableDrivers = await this.findAvailableDrivers(route.startTime, route.endTime, route.restTime);

//     if (availableDrivers.length === 0) {
//       return { success: false, message: "No available drivers for this time slot" };
//     }

//     // Select the driver with the least assignments (simple load balancing)
//     const selectedDriver = availableDrivers.reduce((prev, current) => 
//       (prev.drivesCount || 0) < (current.drivesCount || 0) ? prev : current
//     );

//     // Update the route with the assigned driver
//     route.assignedDriverId = selectedDriver.userId;
//     await this.routeRepository.save(route);

//     // Update driver's availability
//     const endTimeWithRest = new Date(route.endTime);
//     endTimeWithRest.setMinutes(endTimeWithRest.getMinutes() + (route.restTime || 15));

//     selectedDriver.isAvailable = false;
//     selectedDriver.availableFrom = endTimeWithRest;
//     selectedDriver.drivesCount = (selectedDriver.drivesCount || 0) + 1;
//     await this.driverRepository.save(selectedDriver);

//     return { 
//       success: true, 
//       message: `Driver ${selectedDriver.userId} assigned successfully`,
//       driverId: selectedDriver.userId
//     };
//   }

//   private async findAvailableDrivers(startTime: Date, endTime: Date, restTime: number = 15): Promise<Driver[]> {
//     const endTimeWithRest = new Date(endTime);
//     endTimeWithRest.setMinutes(endTimeWithRest.getMinutes() + restTime);

//     // Find drivers who:
//     // 1. Are marked as available OR
//     // 2. Will become available before this route starts
//     return await this.driverRepository
//       .createQueryBuilder("driver")
//       .where("driver.isAvailable = :isAvailable", { isAvailable: true })
//       .orWhere("driver.availableFrom <= :startTime", { startTime })
//       .getMany();
//   }

//   async checkDriverAvailability(driverId: string, startTime: Date, endTime: Date): Promise<boolean> {
//     const driver = await this.driverRepository.findOne({ where: { userId: driverId } });
//     if (!driver) return false;

//     if (driver.isAvailable) return true;

//     // If driver is marked as unavailable but their availability starts before this route
//     return driver.availableFrom ? driver.availableFrom <= startTime : false;
//   }
// }

import { AppDataSource } from "../db/connection";
import { Driver } from "../entities/Driver";
import { Route } from "../entities/Route";
import { Between, LessThanOrEqual, MoreThanOrEqual, Not, IsNull } from "typeorm";

// Create a simple lock mechanism to queue driver assignment requests
// Using a more specific type for the queue
interface LockQueue {
  locked: boolean;
  queue: Promise<unknown>;
}

const driverAssignmentLock: LockQueue = {
  locked: false,
  queue: Promise.resolve(),
};

export class DriverAssignmentService {
  private driverRepository = AppDataSource.getRepository(Driver);
  private routeRepository = AppDataSource.getRepository(Route);

  async assignDriverToRoute(routeId: string): Promise<{ success: boolean; message: string; driverId?: string }> {
    // Queue this operation and wait for its turn
    return new Promise<{ success: boolean; message: string; driverId?: string }>(resolve => {
      driverAssignmentLock.queue = driverAssignmentLock.queue
        .then(async () => {
          driverAssignmentLock.locked = true;
          try {
            // Start of your existing assignment logic
            const route = await this.routeRepository.findOne({ where: { routeId } });
            if (!route) {
              const response = { success: false, message: "Route not found" };
              resolve(response);
              return;
            }

            if (route.assignedDriverId) {
              const response = { success: false, message: "Route already has an assigned driver" };
              resolve(response);
              return;
            }

            // Get available drivers based on current state
            const availableDrivers = await this.findAvailableDrivers(route.startTime, route.endTime, route.restTime);

            if (availableDrivers.length === 0) {
              const response = { success: false, message: "No available drivers for this time slot" };
              resolve(response);
              return;
            }

            // Select the driver with the least assignments (simple load balancing)
            const selectedDriver = availableDrivers.reduce((prev, current) => 
              (prev.drivesCount || 0) < (current.drivesCount || 0) ? prev : current
            );

            // Update the route with the assigned driver
            route.assignedDriverId = selectedDriver.userId;
            await this.routeRepository.save(route);

            // Update driver's availability
            const endTimeWithRest = new Date(route.endTime);
            endTimeWithRest.setMinutes(endTimeWithRest.getMinutes() + (route.restTime || 15));

            selectedDriver.isAvailable = false;
            selectedDriver.availableFrom = endTimeWithRest;
            selectedDriver.drivesCount = (selectedDriver.drivesCount || 0) + 1;
            await this.driverRepository.save(selectedDriver);

            const response = { 
              success: true, 
              message: `Driver ${selectedDriver.userId} assigned successfully`,
              driverId: selectedDriver.userId
            };
            resolve(response);
          } catch (error) {
            console.error("Error during driver assignment:", error);
            const errorResponse = { 
              success: false, 
              message: "Assignment failed: " + (error instanceof Error ? error.message : String(error))
            };
            resolve(errorResponse);
          } finally {
            // Always release the lock when done
            driverAssignmentLock.locked = false;
          }
        })
        .catch(error => {
          console.error("Critical error in driver assignment queue:", error);
          driverAssignmentLock.locked = false; // Make sure to release the lock
          const errorResponse = { 
            success: false, 
            message: "Critical assignment error: " + (error instanceof Error ? error.message : String(error))
          };
          resolve(errorResponse);
        });
    });
  }

  private async findAvailableDrivers(startTime: Date, endTime: Date, restTime: number = 15): Promise<Driver[]> {
    const endTimeWithRest = new Date(endTime);
    endTimeWithRest.setMinutes(endTimeWithRest.getMinutes() + restTime);

    // Step 1: Get all drivers
    const allDrivers = await this.driverRepository.find();

    // Step 2: For each driver, check if they have conflicting routes
    const availableDrivers: Driver[] = [];

    for (const driver of allDrivers) {
      // Get all routes assigned to this driver
      const assignedRoutes = await this.routeRepository.find({
        where: { assignedDriverId: driver.userId }
      });

      // Check for time conflicts
      const hasConflict = assignedRoutes.some(existingRoute => {
        const existingStartTime = new Date(existingRoute.startTime);
        const existingEndTime = new Date(existingRoute.endTime);
        
        // Add rest time to the existing route's end time
        const existingEndWithRest = new Date(existingEndTime);
        existingEndWithRest.setMinutes(existingEndWithRest.getMinutes() + (existingRoute.restTime || 15));

        // Check for overlap:
        // - New route starts before existing route ends (with rest)
        // - New route ends (with rest) after existing route starts
        return (
          startTime < existingEndWithRest && 
          endTimeWithRest > existingStartTime
        );
      });

      if (!hasConflict) {
        // Driver is available if:
        // 1. They're marked as available OR
        // 2. They will become available before this route starts
        if (
          driver.isAvailable || 
          (driver.availableFrom && driver.availableFrom <= startTime)
        ) {
          availableDrivers.push(driver);
        }
      }
    }

    return availableDrivers;
  }

  async checkDriverAvailability(driverId: string, startTime: Date, endTime: Date): Promise<boolean> {
    // Add to queue for consistency (optional but recommended)
    return new Promise<boolean>(resolve => {
      driverAssignmentLock.queue = driverAssignmentLock.queue
        .then(async () => {
          driverAssignmentLock.locked = true;
          try {
            // First check if driver exists
            const driver = await this.driverRepository.findOne({ where: { userId: driverId } });
            if (!driver) {
              resolve(false);
              return;
            }

            // Next check if they're available based on their status
            if (!driver.isAvailable && (!driver.availableFrom || driver.availableFrom > startTime)) {
              resolve(false);
              return;
            }

            // Finally check for any conflicting routes
            const assignedRoutes = await this.routeRepository.find({
              where: { assignedDriverId: driverId }
            });

            // Check for time conflicts
            const hasConflict = assignedRoutes.some(existingRoute => {
              const existingStartTime = new Date(existingRoute.startTime);
              const existingEndTime = new Date(existingRoute.endTime);
              
              // Add rest time to the existing route's end time
              const existingEndWithRest = new Date(existingEndTime);
              existingEndWithRest.setMinutes(existingEndWithRest.getMinutes() + (existingRoute.restTime || 15));

              // Calculate the end time with rest for the requested time
              const requestedEndWithRest = new Date(endTime);
              requestedEndWithRest.setMinutes(requestedEndWithRest.getMinutes() + 15); // Default rest time

              // Check for overlap
              return (
                startTime < existingEndWithRest && 
                requestedEndWithRest > existingStartTime
              );
            });

            resolve(!hasConflict);
          } catch (error) {
            console.error("Error checking driver availability:", error);
            resolve(false);
          } finally {
            driverAssignmentLock.locked = false;
          }
        })
        .catch(error => {
          console.error("Critical error in availability check:", error);
          driverAssignmentLock.locked = false;
          resolve(false);
        });
    });
  }
}