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
  
  // Account for 10% margins on each side (20% total)
  const availableWidth = width * 0.8;
  
  // Calculate how many items can fit per row
  const calculateItemsPerRow = () => {
    // Try to fit as many items as possible within constraints
    let itemsPerRow = Math.floor(availableWidth / minItemWidth);
    
    // Ensure at least 1 item per row
    if (itemsPerRow < 1) itemsPerRow = 1;
    
    // Calculate actual item width
    const itemWidth = (availableWidth - (spacing * (itemsPerRow - 1))) / itemsPerRow;
    
    // If items would be too wide, add more items per row
    if (itemWidth > maxItemWidth && itemsPerRow < children.length) {
      itemsPerRow = Math.ceil(availableWidth / maxItemWidth);
    }
    
    return itemsPerRow;
  };
  
  const itemsPerRow = calculateItemsPerRow();
  const itemWidth = (availableWidth - (spacing * (itemsPerRow - 1))) / itemsPerRow;
  
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
            width: itemWidth,
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
  
  // Account for 10% margins on each side
  const availableWidth = width * 0.8;
  
  // Determine columns based on screen size
  const getColumns = () => {
    if (width < 640) return columns.xs || 2;
    if (width < 1024) return columns.sm || 3;
    return columns.lg || 4;
  };
  
  const numColumns = getColumns();
  const itemWidth = (availableWidth - (spacing * (numColumns - 1))) / numColumns;
  
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
            width: itemWidth,
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