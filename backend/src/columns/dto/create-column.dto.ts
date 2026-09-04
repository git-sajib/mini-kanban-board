import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty({ message: 'Column title is required' })
  title: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
