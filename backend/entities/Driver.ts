// Driver.ts
import { Entity, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { User } from "./User";

@Entity("drivers")
export class Driver {
  @PrimaryColumn("uuid")
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ nullable: true })
  vehicleLicensePlate!: string;

  @Column({ type: "int", nullable: true })
  drivesCount!: number;

  @Column({ type: "int", nullable: true })
  capacity!: number;

  @Column({ type: "boolean", default: true })
  isAvailable!: boolean;

  @Column({ type: "timestamp", nullable: true })
  availableFrom!: Date | null;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt!: Date;
}