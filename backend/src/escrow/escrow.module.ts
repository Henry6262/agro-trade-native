import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EscrowController } from "./escrow.controller";
import { EscrowService } from "./escrow.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
