// Global mute flag, bridged from the profile Settings into the imperative audio
// modules (speak / sfx) which live outside React. The provider calls setMuted()
// whenever the setting changes.

let muted = false;

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
}
