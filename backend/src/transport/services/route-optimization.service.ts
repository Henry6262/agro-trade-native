import { Injectable, Logger } from "@nestjs/common";

export interface Location {
  lat: number;
  lng: number;
}

export interface Pickup extends Location {
  id: string;
  quantity: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

export interface RoutePoint {
  type: "warehouse" | "pickup" | "delivery";
  id?: string;
  location: Location;
  quantity?: number;
  distanceFromPrevious: number;
  cumulativeDistance: number;
  estimatedArrival?: Date;
  estimatedDeparture?: Date;
}

export interface OptimizedRoute {
  sequence: RoutePoint[];
  totalDistance: number;
  totalDuration: number; // in minutes
  algorithm: "nearest_neighbor" | "tsp_2opt" | "genetic";
}

export interface RouteComparison {
  originalDistance: number;
  optimizedDistance: number;
  distanceSaved: number;
  percentageSaved: number;
}

export interface RouteConstraints {
  maxDistance?: number;
  maxDuration?: number; // in minutes
  priorityPickupsFirst?: boolean;
  vehicleCapacity?: number;
}

export interface MultiTripSuggestion {
  requiredTrips: number;
  trips: Array<{
    tripNumber: number;
    totalQuantity: number;
    pickups: Pickup[];
    distance: number;
  }>;
}

@Injectable()
export class RouteOptimizationService {
  private readonly logger = new Logger(RouteOptimizationService.name);
  private cache = new Map<string, OptimizedRoute>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Optimize route for multiple pickup points
   */
  async optimizeRoute(
    warehouseLocation: Location,
    pickups: Pickup[],
    deliveryLocation: Location,
    algorithm: "nearest_neighbor" | "tsp_2opt" | "genetic" = "tsp_2opt",
    constraints?: RouteConstraints,
  ): Promise<{
    optimizedRoute: OptimizedRoute;
    comparison: RouteComparison;
    metrics: {
      computationTime: number;
      numberOfPermutations: number;
      optimizationLevel: string;
    };
  }> {
        // NI-9: Input validation
    if (!pickups || pickups.length === 0) {
      throw new Error('At least one pickup location is required for route optimization');
    }
    if (!warehouseLocation || !deliveryLocation) {
      throw new Error('Warehouse and delivery locations are required');
    }

    try {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.generateCacheKey(
      warehouseLocation,
      pickups,
      deliveryLocation,
    );
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        optimizedRoute: cached,
        comparison: this.calculateComparison(
          warehouseLocation,
          pickups,
          deliveryLocation,
          cached,
        ),
        metrics: {
          computationTime: 0,
          numberOfPermutations: 0,
          optimizationLevel: "cached",
        },
      };
    }

    // Handle constraints
    if (constraints?.priorityPickupsFirst) {
      pickups = this.sortByPriority(pickups);
    }

    // Choose optimization algorithm
    let optimizedSequence: Pickup[];
    let permutations = 0;

    switch (algorithm) {
      case "nearest_neighbor":
        optimizedSequence = this.nearestNeighbor(
          warehouseLocation,
          pickups,
          deliveryLocation,
        );
        permutations = pickups.length;
        break;
      case "tsp_2opt":
        const nn = this.nearestNeighbor(
          warehouseLocation,
          pickups,
          deliveryLocation,
        );
        const result = this.twoOptImprovement(
          warehouseLocation,
          nn,
          deliveryLocation,
        );
        optimizedSequence = result.sequence;
        permutations = result.permutations;
        break;
      case "genetic":
        // Simplified genetic algorithm for demonstration
        optimizedSequence = this.geneticAlgorithm(
          warehouseLocation,
          pickups,
          deliveryLocation,
        );
        permutations = pickups.length * 100; // Approximate
        break;
      default:
        optimizedSequence = pickups;
    }

    // Create route points
    const routePoints = this.createRoutePoints(
      warehouseLocation,
      optimizedSequence,
      deliveryLocation,
    );

    // Calculate total distance and duration
    const totalDistance =
      routePoints[routePoints.length - 1].cumulativeDistance;
    const totalDuration = this.estimateDuration(totalDistance);

    const optimizedRoute: OptimizedRoute = {
      sequence: routePoints,
      totalDistance,
      totalDuration,
      algorithm,
    };

    // Cache the result
    this.cacheRoute(cacheKey, optimizedRoute);

    // Calculate comparison
    const comparison = this.calculateComparison(
      warehouseLocation,
      pickups,
      deliveryLocation,
      optimizedRoute,
    );

    const computationTime = Date.now() - startTime;

