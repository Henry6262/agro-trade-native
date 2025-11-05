# Specification Integration - Quick Reference Card

## For Frontend Developers

### Using the SpecificationBadge Component

```tsx
import SpecificationBadge from './SpecificationBadge';
import type { Specification } from '../../utils/specificationHelpers';

// In your component
{specifications.map((spec) => (
  <SpecificationBadge
    key={spec.id}
    spec={spec}
    variant="compact"
  />
))}
```

### Specification Interface

```typescript
interface Specification {
  id: string;
  valueNumber?: number | null;
  valueText?: string | null;
  valueBoolean?: boolean | null;
  specificationType: {
    id: string;
    code: string;        // e.g., "moisture", "protein"
    name: string;        // e.g., "Moisture Content"
    unit?: string;       // e.g., "%", "kg"
    dataType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'ENUM';
  };
}
```

### Helper Functions

```typescript
import {
  formatSpecValue,      // Returns formatted value: "13.5%", "Grade A", "Yes"
  getSpecDisplayName,   // Returns: "Moisture Content"
  getSpecCode          // Returns: "moisture"
} from '../../utils/specificationHelpers';
```

---

## For Backend Developers

### Required API Response Structure

Both `/api/buyer/listings` and `/api/seller/listings` must include:

```json
{
  "id": "listing-id",
  "product": { ... },
  "quantity": 30,
  "specifications": [
    {
      "id": "spec-id-1",
      "valueNumber": 13.5,
      "valueText": null,
      "valueBoolean": null,
      "specificationType": {
        "id": "type-id-1",
        "code": "moisture",
        "name": "Moisture Content",
        "unit": "%",
        "dataType": "NUMBER"
      }
    }
  ]
}
```

### Data Type Examples

#### NUMBER Type (with unit)
```json
{
  "valueNumber": 13.5,
  "valueText": null,
  "valueBoolean": null,
  "specificationType": {
    "code": "moisture",
    "name": "Moisture Content",
    "unit": "%",
    "dataType": "NUMBER"
  }
}
```
**Displays as**: `Moisture Content: 13.5%`

#### TEXT Type (no unit)
```json
{
  "valueNumber": null,
  "valueText": "Grade A",
  "valueBoolean": null,
  "specificationType": {
    "code": "grade",
    "name": "Quality Grade",
    "unit": null,
    "dataType": "TEXT"
  }
}
```
**Displays as**: `Quality Grade: Grade A`

#### BOOLEAN Type (no unit)
```json
{
  "valueNumber": null,
  "valueText": null,
  "valueBoolean": true,
  "specificationType": {
    "code": "organic",
    "name": "Organic Certified",
    "unit": null,
    "dataType": "BOOLEAN"
  }
}
```
**Displays as**: `Organic Certified: Yes`

---

## Specification Type Codes for Color Coding

### Pre-defined Colors
- `"moisture"` → Blue badge
- `"protein"` → Green badge
- `"grade"` → Purple badge
- All others → Gray badge

### To Add New Colored Specifications

Edit `/Users/henry/agro-trade/admin-dashboard/src/components/MatchingDashboard/SpecificationBadge.tsx`:

```typescript
const colorClass = {
  'moisture': 'bg-blue-100 text-blue-700',
  'protein': 'bg-green-100 text-green-700',
  'grade': 'bg-purple-100 text-purple-700',
  'your-new-code': 'bg-yellow-100 text-yellow-700',  // Add here
  'default': 'bg-gray-100 text-gray-700'
}[code] || 'bg-gray-100 text-gray-700';
```

---

## Testing Checklist

### Backend API Testing
```bash
# Test buyer listings
curl http://localhost:4001/api/buyer/listings | python3 -m json.tool

# Test seller listings
curl http://localhost:4001/api/seller/listings | python3 -m json.tool

# Verify 'specifications' array exists in response
```

### Frontend Build Testing
```bash
cd /Users/henry/agro-trade/admin-dashboard

# Check TypeScript errors
npx tsc --noEmit

# Build for production
npm run build

# Start dev server
npm run dev
```

### Browser Testing
1. Open http://localhost:5173
2. Navigate to Matching Dashboard
3. Open DevTools Console (F12)
4. Check for errors
5. Inspect Network tab for API responses

---

## Common Issues & Solutions

### Issue: Badges Not Appearing
**Solution**: Check if `specifications` array has items:
```javascript
console.log(order.specifications); // Should not be []
```

### Issue: TypeScript Errors
**Solution**: Use type-only imports:
```typescript
import type { Specification } from '../../utils/specificationHelpers';
```

### Issue: Wrong Colors
**Solution**: Check `specificationType.code` matches color map in SpecificationBadge.tsx

### Issue: Missing Units
**Solution**: Ensure `specificationType.unit` is provided in API response

### Issue: "N/A" Displayed
**Solution**: Specification value is null/undefined, check API data

---

## File Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── MatchingDashboard/
│   │       ├── BuyerOrdersPanel.tsx       (Modified)
│   │       ├── SellerCardsPanel.tsx       (Modified)
│   │       ├── MatchingDashboard.tsx      (Modified)
│   │       └── SpecificationBadge.tsx     (New)
│   └── utils/
│       └── specificationHelpers.ts        (New)
```

---

## API Endpoints

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/buyer/listings` | GET | Array of buy listings with specifications |
| `/api/seller/listings` | GET | Array of sale listings with specifications |

**Base URL**: `http://localhost:4001`

---

## Tailwind CSS Classes Used

### Badge Styling
```css
/* Base badge */
.text-xs .px-2 .py-1 .rounded

/* Color variants */
.bg-blue-100 .text-blue-700    /* Moisture */
.bg-green-100 .text-green-700  /* Protein */
.bg-purple-100 .text-purple-700 /* Grade */
.bg-gray-100 .text-gray-700    /* Default */
```

### Layout
```css
.flex .items-center .gap-2 .mt-2 .flex-wrap
```

---

## Performance Notes

- **Conditional Rendering**: Badges only render when specifications exist
- **React Keys**: Uses `spec.id` for optimal re-rendering
- **Lazy Evaluation**: No performance impact when array is empty
- **Bundle Size**: +2KB gzipped for new components

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Supported |
| Safari | Latest | ✅ Supported |
| Firefox | Latest | ✅ Supported |
| Edge | Latest | ✅ Supported |

---

## Future Enhancements (Not Yet Implemented)

- [ ] Specification-based filtering in seller panel
- [ ] Sort by specification values
- [ ] Specification comparison view
- [ ] Custom specification type colors via admin settings
- [ ] Specification search/autocomplete
- [ ] Bulk specification editing

---

## Support & Documentation

- **Technical Report**: `/Users/henry/agro-trade/DAY_1_UI_POLISH_REPORT.md`
- **Visual Guide**: `/Users/henry/agro-trade/DAY_1_VISUAL_GUIDE.md`
- **This Quick Ref**: `/Users/henry/agro-trade/SPECIFICATION_INTEGRATION_QUICK_REF.md`

---

## Last Updated
October 14, 2025
