import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const ALLOWED_CREATE_ROLES = ["MASTER_ID", "AGENT", "USER"] as const;

export class CreateUserDto {
  @ApiProperty({ example: "agent@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "agent01" })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: "SecurePass123!" })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: "Agent One", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ enum: ALLOWED_CREATE_ROLES, example: "AGENT" })
  @IsString()
  @IsIn(ALLOWED_CREATE_ROLES, {
    message: "Role must be one of: MASTER_ID, AGENT, USER",
  })
  role: string;

  @ApiPropertyOptional({ example: "ABC12345", description: "Referral code of the referrer" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  referralCode?: string;
}
