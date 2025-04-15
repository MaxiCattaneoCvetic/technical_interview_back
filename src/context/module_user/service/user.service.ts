import passwordHasher from "./utils/passwordHasher";

import { EasyStockLoggerService } from "src/context/shared/logger/logger.service";
import { UserRegisterDto } from "../models/dto/user.register.dto";
import { User } from "../models/entity/user.entity";
import { UserServiceInterface } from "./user.service.interface";

import { UserRepository } from "../repository/user.repository";
import { Inject } from "@nestjs/common";




export class UserService implements UserServiceInterface {

    constructor(
        @Inject('UserRepositoryInterface')
        private readonly userRepository: UserRepository
    ) {

    }


    async register(userRegisterDto: UserRegisterDto): Promise<any> {
        try {
            EasyStockLoggerService.getInstance().log('Creating user with email: ' + userRegisterDto.email);

            const paswordHashed = await passwordHasher(userRegisterDto.password);
            const user = new User(userRegisterDto.email, paswordHashed);
            await this.userRepository.saveUser(user);
            EasyStockLoggerService.getInstance().log('User saved Successfully');
            return user.toUser();
        } catch (error: any) {
            EasyStockLoggerService.getInstance().error('Error creating user: ' + error.message);
            throw new Error(error.message);
        }
    }



}