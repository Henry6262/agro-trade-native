import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { InspectorController } from "./inspector.controller";
import { InspectorService } from "./inspector.service";

@Module({
  imports: [AuthModule],
  controllers: [InspectorController],
  providers: [InspectorService],
  exports: [InspectorService],
})
export class InspectorModule {}
