import React from 'react';
import { View, Dimensions } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  maxItemWidth?: number;
  spacing?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 250,
  maxItemWidth = 400,
  spacing = 8
}) => {
  const { width } = Dimensions.get('window');
  
  // Calculate how many items can fit per row
  const calculateItemsPerRow = () => {
    // For very small screens, always use 1 column
    if (width < 400) return 1;
    
    // For medium screens, try 2 columns
    if (width < 768) return Math.min(2, children.length);
    
    // For larger screens, calculate based on min width
    const possibleItems = Math.floor(width / minItemWidth);
    return Math.max(1, Math.min(possibleItems, children.length));
  };
  
  const itemsPerRow = calculateItemsPerRow();
  
  return (
    <View 
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing / 2,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / itemsPerRow}%`,
            paddingHorizontal: spacing / 2,
            paddingVertical: spacing / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

// Product Grid Component - specifically for product cards
interface ProductGridProps {
  children: React.ReactNode[];
  columns?: {
    xs?: number;  // mobile
    sm?: number;  // tablet
    lg?: number;  // desktop
  };
  spacing?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  children,
  columns = { xs: 2, sm: 3, lg: 4 },
  spacing = 8
}) => {
  const { width } = Dimensions.get('window');
  
  // Determine columns based on screen size
  const getColumns = () => {
    // Single column for very small screens
    if (width < 400) return 1;
    // Use configured columns for different breakpoints
    if (width < 640) return columns.xs || 2;
    if (width < 1024) return columns.sm || 3;
    return columns.lg || 4;
  };
  
  const numColumns = Math.min(getColumns(), children.length);
  
  return (
    <View 
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing / 2,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / numColumns}%`,
            paddingHorizontal: spacing / 2,
            paddingVertical: spacing / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};