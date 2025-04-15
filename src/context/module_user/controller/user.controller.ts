import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";

import { UserRegisterDto, UserRegisterDto_response } from "../models/dto/user.register.dto";
import { UserServiceInterface } from "../service/user.service.interface";
import { ApiBody, ApiResponse } from "@nestjs/swagger";

@Controller('register')
export class UserController {

    constructor(
        @Inject('UserServiceInterface')
        private userService: UserServiceInterface
    ) { }

    @HttpCode(HttpStatus.CREATED)
    @Post()
    @ApiBody({ type: UserRegisterDto })
    @ApiResponse({ status: 201, description: 'User created', type: UserRegisterDto_response })
    @ApiResponse({ status: 404, description: 'Bad request, check your payload' })
    @ApiResponse({ status: 500, description: 'Internal Server Error, contact the administrator' })
    register(@Body() userDto: UserRegisterDto) {
        try {

            return this.userService.register(userDto);
        } catch (error: any) {
            throw error;
        }
    }

}