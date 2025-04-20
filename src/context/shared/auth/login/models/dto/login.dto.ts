
export class LoginDto {
  email: string;
  password: string;
}

export class LoginDto_response {

  access_token: string;
  secret: string;
  user: {
    id: any;
    email: string;
  }


}