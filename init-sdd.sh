#!/bin/bash

# Spec-Driven Development Setup Script for Agro-Trade
# This script initializes the GitHub SDD SDK and sets up the specification structure

set -e

echo "🚀 Initializing Spec-Driven Development for Agro-Trade"
echo "======================================================="

# Check if Python and uv are installed
check_requirements() {
    echo "📋 Checking system requirements..."
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed. Please install Python 3.11+"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git is not installed. Please install Git"
        exit 1
    fi
    
    echo "✅ Basic requirements met"
}

# Install uv if not present
install_uv() {
    if ! command -v uv &> /dev/null; then
        echo "📦 Installing uv package manager..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        source $HOME/.cargo/env
    else
        echo "✅ uv is already installed"
    fi
}

# Initialize Specify in the project
init_specify() {
    echo "🔧 Initializing Specify CLI..."
    
    # Use Claude as the default AI assistant since you're using Claude Code
    # Use yes to auto-confirm the prompt since we're in an existing directory
    echo "y" | uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai claude --script sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Specify CLI initialized successfully"
    else
        echo "⚠️  Specify initialization completed with warnings"
    fi
}

# Create specification directory structure
create_spec_structure() {
    echo "📁 Creating specification directory structure..."
    
    # Create main specs directory
    mkdir -p specs/{features,api,ui,workflows,data-models,integrations}
    
    # Create feature subdirectories
    mkdir -p specs/features/{buyer,seller,transporter,admin,shared}
    
    # Create API subdirectories
    mkdir -p specs/api/{endpoints,models,authentication,webhooks}
    
    # Create UI subdirectories
    mkdir -p specs/ui/{components,screens,navigation,styles}
    
    # Create workflow subdirectories
    mkdir -p specs/workflows/{onboarding,trading,logistics,payments}
    
    echo "✅ Specification structure created"
}

# Create specification templates
create_templates() {
    echo "📝 Creating specification templates..."
    
    # Feature specification template
    cat > specs/FEATURE_TEMPLATE.md << 'EOF'
# Feature: [Feature Name]

## Overview
[Provide a brief description of the feature and its purpose]

## User Stories
- As a [buyer/seller/transporter], I want to [action] so that [benefit]
- As a [role], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] The system shall [requirement]
- [ ] Users can [capability]
- [ ] The feature must [constraint]

## Business Rules
1. [Rule 1]
2. [Rule 2]

## Technical Requirements
### Frontend
- Component: [Component name]
- State management: [Zustand store/React Query]
- Navigation: [Screen/Stack]

### Backend
- Endpoint: [HTTP method] /api/[path]
- Service: [Service name]
- Database: [Tables/Models affected]

## UI/UX Specifications
- Screen/Component mockup reference
- User flow diagram
- Interaction patterns

## Data Model
```typescript
interface [ModelName] {
  id: string;
  // Additional fields
}
```

## API Contract
```typescript
// Request
POST /api/[endpoint]
{
  "field": "value"
}

// Response
{
  "success": true,
  "data": {}
}
```

## Edge Cases
- [Edge case 1]
- [Edge case 2]

## Testing Requirements
- Unit tests for [components/services]
- Integration tests for [workflows]
- E2E tests for [user journeys]

## Dependencies
- Depends on: [Other features/systems]
- Required by: [Dependent features]

## Performance Requirements
- Response time: < [X]ms
- Throughput: [X] requests/second
- Data volume: [X] records

## Security Considerations
- Authentication: [Method]
- Authorization: [Roles/Permissions]
- Data protection: [Encryption/Masking]
EOF

    # API specification template
    cat > specs/API_TEMPLATE.md << 'EOF'
# API: [Endpoint Name]

## Endpoint Details
- **Path**: `/api/[resource]/[action]`
- **Method**: GET | POST | PUT | DELETE | PATCH
- **Authentication**: Required | Optional | Public
- **Rate Limit**: [X] requests per [time period]

## Request
### Headers
```
Authorization: Bearer [token]
Content-Type: application/json
```

### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | string | Yes | Description |

### Body
```json
{
  "field1": "value",
  "field2": 123
}
```

## Response
### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field": "value"
  }
}
```

### Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Business Logic
1. Validate input parameters
2. Check user permissions
3. Process business rules
4. Return formatted response

## Database Operations
- Tables affected: [Table names]
- Operations: SELECT | INSERT | UPDATE | DELETE
- Transactions: Required | Optional

## Performance Considerations
- Caching strategy
- Query optimization
- Pagination approach
EOF

    # UI Component specification template
    cat > specs/UI_COMPONENT_TEMPLATE.md << 'EOF'
# Component: [Component Name]

## Purpose
[Brief description of the component's purpose]

## Props Interface
```typescript
interface [ComponentName]Props {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}
```

## State Management
- Local state: [useState hooks]
- Global state: [Zustand store]
- Server state: [React Query hooks]

## Styling
- Design system: NativeWind/Tailwind classes
- Responsive breakpoints
- Animation requirements

## Behavior
1. Initial render
2. User interactions
3. State updates
4. Side effects

## Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support

## Testing
- Unit tests
- Integration tests
- Visual regression tests

## Usage Example
```tsx
<ComponentName
  prop1="value"
  onAction={() => handleAction()}
