import { useProfile } from '../state/profile';
import type { ThemeId } from '../theme/theme';
import { uiBackdropUrl } from './backdrops';
import { useMotion } from './motion';

// The app's scenery: the cottage by the lake (art/scenes/hero.mjs) in a look,
// the one on screen unless `look` names another. It moves gently where motion
// is allowed; `still` keeps it still (the look picker's small previews).
export default function Scenery({ look, still, className }: { look?: ThemeId; still?: boolean; className?: string }) {
  const shown = useProfile().look;
  const moving = useMotion() && !still;
  const src = uiBackdropUrl('hero', look ?? shown, moving);
  if (!src) return null;
  return <img className={'scenery' + (className ? ` ${className}` : '')} src={src} alt="" aria-hidden="true" draggable={false} />;
}
