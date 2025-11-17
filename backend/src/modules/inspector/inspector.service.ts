import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import {
  AcceptJobDto,
  LocationUpdateDto,
  VerificationResultDto,
  JobFilterDto,
} from "./dto";

@Injectable()
export class InspectorService {
  // Mock data storage
  private jobs = new Map();
  private inspectorProfiles = new Map();
  private locationUpdates: any[] = [];
  private verificationResults = new Map();

  constructor() {
    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock jobs
    const mockJobs = [
      {
        id: "job-001",
        sellerListingId: "listing-123",
        inspectorId: null,
        priority: "HIGH",
        status: "PENDING",
        location: {
          latitude: 42.6977,
          longitude: 23.3219,
          address: "Field Road 123",
          city: "Plovdiv",
          region: "Plovdiv Province",
        },
        productDetails: {
          name: "Wheat Grade A",
          type: "Grain",
          quantity: 1000,
          unit: "kg",
          claimedSpecs: {
            moisture: "12%",
            protein: "14%",
            gluten: "28%",
          },
        },
        estimatedDuration: 120,
        distance: 25.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more mock jobs as needed
    ];

    mockJobs.forEach((job) => this.jobs.set(job.id, job));

    // Mock inspector profile
    this.inspectorProfiles.set("inspector-001", {
      id: "inspector-001",
      userId: "user-123",
      employeeId: "EMP001",
      specializations: ["Grain", "Seeds"],
      certifications: [],
      isAvailable: true,
      totalJobsCompleted: 47,
      averageRating: 4.7,
    });
  }

  async getJobs(filters: JobFilterDto) {
    const allJobs = Array.from(this.jobs.values());

    let filteredJobs = allJobs;

    if (filters.priority) {
      filteredJobs = filteredJobs.filter(
        (job) => job.priority === filters.priority,
      );
    }

    if (filters.status) {
      filteredJobs = filteredJobs.filter(
        (job) => job.status === filters.status,
      );
    }

    if (filters.lat && filters.lng && filters.radius) {
      // Simple distance filter (would use proper geospatial query in real implementation)
      filteredJobs = filteredJobs.filter((job) => {
        const distance = this.calculateDistance(
          filters.lat!,
          filters.lng!,
          job.location.latitude,
          job.location.longitude,
        );
        return distance <= filters.radius!;
      });
    }

    return filteredJobs;
  }

  async getJobById(id: string) {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  async acceptJob(jobId: string, acceptDto: AcceptJobDto) {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    if (job.inspectorId) {
      throw new ConflictException("Job already assigned");
    }

    // Check if inspector has active job
    const hasActiveJob = Array.from(this.jobs.values()).some(
      (j) =>
        j.inspectorId === acceptDto.inspectorId && j.status === "IN_PROGRESS",
    );

    if (hasActiveJob) {
      throw new BadRequestException("Inspector already has an active job");
    }

    // Validate estimated arrival
    const arrivalTime = new Date(acceptDto.estimatedArrival);
    if (arrivalTime <= new Date()) {
      throw new BadRequestException("Estimated arrival must be in the future");
    }

    // Update job
    job.inspectorId = acceptDto.inspectorId;
    job.status = "ASSIGNED";
    job.acceptedAt = new Date();
    job.updatedAt = new Date();

    this.jobs.set(jobId, job);
    return job;
  }

  async completeJob(jobId: string, resultDto: VerificationResultDto) {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    if (job.status !== "IN_PROGRESS") {
      throw new BadRequestException("Job must be in progress to complete");
    }

    // Validate result
    if (!resultDto.testMethods || resultDto.testMethods.length === 0) {
      throw new BadRequestException("At least one test method is required");
    }

    if (resultDto.verificationStatus === "FAILED" && !resultDto.notes) {
      throw new BadRequestException(
        "Notes are required for failed verification",
      );
    }

    // Validate evidence URLs
    if (resultDto.evidence) {
      for (const item of resultDto.evidence) {
        if (!this.isValidUrl(item.url)) {
          throw new BadRequestException("Invalid URL in evidence");
        }
      }
    }

    // Store result
    const result = {
      id: `result-${Date.now()}`,
      ...resultDto,
      createdAt: new Date(),
    };
    this.verificationResults.set(result.id, result);

    // Update job status
    job.status = "COMPLETED";
    job.completedAt = new Date();
    job.updatedAt = new Date();
    this.jobs.set(jobId, job);

    // Lock seller listing (mock implementation)
    // In real implementation, this would update the seller listing

    return result;
  }

  async updateLocation(updateDto: LocationUpdateDto) {
    // Store location update
    this.locationUpdates.push({
      ...updateDto,
      id: `loc-${Date.now()}`,
      createdAt: new Date(),
    });

    return { success: true, message: "Location updated" };
  }

  async getInspectorProfile(userId: string) {
    // In real implementation, would fetch from database based on auth
    const profile = this.inspectorProfiles.get("inspector-001");
    if (!profile) {
      throw new NotFoundException("Inspector profile not found");
    }
    return profile;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
