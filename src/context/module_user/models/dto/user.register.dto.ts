import { ApiProperty } from "@nestjs/swagger";


export class UserRegisterDto_response {

    @ApiProperty({
        description: 'Email of user',
        example: "ubnet@gmail.com",
    })
    public readonly email: string;
}




export class UserRegisterDto extends UserRegisterDto_response {

    @ApiProperty({
        description: 'Password of user',
        example: "1234",
    })
    public readonly password: string;


}
