import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Route } from "./Route";
import { Driver } from "./Driver";

@Entity("ride_history")
export class RideHistory {
  @PrimaryGeneratedColumn("uuid")
  rideId!: string;

  @Column("uuid", { nullable: true })
  routeId!: string;

  @ManyToOne(() => Route)
  @JoinColumn({ name: "routeId" })
  route!: Route;

  @Column("uuid", { nullable: true })
  driverId!: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: "vehicleId" })
  driver!: Driver;

  @Column({ type: "timestamp", nullable: true })
  startTime!: Date;

  @Column({ type: "timestamp", nullable: true })
  endTime?: Date;  

  @Column({ nullable: true })
  status!: string;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date;
}
