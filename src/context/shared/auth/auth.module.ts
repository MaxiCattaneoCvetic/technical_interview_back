import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './login/controller/auth.controller';
import { AuthService } from './login/service/auth.service';
import { UserAuthRepository } from './login/repository/auth.repository';
import { AuthGuard } from './guard/auth.guard';
import { User } from 'src/context/module_user/models/entity/user.entity';


@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                global: true,
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: '60s',
                },
            }),
        }),
        TypeOrmModule.forFeature([User]),

    ],
    controllers: [AuthController],
    providers: [
        {
            provide: 'AuthServiceInterface',
            useClass: AuthService,
        },
        {
            provide: 'UserAuthRepositoryInterface',
            useClass: UserAuthRepository,
        },
        {
            provide: 'AuthGuard',
            useClass: AuthGuard,
        }
    ],
    exports: [
        JwtModule,
        {
            provide: 'AuthGuard',
            useClass: AuthGuard,
        }
    ]
})
export class AuthModule { }
