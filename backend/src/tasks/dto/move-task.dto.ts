import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'sourceColumnId is required' })
  sourceColumnId: string;

  @IsString()
  @IsNotEmpty({ message: 'targetColumnId is required' })
  targetColumnId: string;

  @IsNumber()
  @Min(0, { message: 'newOrder must be a positive integer or 0' })
  newOrder: number;
}
