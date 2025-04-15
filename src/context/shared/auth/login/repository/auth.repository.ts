import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/context/module_user/models/entity/user.entity";
import { UserAuthRepositoryInterface } from "./auth.repository.interface";

export class UserAuthRepository implements UserAuthRepositoryInterface {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOneBy({ email });
    }

    // Ejemplo adicional: Método para guardar usuario
    async saveUser(user: User): Promise<User> {
        return this.userRepository.save(user);
    }
}