import { LoginDto, LoginDto_response } from "../models/dto/login.dto";

export interface AuthServiceInterface {
    login(loginDto: LoginDto): Promise<LoginDto_response>

}