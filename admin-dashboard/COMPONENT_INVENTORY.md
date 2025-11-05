# shadcn/ui Component Inventory & Usage Guide

## 📦 Complete Component List (38 Components)

### Category: Buttons & Actions

#### 1. Button
**Import:** `import { Button } from "@/components/ui/button"`

**Variants:**
- `default` - Primary action (blue)
- `destructive` - Dangerous actions (red)
- `outline` - Secondary actions
- `secondary` - Tertiary actions
- `ghost` - Minimal style
- `link` - Link style

**Sizes:** `default`, `sm`, `lg`, `icon`

**Usage Examples:**
```tsx
<Button>Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

**Current Uses in Codebase:**
- Replace ALL `<button>` elements
- ~100+ instances across all features

---

### Category: Data Display

#### 2. Badge
**Import:** `import { Badge } from "@/components/ui/badge"`

**Variants:**
- `default` - Primary badge
- `secondary` - Secondary info
- `destructive` - Error/warning states
- `outline` - Bordered style

**Usage:**
```tsx
<Badge>Active</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="outline">Pending</Badge>
```

**Current Uses:**
- Trade operation status
- Negotiation status
- Inspection priority
- Transport status

---

#### 3. Card
**Import:**
```tsx
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

**Current Uses:**
- SellerCardsPanel - Seller cards
- BuyerOrdersPanel - Order cards
- All dashboard widgets
- Information panels

---

