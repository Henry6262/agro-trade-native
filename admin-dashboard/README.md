# Agro-Trade Admin Dashboard

A focused web-based admin dashboard for managing trade operations in the Agro-Trade platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:5176/
```

## ✨ Features

### Trade Operations Management
- View all operations in a sortable, filterable table
- Real-time status updates and phase tracking
- Quick actions for viewing and deleting operations
- Profit margin visualization

### Trade Creation (4-Step Wizard)
1. **Select Buy Listing** - Choose from active buyer requests
2. **Find Sellers** - Search and select multiple sellers
3. **Set Quantities** - Allocate quantities to each seller
4. **Review & Create** - Confirm profit estimates and create

### Negotiation Management
- Send bulk offers to multiple sellers
- Respond to counter-offers quickly
- Track negotiation status and expiry
- See profit impact of each negotiation

### Quality Inspections
- Request inspections for unverified sellers
- Track inspection status and results
- View quality scores and verification badges

## 🛠 Tech Stack

- **React 18** + **TypeScript** - Type-safe components
- **Vite** - Lightning fast HMR
- **Tailwind CSS** - Rapid UI development
- **Axios** - API communication
- **Lucide React** - Modern icons

## 📁 Project Structure

```
src/
├── components/
│   ├── TradeOperationsTable.tsx   # Main operations list
│   ├── TradeCreationWizard.tsx    # 4-step creation flow
│   └── TradeDetails.tsx           # Operation management
├── services/
│   └── api.ts                     # Backend API client
├── types/
│   └── index.ts                   # TypeScript definitions
└── App.tsx                        # Main application
```

## 🔄 Key Workflows

### Creating a Trade Operation
- Click "New Operation"
- Select buy listing
- Add sellers and quantities
- Review and create

### Managing Negotiations
- Open operation details
- Go to Negotiations tab
- Send/respond to offers
- Monitor progress

### Quality Control
- Open operation details
- Go to Inspections tab
- Request inspections
- Track verification

## 💡 Benefits vs Mobile Admin

| Feature | Web Admin | Mobile Admin |
|---------|-----------|--------------|
| Screen Space | Full desktop view | Limited mobile screen |
| Data Entry | Keyboard input | Touch typing |
| Multi-tasking | Multiple browser tabs | Single app view |
| Development | Instant hot reload | App rebuild needed |
| Debugging | Browser DevTools | Limited debugging |
| Tables | Full sorting/filtering | Simplified lists |

## 🔗 Backend Connection

Connects to: `http://localhost:4000/api`

Ensure your NestJS backend is running on port 4000.

## 🧪 Testing Checklist

- [ ] Create new trade operation
- [ ] Send bulk offers to sellers
- [ ] Respond to counter-offers
- [ ] Update operation phases
- [ ] Request quality inspections
- [ ] View profit calculations
- [ ] Filter and search operations

## 📝 Notes

This is a **focused tool** for trade operations only. It excludes:
- User management
- Analytics dashboards
- Transport management
- Other complex features

Built for **rapid testing** and **efficient management** of the trade operation lifecycle.