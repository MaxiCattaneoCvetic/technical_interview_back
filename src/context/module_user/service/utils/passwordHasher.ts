import * as bcrypt from 'bcrypt';


const passwordHasher = async (passwordToHash: string): Promise<string> => {
    const saltOrRounds = 10;
    return await bcrypt.hash(passwordToHash, saltOrRounds);

};


export default passwordHasher;