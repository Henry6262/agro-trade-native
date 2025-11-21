/**
 * Scenario Context Manager
 * Manages state during scenario execution with smart reference resolution
 */

// Import UserRole type from simulationApi
import type { UserRole as SimulationUserRole } from './simulationApi'

// Type definitions
interface User {
  id: string
  email: string
  role: SimulationUserRole
  name?: string
  [key: string]: any
}

interface Product {
  id: string
  name: string
  category: string
  [key: string]: any
}

interface SaleListing {
  id: string
  farmerId: string
  productId: string
  [key: string]: any
}

interface BuyListing {
  id: string
  buyerId: string
  productId: string
  [key: string]: any
}

interface TradeOperation {
  id: string
  buyerId: string
  productId: string
  status: string
  [key: string]: any
}

interface Negotiation {
  id: string
  tradeOperationId: string
  sellerId: string
  [key: string]: any
}

interface Inspection {
  id: string
  inspectorId: string
  tradeOperationId: string
  [key: string]: any
}

interface TransportRequest {
  id: string
  tradeOperationId: string
  [key: string]: any
}

interface TransportBid {
  id: string
  transportRequestId: string
  transporterId: string
  [key: string]: any
}

interface TransportJob {
  id: string
  transportBidId: string
  transporterId: string
  [key: string]: any
}

interface ScenarioContext {
  users: {
    farmers: User[]
    buyers: User[]
    transporters: User[]
    inspectors: User[]
  }
  saleListings: SaleListing[]
  buyListings: BuyListing[]
  tradeOperations: TradeOperation[]
  negotiations: Negotiation[]
  inspections: Inspection[]
  transportRequests: TransportRequest[]
  transportBids: TransportBid[]
  transportJobs: TransportJob[]
  products: Map<string, Product>
}

type UserRole = 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'INSPECTOR' | 'ADMIN' | 'COMPANY_ADMIN'
type EntityType = keyof Omit<ScenarioContext, 'users' | 'products'>

/**
 * Manages scenario execution context with reference resolution
 */
export class ScenarioContextManager {
  private context: ScenarioContext
  private debugMode: boolean = true

  constructor() {
    this.clear()
  }

  /**
   * Clear all context state
   */
  clear(): void {
    this.context = {
      users: {
        farmers: [],
        buyers: [],
        transporters: [],
        inspectors: []
      },
      saleListings: [],
      buyListings: [],
      tradeOperations: [],
      negotiations: [],
      inspections: [],
      transportRequests: [],
      transportBids: [],
      transportJobs: [],
      products: new Map()
    }

    if (this.debugMode) {
      console.log('[ScenarioContext] Context cleared')
    }
  }

  /**
   * Add a user by role
   */
  addUser(role: UserRole, user: User): void {
    const roleMap: Partial<Record<UserRole, keyof ScenarioContext['users']>> = {
      'FARMER': 'farmers',
      'BUYER': 'buyers',
      'TRANSPORTER': 'transporters',
      'INSPECTOR': 'inspectors'
    }

    const collection = roleMap[role]
    if (!collection) {
      // For ADMIN and COMPANY_ADMIN roles, we don't store them in the context
      // as they're not part of the simulation actors
      if (this.debugMode) {
        console.log(`[ScenarioContext] Skipping ${role} user (not a simulation actor):`, user.id)
      }
      return
    }

    this.context.users[collection].push(user)

    if (this.debugMode) {
      console.log(`[ScenarioContext] Added ${role} user:`, user.id)
    }
  }

  /**
   * Get a user by role and index
   */
  getUser(role: UserRole, index: number): User | null {
    const roleMap: Partial<Record<UserRole, keyof ScenarioContext['users']>> = {
      'FARMER': 'farmers',
      'BUYER': 'buyers',
      'TRANSPORTER': 'transporters',
      'INSPECTOR': 'inspectors'
    }

    const collection = roleMap[role]
    if (!collection) {
      if (this.debugMode) {
        console.warn(`[ScenarioContext] Cannot get ${role} user (not a simulation actor)`)
      }
      return null
    }

    const users = this.context.users[collection]
    if (index < 0 || index >= users.length) {
      console.warn(`[ScenarioContext] User index out of bounds: ${role}[${index}]`)
      return null
    }

    return users[index]
  }

