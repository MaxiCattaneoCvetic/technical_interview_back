import {
    Body, Controller, Post, HttpCode, HttpStatus, Inject
} from '@nestjs/common';

import { LoginDto, LoginDto_response } from '../models/dto/login.dto';
import { AuthServiceInterface } from '../service/auth.service.interface';


@Controller('auth')
export class AuthController {
    constructor(
        @Inject('AuthServiceInterface')
        private readonly authService: AuthServiceInterface,

    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<LoginDto_response> {
        return this.authService.login(loginDto);
    }


}


