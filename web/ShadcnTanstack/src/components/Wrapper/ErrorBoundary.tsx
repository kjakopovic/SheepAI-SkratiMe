import { Component, ErrorInfo, ReactElement, memo } from 'react';

interface Props {
  children: ReactElement;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null, hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div>
          Something went wrong {error?.message} {errorInfo?.digest}
        </div>
      );
    }

    return children;
  }
}

export default memo(ErrorBoundary);
