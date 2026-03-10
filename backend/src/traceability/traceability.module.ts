import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { TraceabilityController } from "./traceability.controller";
import { TraceabilityService } from "./traceability.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TraceabilityController],
  providers: [TraceabilityService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
