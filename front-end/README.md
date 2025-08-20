# AgroTrade Mobile App

A React Native application for the AgroTrade marketplace, connecting farmers with buyers for fresh agricultural products.

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **NativeWind** for styling (Tailwind CSS for React Native)
- **GlueStack UI** for component library
- **React Navigation** for navigation
- **Zustand** for state management
- **React Query** for data fetching and caching
- **React Hook Form** with **Zod** for form validation
- **Axios** for API requests

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── common/        # Generic components (Button, Input, etc.)
│   └── features/      # Feature-specific components
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   ├── marketplace/  # Marketplace screens
│   ├── orders/       # Order management screens
│   └── profile/      # Profile screens
├── navigation/        # Navigation configuration
├── services/          # API and external services
├── store/            # Zustand stores
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
├── constants/        # App-wide constants
├── types/            # TypeScript type definitions
├── assets/           # Images, fonts, and static resources
├── styles/           # NativeWind theme and global styles
└── providers/        # React providers (Query, Theme, etc.)
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd agro-trade/front-end
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on specific platforms**:
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clear Expo cache
- `npm run reset-cache` - Start with cleared cache

## Architecture Overview

### State Management

The app uses **Zustand** for state management with the following stores:

- **authStore**: User authentication and profile data
- **orderStore**: Order creation and management
- **marketplaceStore**: Products, categories, and search filters

### API Integration

- **React Query** for data fetching, caching, and synchronization
- **Axios** for HTTP requests with interceptors for authentication
- Modular service layer for different API endpoints

### Navigation

- **React Navigation v7** with TypeScript integration
- Stack navigation for main flow
- Tab navigation for main app sections
- Type-safe navigation with parameter definitions

### Styling

- **NativeWind** for utility-first styling
- Custom theme configuration with consistent colors and spacing
- Responsive design patterns
- Dark mode support (ready for implementation)

## Features

### Authentication
- User login and registration
- JWT token management
- Secure logout
- Password reset (ready for implementation)

### Marketplace
- Browse products by category
- Search and filter functionality
- Product details with images
- Add to cart functionality

### Order Management
- Create orders with multiple items
- Delivery address management
- Payment method selection
- Order tracking (ready for implementation)
- Order history

### User Profile
- View and edit profile information
- Account settings
- Logout functionality

## Code Quality

### ESLint Configuration
- React/React Native specific rules
- TypeScript integration
- Prettier integration for consistent formatting

### TypeScript
- Strict type checking
- Interface definitions for all data structures
- Type-safe navigation and API responses

### Testing (Ready for Implementation)
- Jest configuration ready
- React Native Testing Library setup
- Component and integration test structure

## Backend Integration

The app is designed to work with the AgroTrade backend API. Key integration points:

- **Authentication**: Login, register, profile management
- **Products**: Browse, search, filter products
- **Orders**: Create, track, manage orders
- **Users**: Profile management and settings

### API Configuration

Update the `EXPO_PUBLIC_API_URL` environment variable to point to your backend:

```env
# Development
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Production
EXPO_PUBLIC_API_URL=https://api.agrotrade.com/api
```

## Deployment

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Build
```bash
expo build:android --release-channel production
expo build:ios --release-channel production
```

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write TypeScript with proper type definitions
3. Use the established folder structure
4. Test on both iOS and Android
5. Update documentation as needed

## Performance Considerations

- **Code Splitting**: Lazy load screens and components where appropriate
- **Image Optimization**: Use appropriate image formats and sizes
- **Bundle Size**: Monitor and optimize bundle size
- **Memory Management**: Proper cleanup of subscriptions and listeners
- **Network Optimization**: Efficient data fetching with React Query

## Security

- Environment variables for sensitive configuration
- Secure token storage with AsyncStorage
- API request interceptors for authentication
- Input validation with Zod schemas

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Run `npm run clean` or `npm run reset-cache`
2. **TypeScript errors**: Run `npm run type-check` to see all issues
3. **Navigation issues**: Check navigation type definitions
4. **Styling issues**: Verify NativeWind configuration

### Debug Tools

- **React Native Debugger**: For debugging React Native apps
- **Flipper**: For network requests and state inspection
- **Expo Dev Tools**: For logs and device management

## Future Enhancements

- [ ] Push notifications for order updates
- [ ] Offline support with data synchronization
- [ ] Advanced search and filtering
- [ ] Real-time chat between buyers and sellers
- [ ] Geolocation for nearby products
- [ ] Dark mode implementation
- [ ] Accessibility improvements
- [ ] Performance monitoring and analytics

## License

This project is part of the AgroTrade platform.