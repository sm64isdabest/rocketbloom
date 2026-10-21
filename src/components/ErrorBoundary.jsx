import { Component } from "react";
import { ErrorScreen } from "../screens/ErrorScreen.jsx";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          message={this.state.error.message || "Erro inesperado na interface."}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
