import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';


import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { UserRepository } from './repository/user.repository';
import { User } from './models/entity/user.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [
        UserController
    ],
    providers: [
        {
            provide: 'UserServiceInterface',
            useClass: UserService
        },
        {
            provide: 'UserRepositoryInterface',
            useClass: UserRepository
        },
    ],
})
export class UserModule { }
