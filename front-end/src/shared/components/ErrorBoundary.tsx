import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassButton } from '@design-system';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Structured logging makes it easy to grep/filter in production log aggregators.
    // TODO: forward to Sentry with `captureException(error, { extra: logPayload })`
    console.error('[ErrorBoundary] Uncaught render error:', {
      message: error.message,
      stack: error.stack?.slice(0, 600),
      componentStack: info.componentStack?.slice(0, 800),
      timestamp: new Date().toISOString(),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{this.state.error?.message ?? 'Unexpected error'}</Text>
          <GlassButton
            label="Retry"
            onPress={this.handleRetry}
            variant="secondary"
            size="sm"
            style={styles.btn}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  btn: { marginTop: 16 },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    margin: 16,
    padding: 32,
  },
  icon: { fontSize: 32, marginBottom: 12 },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6, textAlign: 'center' },
  title: { color: '#F87171', fontSize: 16, fontWeight: '700' },
});
