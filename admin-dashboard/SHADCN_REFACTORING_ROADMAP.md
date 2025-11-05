# shadcn/ui Refactoring Roadmap - Week Sprint

## 🎯 Objective
Transform the admin dashboard from custom components to a **consistent, maintainable shadcn/ui-based system** over one focused week.

## 📦 Component Inventory (38 Components Installed)

### ✅ Installed Components

#### **Layout & Navigation** (7)
- `accordion` - Expandable sections
- `breadcrumb` - Navigation breadcrumbs
- `menubar` - Application menu
- `navigation-menu` - Main navigation
- `separator` - Visual dividers
- `sheet` - Slide-out panels
- `tabs` - Tab navigation ✓ (already installed)

#### **Forms & Inputs** (11)
- `button` - Buttons ✓ (already installed)
- `calendar` - Date selection
- `checkbox` - Checkboxes
- `form` - Form management (react-hook-form + zod)
- `input` - Text inputs ✓ (already installed)
- `label` - Form labels ✓ (already installed)
- `radio-group` - Radio buttons
- `select` - Dropdowns ✓ (already installed)
- `slider` - Range sliders
- `switch` - Toggle switches
- `textarea` - Multi-line text

#### **Data Display** (6)
- `avatar` - User avatars
- `badge` - Status badges ✓ (already installed)
- `card` - Content cards ✓ (already installed)
- `progress` - Progress bars
- `table` - Data tables ✓ (already installed)
- `aspect-ratio` - Fixed aspect ratios

#### **Feedback & Overlays** (7)
- `alert` - Alert messages
- `alert-dialog` - Confirmation dialogs
- `dialog` - Modals ✓ (already installed)
- `popover` - Floating content
- `skeleton` - Loading placeholders
- `toast` / `toaster` - Notifications
- `tooltip` - Hover tooltips

#### **Interactive** (7)
- `collapsible` - Collapsible content
- `command` - Command palette (⌘K)
- `context-menu` - Right-click menus
- `dropdown-menu` - Action menus ✓ (already installed)
- `pagination` - Page navigation
- `scroll-area` - Custom scrollbars
- `tooltip` - Tooltips

---

## 📅 Week-by-Week Refactoring Plan

### **Day 1 (Monday): Foundation & Low-Hanging Fruit**

#### Morning: Audit & Planning
- [ ] Audit all existing components that can be replaced
- [ ] Create migration checklist
- [ ] Set up component extension patterns
- [ ] Document any custom logic that needs preservation

#### Afternoon: Buttons & Badges
**Target Files:**
- All custom `<button>` elements → `<Button>`
- Status indicators → `<Badge>`
- Loading states → `<Skeleton>`

**Expected Changes:**
- `~50-100 button replacements`
- `~20-30 badge replacements`

**Files to Update:**
1. `MatchingDashboard/*.tsx` - Replace all buttons
2. `TradeOperationsTable.tsx` - Buttons + status badges
3. `TransportManagement.tsx` - Buttons
4. `InspectorPortal.tsx` - Buttons + badges
5. `DatabaseStatePanel.tsx` - Buttons

---

### **Day 2 (Tuesday): Cards & Layout Components**

#### Morning: Card Refactoring
**Target:** Replace custom card divs with `<Card>` component

**Files to Refactor:**
1. `SellerCardsPanel.tsx` - Seller cards
2. `BuyerOrdersPanel.tsx` - Order cards
3. `TradeDetails.tsx` - Info cards
4. `MatchingDashboard.tsx` - Map cards
5. All scenario components using card-like structures

