import React from 'react';
import { GlassBottomNav } from '../../../design-system';

interface NavigationItem {
  id: string;
  icon: any;
  label: string;
}

interface BottomNavigationProps {
  items: NavigationItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeSection,
  onSectionChange,
}) => {
  return <GlassBottomNav items={items} activeId={activeSection} onSelect={onSectionChange} />;
};
