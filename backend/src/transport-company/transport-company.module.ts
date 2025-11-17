import { Module } from "@nestjs/common";
import { TransportCompanyController } from "./transport-company.controller";
import { TransportCompanyService } from "./transport-company.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TransportCompanyController],
  providers: [TransportCompanyService],
  exports: [TransportCompanyService],
})
export class TransportCompanyModule {}