    return {
      optimizedRoute,
      comparison,
      metrics: {
        computationTime,
        numberOfPermutations: permutations,
        optimizationLevel: algorithm,
      },
    };
        } catch (error) {
      this.logger.error(`Route optimization failed: ${error.message}`, error.stack);
      throw new Error(`Route optimization failed: ${error.message}`);
    }
  }

  /**
   * Nearest Neighbor Algorithm
   */
  private nearestNeighbor(
    start: Location,
    pickups: Pickup[],
    end: Location,
  ): Pickup[] {
    void end;
    if (pickups.length === 0) return [];
    if (pickups.length === 1) return pickups;

    const result: Pickup[] = [];
    const remaining = [...pickups];
    let current = start;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.haversineDistance(current, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.haversineDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      result.push(nearest);
      current = nearest;
    }

    return result;
  }

  /**
   * 2-opt Improvement Algorithm
   */
  private twoOptImprovement(
    start: Location,
    sequence: Pickup[],
    end: Location,
  ): { sequence: Pickup[]; permutations: number } {
    let improved = true;
    let permutations = 0;
    let currentSequence = [...sequence];

    while (improved) {
      improved = false;

      for (let i = 0; i < currentSequence.length - 1; i++) {
        for (let j = i + 2; j < currentSequence.length; j++) {
          permutations++;

          // Calculate current distance
          const currentDistance = this.calculateSegmentDistance(
            start,
            currentSequence,
            end,
            i,
            j,
          );

          // Try swapping
          const newSequence = this.twoOptSwap(currentSequence, i, j);
          const newDistance = this.calculateSegmentDistance(
            start,
            newSequence,
            end,
            i,
            j,
          );

          if (newDistance < currentDistance) {
            currentSequence = newSequence;
            improved = true;
          }
        }
      }
    }

    return { sequence: currentSequence, permutations };
  }

  /**
   * Perform 2-opt swap
   */
  private twoOptSwap(sequence: Pickup[], i: number, j: number): Pickup[] {
    const newSequence = [...sequence];
    // Reverse the segment between i+1 and j
    const segment = newSequence.slice(i + 1, j + 1).reverse();
    newSequence.splice(i + 1, j - i, ...segment);
    return newSequence;
  }

  /**
   * Simplified Genetic Algorithm
   */
  private geneticAlgorithm(
    start: Location,
    pickups: Pickup[],
    end: Location,
  ): Pickup[] {
    if (pickups.length <= 3) {
      return this.nearestNeighbor(start, pickups, end);
    }

    const populationSize = Math.min(50, Math.pow(pickups.length, 2));
    const generations = 100;
    const mutationRate = 0.1;

    // Create initial population
    let population: Pickup[][] = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(this.shuffleArray([...pickups]));
    }

    // Evolve
    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness (inverse of distance)
      const fitness = population.map((seq) => {
        const distance = this.calculateTotalDistance(start, seq, end);
        return 1 / (distance + 1);
      });

      // Select best individuals
      const sorted = population
        .map((seq, i) => ({ seq, fitness: fitness[i] }))
        .sort((a, b) => b.fitness - a.fitness);

      // Keep top 50%
      const survivors = sorted
        .slice(0, populationSize / 2)
        .map((item) => item.seq);

      // Create new generation
      population = [...survivors];
      while (population.length < populationSize) {
        const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
        const parent2 = survivors[Math.floor(Math.random() * survivors.length)];
        const child = this.crossover(parent1, parent2);

        // Mutation
        if (Math.random() < mutationRate) {
          this.mutate(child);
        }

        population.push(child);
      }
    }

    // Return best solution
    const bestIndex = population
      .map((seq, i) => ({
        index: i,
        distance: this.calculateTotalDistance(start, seq, end),
      }))
      .sort((a, b) => a.distance - b.distance)[0].index;

    return population[bestIndex];
  }

  /**
   * Crossover operation for genetic algorithm
   */
  private crossover(parent1: Pickup[], parent2: Pickup[]): Pickup[] {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;

    const child: Pickup[] = [];
    const used = new Set<string>();

    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
      used.add(parent1[i].id);
    }

    // Fill remaining from parent2
    let currentIndex = 0;
    for (const pickup of parent2) {
      if (!used.has(pickup.id)) {
        while (child[currentIndex] !== undefined) {
          currentIndex++;
        }
        child[currentIndex] = pickup;
      }
    }

    return child;
  }

  /**
   * Mutation operation for genetic algorithm
   */
  private mutate(sequence: Pickup[]): void {
    const i = Math.floor(Math.random() * sequence.length);
    const j = Math.floor(Math.random() * sequence.length);
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  /**
   * Create route points with distances
   */
  private createRoutePoints(
    warehouse: Location,
    pickups: Pickup[],
    delivery: Location,
  ): RoutePoint[] {
    const points: RoutePoint[] = [];
    let cumulativeDistance = 0;
    let previousLocation = warehouse;

    // Add warehouse
    points.push({
      type: "warehouse",
      location: warehouse,
      distanceFromPrevious: 0,
      cumulativeDistance: 0,
    });

    // Add pickups
    for (const pickup of pickups) {
      const distance = this.haversineDistance(previousLocation, pickup);
      cumulativeDistance += distance;

      points.push({
        type: "pickup",
        id: pickup.id,
        location: pickup,
        quantity: pickup.quantity,
        distanceFromPrevious: distance,
        cumulativeDistance,
      });

      previousLocation = pickup;
    }

    // Add delivery
    const finalDistance = this.haversineDistance(previousLocation, delivery);
    cumulativeDistance += finalDistance;

    points.push({
      type: "delivery",
      location: delivery,
      distanceFromPrevious: finalDistance,
      cumulativeDistance,
    });

    return points;
  }

  /**
   * Calculate comparison metrics
   */
  private calculateComparison(
    warehouse: Location,
    originalPickups: Pickup[],
    delivery: Location,
    optimizedRoute: OptimizedRoute,
  ): RouteComparison {
    // Calculate original distance (in order given)
    const originalDistance = this.calculateTotalDistance(
      warehouse,
      originalPickups,
      delivery,
    );
    const optimizedDistance = optimizedRoute.totalDistance;
    const distanceSaved = originalDistance - optimizedDistance;
    const percentageSaved = (distanceSaved / originalDistance) * 100;

    return {
      originalDistance,
      optimizedDistance,
      distanceSaved: Math.max(0, distanceSaved),
      percentageSaved: Math.max(0, percentageSaved),
    };
  }

  /**
   * Calculate total distance for a sequence
   */
  private calculateTotalDistance(
    start: Location,
    sequence: Pickup[],
    end: Location,
  ): number {
    let distance = 0;
    let current = start;

    for (const point of sequence) {
      distance += this.haversineDistance(current, point);
      current = point;
    }

    distance += this.haversineDistance(current, end);
    return distance;
  }

  /**
   * Calculate segment distance for 2-opt
   */
  private calculateSegmentDistance(
    start: Location,
    sequence: Pickup[],
    end: Location,
    i: number,
    j: number,
  ): number {
    let distance = 0;

    // Before segment
    if (i === 0) {
      distance += this.haversineDistance(start, sequence[0]);
    } else {
      distance += this.haversineDistance(sequence[i - 1], sequence[i]);
    }

    // After segment
    if (j === sequence.length - 1) {
      distance += this.haversineDistance(sequence[j], end);
    } else {
      distance += this.haversineDistance(sequence[j], sequence[j + 1]);
    }

    return distance;
  }

  /**
   * Haversine distance calculation
   */
  private haversineDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Estimate duration based on distance
   */
  private estimateDuration(distance: number, avgSpeed: number = 60): number {
    // Assuming average speed of 60 km/h
    return Math.round((distance / avgSpeed) * 60); // Convert to minutes
  }

  /**
   * Sort pickups by priority
   */
  private sortByPriority(pickups: Pickup[]): Pickup[] {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...pickups].sort((a, b) => {
      const aPriority = priorityOrder[a.priority || "LOW"];
      const bPriority = priorityOrder[b.priority || "LOW"];
      return aPriority - bPriority;
    });
  }

  /**
   * Shuffle array for genetic algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    warehouse: Location,
    pickups: Pickup[],
    delivery: Location,
  ): string {
    const pickupKey = pickups
      .map((p) => `${p.id}-${p.lat}-${p.lng}`)
      .sort()
      .join("|");
    return `${warehouse.lat},${warehouse.lng}-${pickupKey}-${delivery.lat},${delivery.lng}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): OptimizedRoute | null {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < this.CACHE_TTL) {
        this.logger.debug(`Cache hit for route: ${key}`);
        return cached;
      }
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Cache route
   */
  private cacheRoute(key: string, route: OptimizedRoute): void {
    (route as any).timestamp = Date.now();
    this.cache.set(key, route);
    this.logger.debug(`Cached route: ${key}`);
  }

  /**
   * Handle vehicle capacity constraints
   */
  handleCapacityConstraints(
    pickups: Pickup[],
    vehicleCapacity: number,
  ): MultiTripSuggestion | null {
    const totalQuantity = pickups.reduce((sum, p) => sum + p.quantity, 0);

    if (totalQuantity <= vehicleCapacity) {
      return null; // No multi-trip needed
    }

    const requiredTrips = Math.ceil(totalQuantity / vehicleCapacity);
    const trips: MultiTripSuggestion["trips"] = [];

    // Simple bin packing algorithm
    const sortedPickups = [...pickups].sort((a, b) => b.quantity - a.quantity);

    for (let tripNum = 1; tripNum <= requiredTrips; tripNum++) {
      const tripPickups: Pickup[] = [];
      let currentCapacity = 0;

      for (let i = 0; i < sortedPickups.length; i++) {
        const pickup = sortedPickups[i];
        if (currentCapacity + pickup.quantity <= vehicleCapacity) {
          tripPickups.push(pickup);
          currentCapacity += pickup.quantity;
          sortedPickups.splice(i, 1);
          i--;
        }
      }

      if (tripPickups.length > 0) {
        trips.push({
          tripNumber: tripNum,
          totalQuantity: currentCapacity,
          pickups: tripPickups,
          distance: 0, // Would be calculated based on route
        });
      }
    }

    return {
      requiredTrips,
      trips,
    };
  }
}