/>
```
EOF

    echo "✅ Templates created"
}

# Create initial specifications for core features
create_initial_specs() {
    echo "📋 Creating initial specifications..."
    
    # Buyer Request Flow Specification
    cat > specs/features/buyer/buyer-request-flow.md << 'EOF'
# Feature: Buyer Request Creation Flow

## Overview
Enable agricultural buyers to create purchase requests with specific product requirements, quality specifications, and delivery preferences.

## User Stories
- As a buyer, I want to create a purchase request so that sellers can send me offers
- As a buyer, I want to specify quality parameters so that I receive relevant offers
- As a buyer, I want to set delivery locations so that transport costs are calculated

## Technical Requirements
### Frontend
- Component: BuyerRequestCreationFlow
- State: useBuyerRequestCreation hook
- Navigation: Dashboard > Create Request

### Backend
- Endpoint: POST /api/buyer/requests
- Service: BuyerService
- Models: BuyerRequest, RequestSpecification

## Implementation Status
- [x] Basic UI structure
- [ ] Specification integration
- [ ] API connection
- [ ] Real-time updates
EOF

    # Seller Product Management Specification
    cat > specs/features/seller/product-management.md << 'EOF'
# Feature: Seller Product Management

## Overview
Allow sellers to manage their agricultural product inventory across multiple locations with dynamic pricing.

## User Stories
- As a seller, I want to list my products so that buyers can find them
- As a seller, I want to set regional prices so that I can optimize revenue
- As a seller, I want to track inventory so that I don't oversell

## Technical Requirements
### Frontend
- Component: ProductCreationFlow
- State: useProductCreation hook
- Navigation: Dashboard > Products

### Backend
- Endpoint: POST /api/seller/products
- Service: SellerService
- Models: Product, ProductListing, RegionalPricing

## Implementation Status
- [x] Product creation UI
- [x] Location selection
- [ ] Pricing engine integration
- [ ] Inventory tracking
EOF

    echo "✅ Initial specifications created"
}

# Create a starter script for common SDD commands
create_sdd_commands() {
    echo "🛠️  Creating SDD command helper..."
    
    cat > specs/sdd-commands.sh << 'EOF'
#!/bin/bash

# Spec-Driven Development Commands for Agro-Trade

case "$1" in
    "buyer-request")
        echo "Creating buyer request specification..."
        echo '/specify Create a buyer request system where agricultural buyers can browse products, specify quality requirements (moisture, protein, grade), set quantity and delivery preferences, receive competitive offers from multiple sellers, and track order fulfillment through the platform.'
        ;;
    
    "seller-dashboard")
        echo "Creating seller dashboard specification..."
        echo '/specify Build a comprehensive seller dashboard that displays active listings, incoming buyer requests, offer management tools, inventory tracking across locations, pricing analytics, and performance metrics with real-time updates.'
        ;;
    
    "transport-bidding")
        echo "Creating transport bidding specification..."
        echo '/specify Implement a transport bidding system where logistics providers can view available shipments, submit competitive bids, manage fleet capacity, track active transfers, and receive automated route optimization suggestions.'
        ;;
    
    "pricing-engine")
        echo "Creating dynamic pricing engine specification..."
        echo '/specify Design a dynamic pricing engine that factors in regional market rates, transport costs, seasonal variations, bulk discounts, quality premiums, and competitor pricing to suggest optimal prices for sellers.'
        ;;
    
    "quality-matching")
        echo "Creating quality matching specification..."
        echo '/specify Create a quality specification matching system that compares buyer requirements with seller offerings, calculates match scores, suggests alternatives, and facilitates quality-based negotiations.'
        ;;
    
    *)
        echo "Available specifications:"
        echo "  ./sdd-commands.sh buyer-request    - Buyer request system"
        echo "  ./sdd-commands.sh seller-dashboard - Seller dashboard"
        echo "  ./sdd-commands.sh transport-bidding - Transport bidding"
        echo "  ./sdd-commands.sh pricing-engine   - Dynamic pricing"
        echo "  ./sdd-commands.sh quality-matching - Quality matching"
        ;;
esac
EOF

    chmod +x specs/sdd-commands.sh
    echo "✅ SDD command helper created"
}

# Main execution
main() {
    echo ""
    check_requirements
    echo ""
    install_uv
    echo ""
    init_specify
    echo ""
    create_spec_structure
    echo ""
    create_templates
    echo ""
    create_initial_specs
    echo ""
    create_sdd_commands
    echo ""
    
    echo "🎉 Spec-Driven Development setup complete!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Review the integration plan: SPEC_DRIVEN_INTEGRATION_PLAN.md"
    echo "2. Explore specifications in: specs/"
    echo "3. Use helper commands: ./specs/sdd-commands.sh"
    echo "4. Start creating specs with: /specify [your feature description]"
    echo ""
    echo "🔧 Quick start examples:"
    echo "  - Create a buyer request: ./specs/sdd-commands.sh buyer-request"
    echo "  - Build seller dashboard: ./specs/sdd-commands.sh seller-dashboard"
    echo ""
    echo "📖 Documentation:"
    echo "  - Templates: specs/*_TEMPLATE.md"
    echo "  - Features: specs/features/"
    echo "  - API specs: specs/api/"
    echo ""
}

# Run the setup
main