  /**
   * Get all users by role
   */
  getUsersByRole(role: UserRole): User[] {
    const roleMap: Partial<Record<UserRole, keyof ScenarioContext['users']>> = {
      'FARMER': 'farmers',
      'BUYER': 'buyers',
      'TRANSPORTER': 'transporters',
      'INSPECTOR': 'inspectors'
    }

    const collection = roleMap[role]
    if (!collection) {
      if (this.debugMode) {
        console.warn(`[ScenarioContext] Cannot get ${role} users (not a simulation actor)`)
      }
      return []
    }

    return this.context.users[collection]
  }

  /**
   * Add a product
   */
  addProduct(category: string, product: Product): void {
    this.context.products.set(category, product)

    if (this.debugMode) {
      console.log(`[ScenarioContext] Added product for category ${category}:`, product.id)
    }
  }

  /**
   * Get a product by category
   */
  getProduct(category: string): Product | null {
    const product = this.context.products.get(category)
    if (!product) {
      console.warn(`[ScenarioContext] Product not found for category: ${category}`)
      return null
    }
    return product
  }

  /**
   * Add an entity to the context
   */
  addEntity(entityType: EntityType, entity: any): void {
    if (!(entityType in this.context)) {
      throw new Error(`Invalid entity type: ${entityType}`)
    }

    (this.context[entityType] as any[]).push(entity)

    if (this.debugMode) {
      console.log(`[ScenarioContext] Added ${entityType}:`, entity.id || 'no-id')
    }
  }

  /**
   * Get an entity by type and index
   */
  getEntity(entityType: EntityType, index: number): any | null {
    if (!(entityType in this.context)) {
      console.error(`[ScenarioContext] Invalid entity type: ${entityType}`)
      return null
    }

    const entities = this.context[entityType] as any[]
    if (index < 0 || index >= entities.length) {
      console.warn(`[ScenarioContext] Entity index out of bounds: ${entityType}[${index}]`)
      return null
    }

    return entities[index]
  }

  /**
   * Get all entities of a type
   */
  getEntities(entityType: EntityType): any[] {
    if (!(entityType in this.context)) {
      console.error(`[ScenarioContext] Invalid entity type: ${entityType}`)
      return []
    }

    return this.context[entityType] as any[]
  }

  /**
   * Get the current (most recent) trade operation
   */
  getCurrentTradeOperation(): TradeOperation | null {
    const operations = this.context.tradeOperations
    if (operations.length === 0) {
      console.warn('[ScenarioContext] No trade operations in context')
      return null
    }
    return operations[operations.length - 1]
  }

  /**
   * Get the most recent entity of a type
   */
  getLatestEntity(entityType: EntityType): any | null {
    const entities = this.getEntities(entityType)
    if (entities.length === 0) {
      return null
    }
    return entities[entities.length - 1]
  }

  /**
   * Smart reference resolution
   * Transforms index references to actual IDs
   */
  resolveReference(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload
    }

    if (Array.isArray(payload)) {
      return payload.map(item => this.resolveReference(item))
    }

    const resolved: any = {}

