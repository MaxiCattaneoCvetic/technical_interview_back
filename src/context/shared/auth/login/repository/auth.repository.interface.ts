export interface UserAuthRepositoryInterface {
    findByEmail(email: string): Promise<any>
    
}