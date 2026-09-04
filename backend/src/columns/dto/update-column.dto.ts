import { IsOptional, IsNumber, IsString } from 'class-validator';

export class UpdateColumnDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
