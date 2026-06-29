import { Module } from "@nestjs/common";
import { HierarchyController } from "./hierarchy.controller";
import { HierarchyService } from "./hierarchy.service";
import { ExposureService } from "./exposure.service";
import { DashboardService } from "./dashboard.service";
import { HierarchyGuard } from "./hierarchy.guard";

@Module({
  controllers: [HierarchyController],
  providers: [
    HierarchyService,
    ExposureService,
    DashboardService,
    HierarchyGuard,
  ],
  exports: [HierarchyService, ExposureService, DashboardService],
})
export class HierarchyModule {}
