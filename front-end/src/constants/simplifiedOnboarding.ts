import type { UserRole, StepConfig } from "../types/onboarding"

// Simplified onboarding steps without base management
export const simplifiedRoleSteps: Record<UserRole, StepConfig[]> = {
  seller: [
    { id: "products", title: "Product", description: "Select one product to sell" },
    { id: "quantity-pricing", title: "Quantity & Pricing", description: "Set quantity and get market pricing" },
    { id: "custom-offer", title: "Custom Offer", description: "Request personalized offer" },
    { id: "account", title: "Account", description: "Create your account" },
  ],
  buyer: [
    { id: "products", title: "Products", description: "What you need to buy" },
    { id: "requirements", title: "Requirements", description: "Quantities & specs" },
    { id: "location", title: "Location", description: "Delivery location" },
    { id: "market", title: "Overview", description: "Review and complete" },
  ],
  transporter: [
    { id: "fleet", title: "Fleet", description: "Your vehicles" },
    { id: "coverage", title: "Coverage", description: "Service areas" },
    { id: "preferences", title: "Preferences", description: "Job preferences" },
    { id: "overview", title: "Overview", description: "Review and complete" },
  ],
}

// Export the original products list from main onboarding file
export { products } from './onboarding';