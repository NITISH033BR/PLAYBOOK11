import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePlayerDto {
  @ApiProperty({ example: "player@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "player1" })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: "SecurePass123!" })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiPropertyOptional({ example: "Player One" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}
