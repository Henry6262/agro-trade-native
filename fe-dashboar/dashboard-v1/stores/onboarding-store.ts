import { create } from "zustand"
import { devtools } from "zustand/middleware"

export interface ProductSpecification {
  [key: string]: string | number
}

export interface TruckInfo {
  id: string
  capacity: number
  unit: "tons" | "kg"
}

export interface OnboardingState {
  // Common state
  userType: "seller" | "buyer" | "transporter" | null
  selectedProducts: string[]

  // Seller state
  sellerSpecifications: Record<string, ProductSpecification>

  // Buyer state
  buyerSpecifications: Record<string, ProductSpecification>
  buyerCustomRequirements: Record<string, Array<{ field: string; value: string; type: string }>>
  deliveryDeadline: string

  // Transporter state
  transporterFleet: TruckInfo[]
  transporterLocation: {
    city: string
    state: string
    country: string
  }
  transporterTotalCapacity: number

  // Actions
  setUserType: (type: "seller" | "buyer" | "transporter") => void
  setSelectedProducts: (products: string[]) => void
  updateSellerSpecification: (productId: string, specs: ProductSpecification) => void
  updateBuyerSpecification: (productId: string, specs: ProductSpecification) => void
  addBuyerCustomRequirement: (productId: string, requirement: { field: string; value: string; type: string }) => void
  removeBuyerCustomRequirement: (productId: string, index: number) => void
  setDeliveryDeadline: (deadline: string) => void

  // Transporter actions
  addTruck: (truck: TruckInfo) => void
  removeTruck: (truckId: string) => void
  updateTruck: (truckId: string, updates: Partial<TruckInfo>) => void
  setTransporterLocation: (location: { city: string; state: string; country: string }) => void
  calculateTotalCapacity: () => void

  resetStore: () => void
}

const initialState = {
  userType: null,
  selectedProducts: [],
  sellerSpecifications: {},
  buyerSpecifications: {},
  buyerCustomRequirements: {},
  deliveryDeadline: "",
  transporterFleet: [],
  transporterLocation: { city: "", state: "", country: "" },
  transporterTotalCapacity: 0,
}

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setUserType: (type) => {
        console.log("[AGRI] Zustand: Setting user type:", type)
        set({ userType: type })
      },

      setSelectedProducts: (products) => {
        console.log("[AGRI] Zustand: Setting selected products:", products)
        set({ selectedProducts: products })
      },

      updateSellerSpecification: (productId, specs) =>
        set((state) => ({
          sellerSpecifications: {
            ...state.sellerSpecifications,
            [productId]: { ...state.sellerSpecifications[productId], ...specs },
          },
        })),

      updateBuyerSpecification: (productId, specs) =>
        set((state) => ({
          buyerSpecifications: {
            ...state.buyerSpecifications,
            [productId]: { ...state.buyerSpecifications[productId], ...specs },
          },
        })),

      addBuyerCustomRequirement: (productId, requirement) =>
        set((state) => ({
          buyerCustomRequirements: {
            ...state.buyerCustomRequirements,
            [productId]: [...(state.buyerCustomRequirements[productId] || []), requirement],
          },
        })),

      removeBuyerCustomRequirement: (productId, index) =>
        set((state) => ({
          buyerCustomRequirements: {
            ...state.buyerCustomRequirements,
            [productId]: state.buyerCustomRequirements[productId]?.filter((_, i) => i !== index) || [],
          },
        })),

      setDeliveryDeadline: (deadline) => set({ deliveryDeadline: deadline }),

      addTruck: (truck) =>
        set((state) => {
          const newFleet = [...state.transporterFleet, truck]
          const totalCapacity = newFleet.reduce((sum, t) => sum + t.capacity, 0)
          return {
            transporterFleet: newFleet,
            transporterTotalCapacity: totalCapacity,
          }
        }),

      removeTruck: (truckId) =>
        set((state) => {
          const newFleet = state.transporterFleet.filter((truck) => truck.id !== truckId)
          const totalCapacity = newFleet.reduce((sum, t) => sum + t.capacity, 0)
          return {
            transporterFleet: newFleet,
            transporterTotalCapacity: totalCapacity,
          }
        }),

      updateTruck: (truckId, updates) =>
        set((state) => {
          const newFleet = state.transporterFleet.map((truck) =>
            truck.id === truckId ? { ...truck, ...updates } : truck,
          )
          const totalCapacity = newFleet.reduce((sum, truck) => sum + truck.capacity, 0)
          return {
            transporterFleet: newFleet,
            transporterTotalCapacity: totalCapacity,
          }
        }),

      setTransporterLocation: (location) => set({ transporterLocation: location }),

      calculateTotalCapacity: () =>
        set((state) => ({
          transporterTotalCapacity: state.transporterFleet.reduce((sum, truck) => sum + truck.capacity, 0),
        })),

      resetStore: () => set(initialState),
    }),
    { name: "onboarding-store" },
  ),
)