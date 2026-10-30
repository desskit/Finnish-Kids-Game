import { Component, type ReactNode } from 'react';

// The last safety net: if a screen ever throws while drawing, show a calm card
// with a way home instead of a blank white page a child can't get out of. The
// saved players are untouched — going home reloads the app from them.
export default class CrashScreen extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('A screen failed to draw:', error);
  }

  private goHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <section className="screen checkpoint" role="alert">
        <h1 className="title">
          <span className="en">Oops — this screen didn't load.</span>
        </h1>
        <p className="checkpoint__text">
          <span className="en">Nothing is lost. Let's go back to the start.</span>
        </p>
        <div className="button-row">
          <button className="btn btn--primary" onClick={this.goHome} autoFocus>
            Takaisin <span className="en">Back home</span>
          </button>
        </div>
      </section>
    );
  }
}
