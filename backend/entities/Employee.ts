import { Entity, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { User } from "./User";

@Entity("employees")
export class Employee {
  // Use userId as the primary key instead of generating a new ID
  @PrimaryColumn("uuid")
  userId!: string;

  // Create the one-to-one relationship with User entity
  @OneToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ nullable: true })
  pickupLocation!: string;

  @Column({ nullable: true })
  dropLocation!: string;

  @Column({ type: "timestamp", nullable: true })
  shiftStartTime!: Date;

  @Column({ type: "timestamp", nullable: true })
  shiftEndTime!: Date;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date;
}
