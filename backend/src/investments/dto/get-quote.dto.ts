import { IsString, IsNotEmpty, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetQuoteDto {
  @ApiProperty({ description: 'The mint address of the input token' })
  @IsString()
  @IsNotEmpty()
  inputMint: string;

  @ApiProperty({ description: 'The mint address of the output token' })
  @IsString()
  @IsNotEmpty()
  outputMint: string;

  @ApiProperty({ description: 'The amount of input token in lamports' })
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
