import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  type: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column()
  availableQuantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price50: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price100: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price200: number;

  @Column()
  isAvailable: boolean;

  @Column()
  category: string;

  @Column()
  description: string;

} 