**Pattern:**
```tsx
// BEFORE
<div className="bg-white rounded-lg shadow-md p-6">
  <h3>Title</h3>
  <p>Content</p>
</div>

// AFTER
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

#### Afternoon: Separators & Layout
- Replace all custom dividers with `<Separator>`
- Add `<ScrollArea>` to panels with overflow
- Replace custom grid layouts with consistent spacing

---

### **Day 3 (Wednesday): Forms & Inputs**

#### All Day: Form Component Migration
**This is the BIG ONE** - Forms are everywhere!

**Target Files:**
1. `PricingModal.tsx` - Offer pricing form
2. `TradeCreationWizard.tsx` - Multi-step form
3. `InspectionForm.tsx` - Inspection submission
4. `BulkOfferModal.tsx` - Bulk offer creation
5. `CounterOfferModal.tsx` - Counter offer form
6. `ScenarioBuilder.tsx` - Scenario creation form

**Migration Pattern:**
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  quantity: z.number().min(1),
  pricePerUnit: z.number().min(0),
})

// In component:
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    quantity: 0,
    pricePerUnit: 0,
  },
})

// In JSX:
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="quantity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Quantity</FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

**Benefits:**
- Type-safe forms with Zod
- Built-in validation
- Error handling
- Form state management

---

### **Day 4 (Thursday): Modals & Dialogs**

#### Morning: Replace Custom Modals
**Target:** All components using fixed positioning for modals

**Files:**
1. `PricingModal.tsx` → Use `<Dialog>`
2. `BulkOfferModal.tsx` → Use `<Dialog>`
3. `CounterOfferModal.tsx` → Use `<Dialog>`
4. `BidReviewModal.tsx` → Use `<Dialog>`
5. `RouteMapModal.tsx` → Use `<Dialog>`
6. `OfferDetailsModal.tsx` → Use `<Dialog>`
7. `ScenarioSelectorModal.tsx` → Use `<Dialog>`

**Pattern:**
```tsx
// BEFORE
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6">
      <h2>Title</h2>
      <button onClick={() => setShowModal(false)}>Close</button>
    </div>
  </div>
)}

