import { PrismaService } from "../../src/prisma/prisma.service";
import { faker } from "@faker-js/faker";

/**
 * Test Data Factory
 * Helper functions to create test data for integration tests
 */
export class TestDataFactory {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a test user
   */
  async createTestUser(data?: {
    email?: string;
    name?: string;
    role?:
      | "ADMIN"
      | "BUYER"
      | "FARMER"
      | "TRANSPORTER"
      | "INSPECTOR"
      | "COMPANY_ADMIN";
    phoneNumber?: string;
  }) {
    const email = data?.email || faker.internet.email();
    return await this.prisma.user.create({
      data: {
        email,
        name: data?.name || faker.person.fullName(),
        role: data?.role || "BUYER",
        phoneNumber: data?.phoneNumber || faker.phone.number(),
        isActive: true,
        isEmailVerified: true,
        onboardingCompleted: true,
      },
    });
  }

  /**
   * Create a test buyer user
   */
  async createTestBuyer(data?: { email?: string; name?: string }) {
    return await this.createTestUser({
      ...data,
      role: "BUYER",
    });
  }

  /**
   * Create a test seller (farmer) user
   */
  async createTestSeller(data?: {
    email?: string;
    name?: string;
    verified?: boolean;
  }) {
    const user = await this.createTestUser({
      email: data?.email,
      name: data?.name,
      role: "FARMER",
    });
    return user;
  }

  /**
   * Create a test transporter user
   */
  async createTestTransporter(data?: { email?: string; name?: string }) {
    return await this.createTestUser({
      ...data,
      role: "TRANSPORTER",
    });
  }

  /**
   * Create a test inspector user
   */
  async createTestInspector(data?: { email?: string; name?: string }) {
    return await this.createTestUser({
      ...data,
      role: "INSPECTOR",
    });
  }

  /**
   * Create a test admin user
   */
  async createTestAdmin(data?: { email?: string; name?: string }) {
    return await this.createTestUser({
      ...data,
      role: "ADMIN",
    });
  }

  /**
   * Create a test region
   */
  async createTestRegion(data?: { name?: string; country?: string }) {
    return await this.prisma.region.create({
      data: {
        name: data?.name || faker.location.state(),
        country: data?.country || "Bulgaria",
        isActive: true,
      },
    });
  }

  /**
   * Create a test city
   */
  async createTestCity(regionId: string, data?: { name?: string }) {
    return await this.prisma.city.create({
      data: {
        name: data?.name || faker.location.city(),
        regionId,
      },
    });
  }

  /**
   * Create a test address
   */
  async createTestAddress(
    userId: string,
    data?: {
      cityId?: string;
      latitude?: number;
      longitude?: number;
      street?: string;
      addressType?: "FARM" | "WAREHOUSE" | "DELIVERY" | "PICKUP" | "OTHER";
    },
  ) {
    const cityConnect = data?.cityId
      ? { city: { connect: { id: data.cityId } } }
      : {};

    return await this.prisma.address.create({
      data: {
        street: data?.street || faker.location.streetAddress(),
        latitude: data?.latitude || Number(faker.location.latitude()),
        longitude: data?.longitude || Number(faker.location.longitude()),
        addressType: data?.addressType || "FARM",
        isDefault: true,
        user: { connect: { id: userId } },
        ...cityConnect,
      },
    });
  }

  /**
   * Create a test product
   */
  async createTestProduct(data?: {
    category?: "SOFT_WHEAT" | "DURUM_WHEAT" | "CORN_MAIZE" | "BARLEY" | "OATS";
    name?: string;
    displayName?: string;
  }) {
    const category = data?.category || "SOFT_WHEAT";
    return await this.prisma.product.upsert({
      where: { category },
      update: {},
      create: {
        name: data?.name || category.toLowerCase().replace("_", "-"),
        category,
        displayName: data?.displayName || category.replace("_", " "),
        defaultUnit: "TON",
        isActive: true,
      },
    });
  }

