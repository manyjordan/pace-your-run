import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 bg-background">
          <div className="flex flex-col items-center gap-4 max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-bold text-foreground">Une erreur est survenue</h1>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message ?? "Erreur inconnue"}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
