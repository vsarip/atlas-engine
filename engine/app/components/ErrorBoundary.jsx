import React from "react";

// Wraps every detail-page section and widget body so one malformed piece of
// content degrades to an inline error card instead of white-screening the app.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // Content bugs should be loud in the console but quiet on the page.
    console.error("atlas section failed to render:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="section-error" role="alert">
          ⚠ This section failed to render{" "}
          {this.props.label ? `(${this.props.label})` : ""} — the rest of the
          page is unaffected.
        </div>
      );
    }
    return this.props.children;
  }
}