  /**
   * Create a test buy listing
   */
  async createTestBuyListing(
    buyerId: string,
    data: {
      productId: string;
      quantity: number;
      maxPricePerUnit?: number;
      deliveryAddressId?: string;
      neededBy?: Date;
    },
  ) {
    const bId = typeof buyerId === 'object' ? (buyerId as any).id : buyerId;
    const pId = typeof data.productId === 'object' ? (data.productId as any).id : data.productId;

    return await this.prisma.buyListing.create({
      data: {
        buyerId: bId,
        productId: pId,
        quantity: data.quantity,
        unit: "TON",
        maxPricePerUnit: data.maxPricePerUnit || 380,
        deliveryAddressId: data.deliveryAddressId,
        neededBy:
          data.neededBy || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });
  }

  /**
   * Create a test sale listing
   */
  async createTestSaleListing(
    sellerId: string,
    data: {
      productId: string;
      quantity: number;
      askingPrice?: number;
      addressId?: string;
      qualityScore?: number;
      qualityGrade?: string;
    },
  ) {
    const sId = typeof sellerId === 'object' ? (sellerId as any).id : sellerId;
    const pId = typeof data.productId === 'object' ? (data.productId as any).id : data.productId;

    return await this.prisma.saleListing.create({
      data: {
        sellerId: sId,
        productId: pId,
        quantity: data.quantity,
        unit: "TON",
        askingPrice: data.askingPrice || 320,
        addressId: data.addressId,
        qualityScore: data.qualityScore,
        qualityGrade: data.qualityGrade,
        harvestDate: new Date(),
        status: "ACTIVE",
      },
      include: {
        address: true,
      },
    });
  }

  /**
   * Create a test truck
   */
  async createTestTruck(
    ownerId: string,
    data?: {
      plateNumber?: string;
      capacity?: number;
      type?: "FLATBED" | "REFRIGERATED" | "TANKER" | "CONTAINER";
      transportCompanyId?: string;
    },
  ) {
    return await this.prisma.truck.create({
      data: {
        ownerId,
        plateNumber: data?.plateNumber || faker.vehicle.vrm(),
        capacity: data?.capacity || 20,
        unit: "TON",
        type: data?.type || "FLATBED",
        transportCompanyId: data?.transportCompanyId,
        isAvailable: true,
        latitude: Number(faker.location.latitude()),
        longitude: Number(faker.location.longitude()),
      },
    });
  }

  /**
   * Create a test transport company
   */
  async createTestTransportCompany(data?: {
    companyName?: string;
    mainEmail?: string;
    mainPhone?: string;
  }) {
    return await this.prisma.transportCompany.create({
      data: {
        companyName: data?.companyName || faker.company.name(),
        registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
        vatNumber: "BG" + faker.string.numeric(9),
        mainEmail: data?.mainEmail || faker.internet.email(),
        mainPhone: data?.mainPhone || faker.phone.number(),
        companyType: "EXTERNAL",
        isVerified: true,
        verifiedAt: new Date(),
        fleetSize: 10,
        operatingRegions: ["Sofia", "Plovdiv", "Varna"],
        specializations: ["Grain Transport", "Bulk Transport"],
      },
    });
  }

  /**
   * Create transport cost settings
   */
  async createTransportCostSettings(data?: {
    baseRatePerKm?: number;
    tier1Rate?: number;
    tier2Rate?: number;
    tier3Rate?: number;
  }) {
    return await this.prisma.transportCostSettings.upsert({
      where: { id: "default-transport-settings" },
      update: {},
      create: {
        id: "default-transport-settings",
        baseRatePerKm: data?.baseRatePerKm || 0.15,
        flatbedMultiplier: 1.0,
        refrigeratedMultiplier: 1.3,
        tankerMultiplier: 1.2,
        containerMultiplier: 1.1,
        tier1MaxKm: 50,
        tier1Rate: data?.tier1Rate || 0.15,
        tier2MaxKm: 200,
        tier2Rate: data?.tier2Rate || 0.13,
        tier3Rate: data?.tier3Rate || 0.11,
        loadingCostPerTon: 0.5,
        urgencySurcharge: 0.3,
        isActive: true,
      },
    });
  }

  /**
   * Create a full test scenario with buyer, sellers, product, listings
   */
  async createFullTradeScenario(options?: {
    sellerCount?: number;
    buyerQuantity?: number;
    sellerQuantity?: number;
    sellerPrice?: number;
    buyerPrice?: number;
    withAddresses?: boolean;
    withVerifiedSellers?: boolean[];
  }) {
    const sellerCount = options?.sellerCount || 3;
    const buyerQuantity = options?.buyerQuantity || 100;
    const sellerQuantity = options?.sellerQuantity || 40;
    const sellerPrice = options?.sellerPrice || 320;
    const buyerPrice = options?.buyerPrice || 350;
    const withAddresses = options?.withAddresses !== false;

    // Generate unique email suffix for this test scenario
    const uniqueSuffix = Date.now() + Math.random().toString(36).substring(7);

    // Create product
    const product = await this.createTestProduct({ category: "SOFT_WHEAT" });

    // Create admin
    const admin = await this.createTestAdmin({ email: `admin-${uniqueSuffix}@test.com` });

    // Create buyer
    const buyer = await this.createTestBuyer({ email: `buyer-${uniqueSuffix}@test.com` });
    let buyerAddress = null;
    if (withAddresses) {
      buyerAddress = await this.createTestAddress(buyer.id, {
        latitude: 42.6977,
        longitude: 23.3219, // Sofia
        addressType: "DELIVERY",
      });
    }

    // Create buy listing
    const buyListing = await this.createTestBuyListing(buyer.id, {
      productId: product.id,
      quantity: buyerQuantity,
      maxPricePerUnit: buyerPrice,
      deliveryAddressId: buyerAddress?.id,
    });

    // Create sellers and sale listings
    const sellers = [];
    const saleListings = [];
    for (let i = 0; i < sellerCount; i++) {
      const seller = await this.createTestSeller({
        email: `seller${i + 1}-${uniqueSuffix}@test.com`,
        verified: options?.withVerifiedSellers?.[i] || false,
      });
      sellers.push(seller);

      let sellerAddress = null;
      if (withAddresses) {
        // Different locations for each seller
        const coordinates = [
          { lat: 43.2141, lon: 27.9147 }, // Varna
          { lat: 42.1354, lon: 24.7453 }, // Plovdiv
          { lat: 42.5048, lon: 27.4626 }, // Burgas
        ];
        const coord = coordinates[i % coordinates.length];
        sellerAddress = await this.createTestAddress(seller.id, {
          latitude: coord.lat,
          longitude: coord.lon,
          addressType: "FARM",
        });
      }

      const saleListing = await this.createTestSaleListing(seller.id, {
        productId: product.id,
        quantity: sellerQuantity,
        askingPrice: sellerPrice,
        addressId: sellerAddress?.id,
        qualityScore: options?.withVerifiedSellers?.[i] ? 85 : undefined,
        qualityGrade: options?.withVerifiedSellers?.[i] ? "Premium" : undefined,
      });
      saleListings.push(saleListing);
    }

    // Create transport cost settings
    await this.createTransportCostSettings();

    // Create transporter
    const transporter = await this.createTestTransporter({
      email: `transporter-${uniqueSuffix}@test.com`,
    });
    const transportCompany = await this.createTestTransportCompany();
    const truck = await this.createTestTruck(transporter.id, {
      capacity: 25,
      type: "FLATBED",
      transportCompanyId: transportCompany.id,
    });

    // Create inspector
    const inspector = await this.createTestInspector({
      email: `inspector-${uniqueSuffix}@test.com`,
    });

    return {
      admin,
      buyer,
      buyerAddress,
      buyListing,
      sellers,
      saleListings,
      product,
      transporter,
      transportCompany,
      truck,
      inspector,
    };
  }
}
