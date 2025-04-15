import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column("varchar", { unique: true })
    email: string;

    @Column("varchar")
    password: string;


    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }



    toUser() {
        return {
            id: this.id,
            email: this.email,
        }
    }



}