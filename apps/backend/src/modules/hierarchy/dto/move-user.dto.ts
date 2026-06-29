import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class MoveUserDto {
  @ApiProperty({ description: "ID of the target hierarchy node to move under" })
  @IsUUID()
  targetParentId: string;
}
