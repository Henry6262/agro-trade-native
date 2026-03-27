import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { GlassButton } from '../../../src/design-system/GlassButton';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { View } = require('react-native');
    return <View testID="linear-gradient" {...props}>{children}</View>;
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    default: {
      createAnimatedComponent: (Component: React.ComponentType) => Component,
    },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    withSpring: (v: number) => v,
  };
});

jest.mock('../../../src/design-system/tokens', () => ({
  GLASS: {
    subtle: { fill: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.10)', blur: 20 },
    medium: { fill: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.18)', blur: 20 },
    strong: { fill: 'rgba(255,255,255,0.22)', border: 'rgba(255,255,255,0.28)', blur: 20 },
  },
  COLORS: {
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.35)',
    accentGreen: '#4ADE80',
    accentGold: '#FCD34D',
    danger: '#F87171',
  },
  ANIM: {
    spring: { damping: 18, stiffness: 200 },
    springStiff: { damping: 22, stiffness: 250 },
  },
  GRADIENT: {
    background: ['#021207', '#000a03', '#000000'],
    green: ['#16A34A', '#4ADE80'],
    gold: ['#D97706', '#FCD34D'],
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const noop = jest.fn();

const TestIcon = () => <View testID="left-icon" />;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GlassButton', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── 1. Accessibility ────────────────────────────────────────────────────

  describe('accessibility', () => {
    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
      '%s variant has accessibilityRole="button"',
      (variant) => {
        const { getByRole } = render(
          <GlassButton label="Test" onPress={noop} variant={variant} />
        );
        expect(getByRole('button')).toBeTruthy();
      }
    );

    it('sets accessibilityLabel to the label prop', () => {
      const { getByLabelText } = render(
        <GlassButton label="Submit Order" onPress={noop} />
      );
      expect(getByLabelText('Submit Order')).toBeTruthy();
    });

    it('accessibilityState.disabled is true when disabled', () => {
      const { getByRole } = render(
        <GlassButton label="Test" onPress={noop} disabled />
      );
      const btn = getByRole('button');
      expect(btn.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('accessibilityState.disabled is true when loading', () => {
      const { getByRole } = render(
        <GlassButton label="Test" onPress={noop} loading />
      );
      const btn = getByRole('button');
      expect(btn.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('accessibilityState.disabled is false when enabled', () => {
      const { getByRole } = render(
        <GlassButton label="Test" onPress={noop} />
      );
      const btn = getByRole('button');
      expect(btn.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false })
      );
    });
  });

  // ── 2. leftIcon rendering across all variants ───────────────────────────

  describe('leftIcon', () => {
    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
      '%s variant renders leftIcon',
      (variant) => {
        const { getByTestId } = render(
          <GlassButton
            label="Test"
            onPress={noop}
            variant={variant}
            leftIcon={<TestIcon />}
          />
        );
        expect(getByTestId('left-icon')).toBeTruthy();
      }
    );

    it('does not render icon wrapper when leftIcon is not provided', () => {
      const { queryByTestId } = render(
        <GlassButton label="Test" onPress={noop} />
      );
      expect(queryByTestId('left-icon')).toBeNull();
    });
  });

  // ── 3. style prop applied to all variants ───────────────────────────────

  describe('style prop passthrough', () => {
    const customStyle = { marginTop: 99 };

    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
      '%s variant applies custom style prop',
      (variant) => {
        const { getByRole } = render(
          <GlassButton
            label="Test"
            onPress={noop}
            variant={variant}
            style={customStyle}
          />
        );
        const btn = getByRole('button');
        const flatStyle = Array.isArray(btn.props.style)
          ? btn.props.style
          : [btn.props.style];
        const hasMargin = flatStyle.some(
          (s: Record<string, unknown>) => s && s.marginTop === 99
        );
        expect(hasMargin).toBe(true);
      }
    );
  });

  // ── 4. Label rendering ──────────────────────────────────────────────────

  describe('label', () => {
    it('renders the label text', () => {
      const { getByText } = render(
        <GlassButton label="Place Order" onPress={noop} />
      );
      expect(getByText('Place Order')).toBeTruthy();
    });

    it('shows ActivityIndicator instead of label when loading', () => {
      const { queryByText } = render(
        <GlassButton label="Place Order" onPress={noop} loading />
      );
      expect(queryByText('Place Order')).toBeNull();
    });
  });

  // ── 5. Press handler ────────────────────────────────────────────────────

  describe('onPress', () => {
    it('calls onPress when pressed', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <GlassButton label="Go" onPress={handler} />
      );
      fireEvent.press(getByRole('button'));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onPress when disabled', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <GlassButton label="Go" onPress={handler} disabled />
      );
      fireEvent.press(getByRole('button'));
      expect(handler).not.toHaveBeenCalled();
    });

    it('does NOT call onPress when loading', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <GlassButton label="Go" onPress={handler} loading />
      );
      fireEvent.press(getByRole('button'));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── 6. Gradient variant uses LinearGradient ─────────────────────────────

  describe('gradient variants', () => {
    it('primary renders LinearGradient', () => {
      const { getByTestId } = render(
        <GlassButton label="Go" onPress={noop} variant="primary" />
      );
      expect(getByTestId('linear-gradient')).toBeTruthy();
    });

    it('danger renders LinearGradient', () => {
      const { getByTestId } = render(
        <GlassButton label="Delete" onPress={noop} variant="danger" />
      );
      expect(getByTestId('linear-gradient')).toBeTruthy();
    });

    it('secondary does NOT render LinearGradient', () => {
      const { queryByTestId } = render(
        <GlassButton label="Cancel" onPress={noop} variant="secondary" />
      );
      expect(queryByTestId('linear-gradient')).toBeNull();
    });

    it('ghost does NOT render LinearGradient', () => {
      const { queryByTestId } = render(
        <GlassButton label="Skip" onPress={noop} variant="ghost" />
      );
      expect(queryByTestId('linear-gradient')).toBeNull();
    });
  });

  // ── 7. Size variants ────────────────────────────────────────────────────

  describe('sizes', () => {
    it.each(['sm', 'md', 'lg'] as const)(
      'renders without error at size %s',
      (size) => {
        const { getByText } = render(
          <GlassButton label="Sized" onPress={noop} size={size} />
        );
        expect(getByText('Sized')).toBeTruthy();
      }
    );
  });

  // ── 8. fullWidth ────────────────────────────────────────────────────────

  describe('fullWidth', () => {
    it('applies alignSelf stretch when fullWidth is true', () => {
      const { getByRole } = render(
        <GlassButton label="Wide" onPress={noop} fullWidth />
      );
      const btn = getByRole('button');
      const flatStyle = Array.isArray(btn.props.style)
        ? btn.props.style
        : [btn.props.style];
      const hasStretch = flatStyle.some(
        (s: Record<string, unknown>) => s && s.alignSelf === 'stretch'
      );
      expect(hasStretch).toBe(true);
    });
  });
});