// AFTER
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={() => setShowModal(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Afternoon: Confirmation Dialogs
- Replace `window.confirm()` with `<AlertDialog>`
- Add proper confirmation for destructive actions
- Better UX with cancel/confirm buttons

---

### **Day 5 (Friday): Tables & Data Display**

#### Morning: Table Component Refactoring
**Target:** All custom table implementations

**Files:**
1. `TradeOperationsTable.tsx` - Main trade table
2. `PricingModal.tsx` - Seller pricing table
3. Any scenario components with tabular data

**Pattern:**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Seller</TableHead>
      <TableHead>Quantity</TableHead>
      <TableHead className="text-right">Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {sellers.map((seller) => (
      <TableRow key={seller.id}>
        <TableCell className="font-medium">{seller.name}</TableCell>
        <TableCell>{seller.quantity}t</TableCell>
        <TableCell className="text-right">€{seller.price}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Afternoon: Toasts & Notifications
- Replace all `alert()` calls with `toast()`
- Replace all `console.log` success messages with `toast.success()`
- Add error toasts with proper error handling

**Pattern:**
```tsx
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

// Success
toast({
  title: "Success!",
  description: "Trade operation created successfully",
})

// Error
toast({
  title: "Error",
  description: "Failed to create trade operation",
  variant: "destructive",
})

// With action
toast({
  title: "Offer sent",
  description: "Seller will be notified",
  action: <Button size="sm" onClick={viewOffer}>View</Button>,
})
```

---

### **Day 6-7 (Weekend): Polish & Advanced Features**

#### Saturday: Navigation & Command Palette
- [ ] Add `<Command>` palette for quick actions (⌘K)
- [ ] Implement `<Breadcrumb>` for navigation
- [ ] Add `<Pagination>` to all tables
- [ ] Implement `<Tabs>` for multi-view components

#### Sunday: Final Polish
- [ ] Add `<Tooltip>` to all icon buttons
- [ ] Implement `<Avatar>` for user displays
- [ ] Add `<Progress>` bars for loading states
- [ ] Replace all checkboxes with `<Checkbox>`
- [ ] Add `<Switch>` for toggle settings
- [ ] Final testing and bug fixes

---

## 🎨 Component Extension Patterns

### Custom Variant Extensions

```tsx
// src/components/extended/agro-button.tsx
import { Button } from "@/components/ui/button"
import { cva, type VariantProps } from "class-variance-authority"

const agroButtonVariants = cva("", {
  variants: {
    variant: {
      trade: "bg-blue-600 hover:bg-blue-700 text-white",
      seller: "bg-green-600 hover:bg-green-700 text-white",
      buyer: "bg-purple-600 hover:bg-purple-700 text-white",
      inspector: "bg-orange-600 hover:bg-orange-700 text-white",
    },
  },
})

interface AgroButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof agroButtonVariants> {
  children: React.ReactNode
}

export function AgroButton({ variant, className, ...props }: AgroButtonProps) {
  return (
    <Button
      className={cn(agroButtonVariants({ variant }), className)}
      {...props}
    />
  )
}

// Usage:
<AgroButton variant="trade">Create Trade</AgroButton>
<AgroButton variant="seller">Add Seller</AgroButton>
```

### Composed Components

```tsx
// src/components/composed/trade-card.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function TradeCard({ trade, onViewDetails }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{trade.operationNumber}</CardTitle>
          <Badge variant={trade.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {trade.status}
          </Badge>
        </div>
        <CardDescription>
          Created {format(new Date(trade.createdAt), 'MMM dd, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buyer:</span>
            <span className="font-medium">{trade.buyer?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{trade.quantity}t</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phase:</span>
            <Badge variant="outline">{trade.phase}</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => onViewDetails(trade)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## 📊 Migration Tracking

### Metrics to Track

```markdown
## Day 1 Progress
- [ ] Buttons migrated: 0/100
- [ ] Badges migrated: 0/30
- [ ] Skeletons added: 0/15

## Day 2 Progress
- [ ] Cards migrated: 0/25
- [ ] Separators added: 0/20
- [ ] ScrollAreas added: 0/10

## Day 3 Progress
- [ ] Forms migrated: 0/6
- [ ] Inputs standardized: 0/40
- [ ] Validation added: 0/6

## Day 4 Progress
- [ ] Modals migrated: 0/7
- [ ] AlertDialogs added: 0/10
- [ ] window.confirm removed: 0/15

## Day 5 Progress
- [ ] Tables migrated: 0/3
- [ ] Toasts added: 0/50
- [ ] alert() removed: 0/20

## Weekend Progress
- [ ] Command palette: Not started
- [ ] Breadcrumbs: Not started
- [ ] Pagination: Not started
- [ ] Final polish: Not started
```

---

## 🚨 Important Decisions to Make

### 1. Component Extension Strategy
**Decision needed:** Do we extend shadcn components or use them as-is?

**Option A: Use as-is** (Faster)
```tsx
import { Button } from "@/components/ui/button"
<Button variant="destructive">Delete</Button>
```

**Option B: Extend with custom variants** (More flexible)
```tsx
import { AgroButton } from "@/components/extended/button"
<AgroButton variant="trade">Create Trade</AgroButton>
```

**Recommendation:** Start with Option A, add extensions only when needed.

---

### 2. Form Validation Strategy
**Decision needed:** Which validation library?

**Option A: Zod** (Type-safe, installed with shadcn)
```tsx
const schema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().positive(),
})
```

**Option B: Custom validation**
```tsx
const validate = (values) => {
  const errors = {}
  if (values.quantity < 1) errors.quantity = "Required"
  return errors
}
```

**Recommendation:** Use Zod - it's already installed and type-safe.

---

### 3. Toast vs Sonner
**Current:** Using `sonner` library
**shadcn:** Provides `toast` component

**Decision needed:** Keep sonner or migrate to shadcn toast?

**Recommendation:** Keep sonner (it's already working well), but standardize usage patterns.

---

## 🔧 Development Guidelines

### During Refactoring

1. **Never refactor and add features simultaneously**
   - One PR = One type of change
   - Either refactor OR add features, not both

2. **Test after each component migration**
   - Verify UI looks correct
   - Verify functionality works
   - Check accessibility

3. **Keep old code until new code is verified**
   - Comment out old code
   - Remove only after testing

4. **Document breaking changes**
   - If API changes, document it
   - Update usage examples

### Code Review Checklist

- [ ] Component uses shadcn imports
- [ ] Variants used correctly
- [ ] Accessibility preserved
- [ ] TypeScript types correct
- [ ] Build succeeds
- [ ] Visual testing passed

---

## 📝 Quick Reference

### Most Common Replacements

```tsx
// Buttons
<button className="..."> → <Button>

// Cards
<div className="bg-white rounded-lg shadow..."> → <Card>

// Modals
<div className="fixed inset-0..."> → <Dialog>

// Inputs
<input className="..."> → <Input>

// Dropdowns
<select> → <Select>

// Alerts
alert("Success") → toast({ title: "Success" })

// Confirmations
window.confirm("Sure?") → <AlertDialog>

// Status badges
<span className="px-2 py-1 bg-green-100..."> → <Badge>

// Tables
<table> → <Table>

// Tabs
Custom tab logic → <Tabs>
```

---

## 🎯 Success Criteria

By end of week:
- ✅ **90%+ of UI uses shadcn components**
- ✅ **Zero custom button implementations**
- ✅ **All forms use react-hook-form + zod**
- ✅ **All modals use Dialog component**
- ✅ **All tables standardized**
- ✅ **All alerts/confirms replaced with proper UI**
- ✅ **Build succeeds with zero errors**
- ✅ **Visual consistency achieved**
- ✅ **Documentation updated**

---

## 🚀 Let's Begin!

**Next steps:**
1. Review this roadmap
2. Decide on extension strategy
3. Start Day 1 tasks
4. Track progress daily
5. Adjust plan as needed

**Remember:** This is a marathon, not a sprint. Quality over speed!
