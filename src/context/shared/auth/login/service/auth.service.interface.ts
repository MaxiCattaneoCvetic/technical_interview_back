import { LoginDto } from "../models/dto/login.dto";

export interface AuthServiceInterface {
    login(loginDto: LoginDto): Promise<any>

}