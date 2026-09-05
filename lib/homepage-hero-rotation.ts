export const HOME_HERO_ROTATION_INTERVAL_MS = 7_000;
export const HOME_HERO_TRANSITION_MS = 700;

export interface HomeHeroAutoRotationState {
  itemCount: number;
  reducedMotion: boolean;
  paused: boolean;
  visible: boolean;
}

export function normalizeHomeHeroIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return ((Math.trunc(index) % itemCount) + itemCount) % itemCount;
}

export function getNextHomeHeroIndex(index: number, itemCount: number): number {
  return normalizeHomeHeroIndex(index + 1, itemCount);
}

export function getPreviousHomeHeroIndex(index: number, itemCount: number): number {
  return normalizeHomeHeroIndex(index - 1, itemCount);
}

export function shouldAutoRotateHomeHero(state: HomeHeroAutoRotationState): boolean {
  return state.itemCount > 1 && !state.reducedMotion && !state.paused && state.visible;
}
