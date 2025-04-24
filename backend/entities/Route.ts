import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Driver } from "./Driver";

@Entity("routes")
export class Route {
  @PrimaryGeneratedColumn("uuid")
  routeId!: string;

  @Column({ type: "uuid", nullable: true })
  routeGroupId!: string;

  @Column("text", { nullable: true })
  routeDetails!: string;

  @Column({ type: "timestamp", nullable: true })
  startTime!: Date;

  @Column({ type: "timestamp", nullable: true })
  endTime!: Date;

  @Column({ nullable: true })
  date!: Date;

  @Column("text", { nullable: true })
  source!: string;

  @Column("text", { nullable: true })
  destination!: string;

  @Column("float", { nullable: true })
  totalDistance!: number;

  @Column("float", { nullable: true })
  estimatedTime!: number;

  @Column("simple-array", { nullable: true })
  employeeIds!: string[];

  @Column({ type: "uuid", nullable: true })
  assignedDriverId!: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: "assignedDriverId" })
  assignedDriver!: Driver;

  @Column("float", { nullable: true })
  restTime!: number;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date;
}

