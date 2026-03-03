# AgroTrade API Reference

## Standard Response Format

**FIXED:** All API endpoints now follow a standardized response format for consistency.

### Success Response

```typescript
{
  "success": true,
  "data": <any>,           // The actual response data
  "message"?: string,      // Optional success message
  "meta"?: {               // Optional metadata
    "pagination"?: {
      "total": number,
      "page": number,
      "limit": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrev": boolean
    },
    // ... other metadata
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "error": string,        // Error message
  "data"?: any            // Optional error details
}
```

### Examples

#### Simple Success Response
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Farmer"
  },
  "message": "User created successfully"
}
```

#### List Response
```json
{
  "success": true,
  "data": [
    {"id": "1", "name": "Farmer 1"},
    {"id": "2", "name": "Farmer 2"}
  ],
  "message": "Found 2 FARMER users"
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "User not found",
  "data": {
    "userId": "invalid-id"
  }
}
```

## Using the Response Utility

Controllers should use the `successResponse`, `errorResponse`, and `paginatedResponse` helper functions from `src/common/utils/response.util.ts`:

```typescript
import { successResponse, errorResponse, paginatedResponse } from '../common/utils/response.util';

// Simple success
return successResponse(data, 'Operation successful');

// With metadata
return successResponse(data, 'Users retrieved', { count: data.length });

// Paginated
return paginatedResponse(items, total, page, limit);

// Error (in catch block)
return errorResponse('Something went wrong', { details: error.message });
```

## Migration Status

### ✅ Migrated Endpoints

- `POST /simulation/admin/send-offers` - Now returns `{success, negotiations}` format
- `GET /simulation/users/:role` - Now returns `{success, data, message}` format

### 🔄 Pending Migration

The following controllers should be gradually migrated to use the standard format:

- auth.controller.ts
- buyer.controller.ts
- inspection.controller.ts
- inspector.controller.ts
- negotiation.controller.ts
- notification.controller.ts
- onboarding.controller.ts
- pricing.controller.ts
- products.controller.ts (already uses `{success, data}` format - verify consistency)
- profit.controller.ts
- regions.controller.ts
- scenario.controller.ts
- seller.controller.ts
- test.controller.ts

## Best Practices

1. **Always use the helper functions** - Don't manually construct response objects
2. **Include meaningful messages** - Help frontend developers understand what happened
3. **Use metadata for supplementary info** - Pagination, counts, timestamps, etc.
4. **Consistent error handling** - Always return `{success: false, error: "message"}`
5. **HTTP status codes** - Still use appropriate status codes (200, 201, 400, 404, 500, etc.)

## Backward Compatibility

During migration:
- Test thoroughly after each controller update
- Update frontend code to handle both old and new formats temporarily
- Document breaking changes in release notes
- Consider a transitional period where both formats are supported (not recommended for new code)

## Testing

Test each endpoint returns the expected format:

```bash
curl -X GET http://localhost:4000/api/simulation/users/FARMER \
  -H "Authorization: Bearer <token>" | jq

# Should return:
# {
#   "success": true,
#   "data": [...],
#   "message": "Found X FARMER users"
# }
```
