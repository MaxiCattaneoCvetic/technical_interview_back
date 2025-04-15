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

    @ApiProperty({
        description: 'Id of user',
        example: "2313232564984985",
    })
    public readonly _id: string;
}
