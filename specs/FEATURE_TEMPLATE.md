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
