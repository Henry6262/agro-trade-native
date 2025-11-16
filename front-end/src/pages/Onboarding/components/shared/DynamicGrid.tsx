import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';

interface DynamicGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  maxItemWidth?: number;
  spacing?: number;
}

export const DynamicGrid: React.FC<DynamicGridProps> = ({
  children,
  minItemWidth = 130,
  maxItemWidth = 300,
  spacing = 8
}) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const updateDimensions = ({ window }: any) => {
      // Debounce dimension changes to prevent rapid re-renders
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenWidth(window.width);
      }, 100);
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => {
      clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, []);
  
  // Account for OnboardingLayout 10% margins on each side
  const containerMargins = screenWidth * 0.2; // 10% left + 10% right = 20% total
  const availableWidth = screenWidth - containerMargins;
  
  // Calculate optimal number of columns
  const calculateColumns = () => {
    // For specifications layout (minWidth ~280), prefer 2 columns when possible
    if (minItemWidth >= 280) {
      // Check if we can fit 2 columns
      const twoColumnWidth = (availableWidth - spacing) / 2;
      if (twoColumnWidth >= minItemWidth && twoColumnWidth <= maxItemWidth) {
        return 2;
      }
      // Fall back to 1 column if 2 doesn't fit
      if (twoColumnWidth < minItemWidth) {
        return 1;
      }
      // If 2 columns would be too wide, try 3
      const threeColumnWidth = (availableWidth - (spacing * 2)) / 3;
      if (threeColumnWidth >= minItemWidth) {
        return 3;
      }
    }
    
    // For product cards (minWidth ~130), fit as many as possible
    let maxPossibleColumns = Math.floor((availableWidth + spacing) / (minItemWidth + spacing));
    
    // Ensure at least 1 column
    if (maxPossibleColumns < 1) maxPossibleColumns = 1;
    
    // Calculate actual item width with this many columns
    let itemWidth = (availableWidth - (spacing * (maxPossibleColumns - 1))) / maxPossibleColumns;
    
    // If items would exceed max width, use fewer columns
    while (itemWidth > maxItemWidth && maxPossibleColumns > 1) {
      maxPossibleColumns--;
      itemWidth = (availableWidth - (spacing * (maxPossibleColumns - 1))) / maxPossibleColumns;
    }
    
    return maxPossibleColumns;
  };
  
  const columns = calculateColumns();
  const itemWidth = (availableWidth - (spacing * (columns - 1))) / columns;
  
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
            marginHorizontal: spacing / 2,
            marginVertical: spacing / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};