import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
  @IsEmail({}, { message: 'Valid user email is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;
}
