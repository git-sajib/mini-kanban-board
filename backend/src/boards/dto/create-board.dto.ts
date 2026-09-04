import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty({ message: 'Board title is required' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
