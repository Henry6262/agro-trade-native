import React, { useEffect } from 'react';
import { Platform } from 'react-native';

interface WebLayoutFixProps {
  children: React.ReactNode;
}

export const WebLayoutFix: React.FC<WebLayoutFixProps> = ({ children }) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Apply fixes to the root elements dynamically
      const applyWebFixes = () => {
        // Find and fix the root container
        const rootElements = document.querySelectorAll('.css-view-g5y9jx.r-flex-13awgt0');
        if (rootElements.length > 0) {
          const rootElement = rootElements[0] as HTMLElement;
          rootElement.style.position = 'unset';
          rootElement.style.height = '100%';
        }

        // Fix the first child for proper height
        const minHeightElements = document.querySelectorAll('.css-view-g5y9jx.r-minHeight-2llsf');
        minHeightElements.forEach((element) => {
          const el = element as HTMLElement;
          el.style.height = '100%';
          el.style.position = 'relative';
        });

        // Fix the onboarding container specifically
        const onboardingContainer = document.querySelector('[style*="flex: 1"][style*="background-color: rgb(17, 24, 39)"]');
        if (onboardingContainer) {
          const el = onboardingContainer as HTMLElement;
          el.style.height = '100vh';
          el.style.overflow = 'hidden';
        }

        // Fix the sidebar to be properly fixed
        const sidebar = document.querySelector('[style*="width: 96px"][style*="height: 100%"]');
        if (sidebar) {
          const el = sidebar as HTMLElement;
          el.style.position = 'fixed';
          el.style.left = '0';
          el.style.top = '0';
          el.style.bottom = '0';
          el.style.height = '100vh';
        }

        // Fix the main content area to account for sidebar
        const mainContent = document.querySelector('[style*="flex: 1"]:has(.r-WebkitOverflowScrolling-150rngu)');
        if (mainContent) {
          const el = mainContent as HTMLElement;
          el.style.height = '100vh';
          el.style.overflow = 'hidden';
        }

        // Fix the scrollable area
        const scrollableAreas = document.querySelectorAll('.r-WebkitOverflowScrolling-150rngu');
        scrollableAreas.forEach((scrollArea) => {
          const el = scrollArea as HTMLElement;
          el.style.height = 'calc(100vh - 80px)'; // Account for bottom navigation
          el.style.overflowY = 'auto';
        });

        // Fix the bottom navigation to be properly fixed
        const bottomNav = document.querySelector('[style*="position: absolute"][style*="bottom: 0"][style*="z-index: 9999"]');
        if (bottomNav) {
          const el = bottomNav as HTMLElement;
          el.style.position = 'fixed';
          el.style.bottom = '0';
          el.style.left = '96px'; // Account for sidebar
          el.style.right = '0';
          el.style.zIndex = '1000';
        }
      };

      // Apply fixes after a short delay to ensure DOM is ready
      setTimeout(applyWebFixes, 100);

      // Also apply on window resize
      window.addEventListener('resize', applyWebFixes);

      // Apply fixes when navigation changes
      const observer = new MutationObserver(() => {
        applyWebFixes();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        window.removeEventListener('resize', applyWebFixes);
        observer.disconnect();
      };
    }
  }, []);

  return <>{children}</>;
};