    for (const [key, value] of Object.entries(payload)) {
      // Handle user index references
      if (key === 'farmerIndex' && typeof value === 'number') {
        const farmer = this.getUser('FARMER', value)
        if (farmer) {
          resolved.farmerId = farmer.id
          if (this.debugMode) {
            console.log(`[ScenarioContext] Resolved farmerIndex ${value} → farmerId: ${farmer.id}`)
          }
        }
      } else if (key === 'buyerIndex' && typeof value === 'number') {
        const buyer = this.getUser('BUYER', value)
        if (buyer) {
          resolved.buyerId = buyer.id
          if (this.debugMode) {
            console.log(`[ScenarioContext] Resolved buyerIndex ${value} → buyerId: ${buyer.id}`)
          }
        }
      } else if (key === 'transporterIndex' && typeof value === 'number') {
        const transporter = this.getUser('TRANSPORTER', value)
        if (transporter) {
          resolved.transporterId = transporter.id
          if (this.debugMode) {
            console.log(`[ScenarioContext] Resolved transporterIndex ${value} → transporterId: ${transporter.id}`)
          }
        }
      } else if (key === 'inspectorIndex' && typeof value === 'number') {
        const inspector = this.getUser('INSPECTOR', value)
        if (inspector) {
          resolved.inspectorId = inspector.id
          if (this.debugMode) {
            console.log(`[ScenarioContext] Resolved inspectorIndex ${value} → inspectorId: ${inspector.id}`)
          }
        }
      }
      // Handle product category references
      else if (key === 'productCategory' && typeof value === 'string') {
        const product = this.getProduct(value)
        if (product) {
          resolved.productId = product.id
          if (this.debugMode) {
            console.log(`[ScenarioContext] Resolved productCategory ${value} → productId: ${product.id}`)
          }
        }
      }
      // Handle entity index references
      else if (key.endsWith('Index') && typeof value === 'number') {
        const entityType = key.slice(0, -5) // Remove 'Index' suffix
        const entityName = this.pluralizeEntityType(entityType)

        if (entityName && entityName in this.context) {
          const entity = this.getEntity(entityName as EntityType, value)
          if (entity) {
            resolved[`${entityType}Id`] = entity.id
            if (this.debugMode) {
              console.log(`[ScenarioContext] Resolved ${key} ${value} → ${entityType}Id: ${entity.id}`)
            }
          }
        }
      }
      // Handle nested objects recursively
      else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveReference(value)
      }
      // Pass through other values unchanged
      else {
        resolved[key] = value
      }
    }

    // Include any original keys that weren't transformed
    for (const [key, value] of Object.entries(payload)) {
      if (!(key.endsWith('Index') || key === 'productCategory') && !(key in resolved)) {
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Helper to pluralize entity types for lookup
   */
  private pluralizeEntityType(singular: string): string | null {
    const pluralMap: Record<string, EntityType> = {
      'saleListing': 'saleListings',
      'buyListing': 'buyListings',
      'tradeOperation': 'tradeOperations',
      'negotiation': 'negotiations',
      'inspection': 'inspections',
      'transportRequest': 'transportRequests',
      'transportBid': 'transportBids',
      'transportJob': 'transportJobs'
    }

    return pluralMap[singular] || null
  }

  /**
   * Get the full context (for debugging)
   */
  getContext(): Readonly<ScenarioContext> {
    return {
      ...this.context,
      products: new Map(this.context.products)
    }
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Get statistics about the current context
   */
  getStats(): Record<string, number> {
    return {
      farmers: this.context.users.farmers.length,
      buyers: this.context.users.buyers.length,
      transporters: this.context.users.transporters.length,
      inspectors: this.context.users.inspectors.length,
      products: this.context.products.size,
      saleListings: this.context.saleListings.length,
      buyListings: this.context.buyListings.length,
      tradeOperations: this.context.tradeOperations.length,
      negotiations: this.context.negotiations.length,
      inspections: this.context.inspections.length,
      transportRequests: this.context.transportRequests.length,
      transportBids: this.context.transportBids.length,
      transportJobs: this.context.transportJobs.length
    }
  }

  // Compatibility methods for existing code
  reset() { this.clear() }
  setProduct(productCategory: string, productId: string) {
    this.addProduct(productCategory, { id: productId, name: productCategory, category: productCategory })
  }
  getProductId(productCategory: string): string {
    const product = this.getProduct(productCategory)
    return product ? product.id : productCategory
  }
  getState(): ScenarioContext { return this.getContext() as ScenarioContext }
  setUsers(users: ScenarioContext['users']) { this.context.users = users }
}

// Export singleton instance
export const scenarioContext = new ScenarioContextManager()

// Export types for external use
export type {
  ScenarioContext,
  User,
  Product,
  SaleListing,
  BuyListing,
  TradeOperation,
  Negotiation,
  Inspection,
  TransportRequest,
  TransportBid,
  TransportJob,
  UserRole,
  EntityType
}