#### 4. Table
**Import:**
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
```

**Usage:**
```tsx
<Table>
  <TableCaption>Trade Operations</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>Buyer</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {operations.map((op) => (
      <TableRow key={op.id}>
        <TableCell className="font-medium">{op.id}</TableCell>
        <TableCell>{op.buyer}</TableCell>
        <TableCell className="text-right">{op.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Current Uses:**
- TradeOperationsTable
- PricingModal seller table
- Any tabular data display

---

#### 5. Avatar
**Import:**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
```

**Usage:**
```tsx
<Avatar>
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>
```

**Future Uses:**
- User profiles
- Seller/Buyer displays
- Inspector assignments

---

#### 6. Progress
**Import:** `import { Progress } from "@/components/ui/progress"`

**Usage:**
```tsx
<Progress value={33} className="w-full" />
<Progress value={completedSteps / totalSteps * 100} />
```

**Current Uses:**
- Scenario execution progress
- Trade operation completion
- Transport truck allocation

---

#### 7. Skeleton
**Import:** `import { Skeleton } from "@/components/ui/skeleton"`

**Usage:**
```tsx
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-12 w-12 rounded-full" />

// While loading:
{loading ? (
  <Skeleton className="h-8 w-full" />
) : (
  <p>{data}</p>
)}
```

**Current Uses:**
- Loading states everywhere
- Replace "Loading..." text

---

### Category: Forms & Inputs

#### 8. Form
**Import:**
```tsx
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
```

**Usage with react-hook-form + zod:**
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  email: z.string().email(),
  quantity: z.number().min(1),
})

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", quantity: 0 },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Your email address</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

**Current Uses:**
- ALL forms should use this
- PricingModal
- TradeCreationWizard
- InspectionForm
- BulkOfferModal
- CounterOfferModal
- ScenarioBuilder

---

#### 9. Input
**Import:** `import { Input } from "@/components/ui/input"`

**Usage:**
```tsx
<Input type="text" placeholder="Enter name" />
<Input type="number" min={0} step={0.01} />
<Input type="email" />
<Input disabled />
```

**Current Uses:**
- Replace ALL `<input>` elements
- ~50+ instances

---

#### 10. Textarea
**Import:** `import { Textarea } from "@/components/ui/textarea"`

**Usage:**
```tsx
<Textarea placeholder="Type your message here" />
<Textarea rows={4} />
```

**Current Uses:**
- Notes fields
- Description inputs
- Comments

---

#### 11. Select
**Import:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

**Usage:**
```tsx
<Select onValueChange={setValue} defaultValue={value}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

**Current Uses:**
- Replace ALL `<select>` elements
- Actor selection in ScenarioBuilder
- Status filters
- Priority dropdowns

---

#### 12. Checkbox
**Import:** `import { Checkbox } from "@/components/ui/checkbox"`

**Usage:**
```tsx
<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  id="terms"
/>
<Label htmlFor="terms">Accept terms</Label>
```

**Current Uses:**
- Seller selection in matching
- Multi-select options
- Boolean settings

---

#### 13. Radio Group
**Import:**
```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
```

**Usage:**
```tsx
<RadioGroup defaultValue="option1" onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>
```

**Current Uses:**
- Quality preferences
- Shipping options
- Priority selection

---

#### 14. Switch
**Import:** `import { Switch } from "@/components/ui/switch"`

**Usage:**
```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>
<Label>Enable feature</Label>
```

**Current Uses:**
- Settings toggles
- Feature flags
- Notification preferences

---

#### 15. Slider
**Import:** `import { Slider } from "@/components/ui/slider"`

**Usage:**
```tsx
<Slider
  defaultValue={[50]}
  max={100}
  step={1}
  onValueChange={(value) => console.log(value[0])}
/>
```

**Current Uses:**
- Profit margin adjustment
- Price range filters
- Quality thresholds

---

#### 16. Calendar
**Import:** `import { Calendar } from "@/components/ui/calendar"`

**Usage:**
```tsx
import { useState } from "react"

const [date, setDate] = useState<Date | undefined>(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>
```

**Current Uses:**
- Date pickers for scheduling
- Delivery date selection
- Inspection date scheduling

---

#### 17. Label
**Import:** `import { Label } from "@/components/ui/label"`

**Usage:**
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

**Current Uses:**
- All form labels
- Replace plain `<label>` elements

---

### Category: Overlays & Modals

#### 18. Dialog
**Import:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
```

**Usage:**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Current Uses - CRITICAL REFACTOR:**
- PricingModal.tsx
- BulkOfferModal.tsx
- CounterOfferModal.tsx
- BidReviewModal.tsx
- RouteMapModal.tsx
- OfferDetailsModal.tsx
- ScenarioSelectorModal.tsx

---

#### 19. Alert Dialog
**Import:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
```

**Usage:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Current Uses:**
- Replace ALL `window.confirm()` calls
- Destructive action confirmations
- Data deletion confirmations

---

#### 20. Sheet
**Import:**
```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
```

**Usage:**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Settings</SheetTitle>
      <SheetDescription>
        Make changes to your settings here.
      </SheetDescription>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

**Sides:** `top`, `right`, `bottom`, `left`

**Future Uses:**
- Filter panels
- Settings drawers
- Details sidebars

---

#### 21. Popover
**Import:**
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
```

**Usage:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-2">
      <h4 className="font-medium">Dimensions</h4>
      <p className="text-sm text-muted-foreground">
        Set the dimensions for the layer.
      </p>
    </div>
  </PopoverContent>
</Popover>
```

**Future Uses:**
- Date pickers
- Color pickers
- Filter dropdowns

---

#### 22. Tooltip
**Import:**
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
```

**Usage:**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Add to library</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Current Uses:**
- Add to ALL icon buttons
- Explain truncated text
- Show additional info

---

### Category: Feedback

#### 23. Toast / Toaster
**Import:**
```tsx
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
```

**Setup (already done in App.tsx):**
```tsx
function App() {
  return (
    <>
      {/* Your app */}
      <Toaster />
    </>
  )
}
```

**Usage:**
```tsx
const { toast } = useToast()

// Success
toast({
  title: "Success!",
  description: "Operation completed successfully",
})

// Error
toast({
  title: "Uh oh! Something went wrong.",
  description: "There was a problem with your request.",
  variant: "destructive",
})

// With action
toast({
  title: "Scheduled: Catch up",
  description: "Friday, February 10, 2023 at 5:57 PM",
  action: (
    <Button size="sm" onClick={() => {}}>
      Undo
    </Button>
  ),
})
```

**Current Uses - CRITICAL:**
- Replace ALL `alert()` calls
- Replace ALL `console.log()` success messages
- Add proper error notifications
- ~50+ instances

---

#### 24. Alert
**Import:** `import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"`

**Usage:**
```tsx
<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>
```

**Variants:** `default`, `destructive`

**Current Uses:**
- Error messages
- Warning banners
- Info notices

---

#### 25. Skeleton
(See Data Display section above)

---

### Category: Navigation

#### 26. Tabs
**Import:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

**Usage:**
```tsx
<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Make changes to your account here.
  </TabsContent>
  <TabsContent value="password">
    Change your password here.
  </TabsContent>
</Tabs>
```

**Current Uses:**
- TradeDetails component tabs
- DatabaseStatePanel tabs
- Multi-view components

---

#### 27. Breadcrumb
**Import:**
```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
```

**Usage:**
```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/trades">Trades</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>TO-12345</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

**Future Uses:**
- Page navigation
- Detail view navigation

---

#### 28. Pagination
**Import:**
```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
```

**Usage:**
```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>
        2
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

**Current Uses:**
- Add to TradeOperationsTable
- Add to all large data lists

---

#### 29. Navigation Menu
**Import:**
```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
```

**Future Uses:**
- Main app navigation
- Mega menus

---

#### 30. Menubar
**Import:**
```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
```

**Future Uses:**
- Application menu bar
- Desktop-style menus

---

### Category: Command & Search

#### 31. Command
**Import:**
```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
```

**Usage (Command Palette):**
```tsx
const [open, setOpen] = useState(false)

useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((open) => !open)
    }
  }
  document.addEventListener("keydown", down)
  return () => document.removeEventListener("keydown", down)
}, [])

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Create Trade Operation</CommandItem>
      <CommandItem>View Active Trades</CommandItem>
      <CommandItem>Manage Sellers</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

**Future Uses:**
- ⌘K quick actions
- Search interface
- Navigation shortcuts

---

### Category: Layout & Utility

#### 32. Separator
**Import:** `import { Separator } from "@/components/ui/separator"`

**Usage:**
```tsx
<div>
  <div>Section 1</div>
  <Separator className="my-4" />
  <div>Section 2</div>
</div>

<Separator orientation="vertical" />
```

**Current Uses:**
- Replace all `<hr>` elements
- Replace custom divider divs
- Section separators

---

#### 33. Scroll Area
**Import:** `import { ScrollArea } from "@/components/ui/scroll-area"`

**Usage:**
```tsx
<ScrollArea className="h-[200px] w-[350px] rounded-md border">
  <div className="p-4">
    {/* Long content */}
  </div>
</ScrollArea>
```

**Current Uses:**
- DatabaseStatePanel content
- Modal content with overflow
- Sidebar content

---

#### 34. Aspect Ratio
**Import:** `import { AspectRatio } from "@/components/ui/aspect-ratio"`

**Usage:**
```tsx
<AspectRatio ratio={16 / 9}>
  <img src="..." alt="..." className="object-cover" />
</AspectRatio>
```

**Future Uses:**
- Image containers
- Video embeds
- Map containers

---

#### 35. Accordion
**Import:**
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
```

**Usage:**
```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Future Uses:**
- FAQ sections
- Collapsible details
- Help documentation

---

#### 36. Collapsible
**Import:**
```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
```

**Usage:**
```tsx
<Collapsible>
  <CollapsibleTrigger>Can I use this?</CollapsibleTrigger>
  <CollapsibleContent>
    Yes. Free to use for personal and commercial projects.
  </CollapsibleContent>
</Collapsible>
```

**Future Uses:**
- Expandable sections
- Show more/less content

---

### Category: Context Menus

#### 37. Dropdown Menu
(Already installed - see above)

#### 38. Context Menu
**Import:**
```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
```

**Usage:**
```tsx
<ContextMenu>
  <ContextMenuTrigger>Right click here</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Billing</ContextMenuItem>
    <ContextMenuItem>Settings</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**Future Uses:**
- Table row actions
- Card context actions

---

## 🎯 Priority Components for Immediate Use

### Week 1 (Critical)
1. **Button** - Replace all buttons
2. **Badge** - Status indicators
3. **Card** - Content containers
4. **Dialog** - Replace modals
5. **Form + Input** - All forms
6. **Table** - Data tables
7. **Toast** - Notifications
8. **Alert Dialog** - Confirmations

### Week 2 (Important)
9. **Tabs** - Multi-view components
10. **Select** - Dropdowns
11. **Checkbox** - Selections
12. **Skeleton** - Loading states
13. **Separator** - Dividers
14. **Tooltip** - Icon explanations

### Week 3 (Nice to have)
15. **Calendar** - Date pickers
16. **Command** - Quick actions
17. **Pagination** - Table navigation
18. **Progress** - Loading indicators
19. **Avatar** - User displays
20. **Breadcrumb** - Navigation

---

## 📚 Component Documentation Links

- **shadcn/ui Docs**: https://ui.shadcn.com/docs/components
- **Radix UI (primitives)**: https://www.radix-ui.com/primitives
- **react-hook-form**: https://react-hook-form.com
- **Zod validation**: https://zod.dev

---

## ✅ Component Installation Verified

```bash
✓ 38 components installed
✓ All dependencies resolved
✓ Build successful
✓ Toaster integrated in App.tsx
✓ Type imports fixed
```

**You're ready to start using these components!** 🎉
