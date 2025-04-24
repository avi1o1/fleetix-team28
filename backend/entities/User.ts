// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import * as bcrypt from "bcrypt";

// Define role types
export enum UserRole {
  ADMIN = "admin",
  EMPLOYEE = "employee",
  DRIVER = "driver"
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true})
  email!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  passwordHash!: string;

  @Column({ nullable: true }) 
  Contact: string;

  @Column({ nullable: true })
  gender: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.EMPLOYEE
  })
  role!: UserRole;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date;

  // Helper method to validate password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Helper method to set password
  async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(password, salt);
  }
}