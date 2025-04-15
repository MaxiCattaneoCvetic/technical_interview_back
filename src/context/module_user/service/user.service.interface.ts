import { UserRegisterDto } from "../models/dto/user.register.dto";

export interface UserServiceInterface {
    register(userRegisterDto: UserRegisterDto): Promise<any>
}