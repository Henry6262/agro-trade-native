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
