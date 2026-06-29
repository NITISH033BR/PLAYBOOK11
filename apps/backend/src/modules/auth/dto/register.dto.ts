import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "johndoe" })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: "SecurePass123!" })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ example: "ABC12345", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  referralCode?: string;
}
