import { User } from "../models/entity/user.entity";

export interface UserRepositoryInterface {
    saveUser(user: Partial<User>): Promise<any>
}