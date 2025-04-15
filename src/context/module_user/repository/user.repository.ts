
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../models/entity/user.entity';
import { UserRepositoryInterface } from './user.repository.interface';


export class UserRepository implements UserRepositoryInterface {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async saveUser(user: Partial<User>): Promise<any> {
        try {
            const userSaved = this.userRepository.create(user);
            return this.userRepository.save(userSaved);
        } catch (error: any) {
            throw error;
        }
    }



}