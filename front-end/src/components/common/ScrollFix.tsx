import React, { useEffect } from 'react';
import { Platform } from 'react-native';

export const ScrollFix: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const fixScrolling = () => {
        // Find all ScrollView elements
        const scrollViews = document.querySelectorAll('[class*="r-WebkitOverflowScrolling"]');
        scrollViews.forEach((element) => {
          const el = element as HTMLElement;
          // Force proper scrolling
          el.style.overflow = 'auto';
          el.style.webkitOverflowScrolling = 'touch';
          el.style.height = '100%';
          el.style.maxHeight = '100vh';
        });

        // Fix elements with overflow hidden that should scroll
        const overflowElements = document.querySelectorAll('[style*="overflow: hidden scroll"]');
        overflowElements.forEach((element) => {
          const el = element as HTMLElement;
          el.style.overflow = 'auto';
          el.style.height = '100%';
        });

        // Fix flex containers
        const flexContainers = document.querySelectorAll('[style*="flex: 1"][style*="display: flex"]');
        flexContainers.forEach((element) => {
          const el = element as HTMLElement;
          if (!el.style.overflow || el.style.overflow === 'hidden') {
            // Check if this container has scrollable children
            const hasScrollableChild = el.querySelector('[class*="r-WebkitOverflowScrolling"]');
            if (!hasScrollableChild) {
              el.style.overflow = 'auto';
              el.style.height = '100%';
            }
          }
        });

        // Ensure root container allows scrolling
        const root = document.getElementById('root');
        if (root) {
          root.style.height = '100vh';
          root.style.overflow = 'hidden';
          
          // Fix direct children of root
          const rootChildren = root.children;
          if (rootChildren.length > 0) {
            const firstChild = rootChildren[0] as HTMLElement;
            firstChild.style.height = '100%';
            firstChild.style.overflow = 'hidden';
            firstChild.style.display = 'flex';
            firstChild.style.flexDirection = 'column';
          }
        }
      };

      // Initial fix
      fixScrolling();

      // Fix after navigation or DOM changes
      const observer = new MutationObserver(() => {
        requestAnimationFrame(fixScrolling);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      // Fix on resize
      window.addEventListener('resize', fixScrolling);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', fixScrolling);
      };
    }
  }, []);

  return <>{children}</>;
};