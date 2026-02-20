// Simple localStorage-based generation counter
// No backend changes needed - pure client-side tracking

const STORAGE_KEY = 'coldcopy_generation_count';
const FREE_LIMIT = 3;

export function getGenerationCount(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

export function incrementGenerationCount(): number {
  const current = getGenerationCount();
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEY, newCount.toString());
  return newCount;
}

export function hasReachedLimit(): boolean {
  return getGenerationCount() >= FREE_LIMIT;
}

export function shouldShowUpgradeModal(): boolean {
  // Show modal exactly when user hits the 3rd generation
  return getGenerationCount() === FREE_LIMIT;
}

export function shouldShowUpgradeBanner(): boolean {
  // Show persistent banner after 3rd generation
  return getGenerationCount() > FREE_LIMIT;
}

// Analytics tracking
export function trackCTAShown(type: 'modal' | 'banner') {
  console.log('[Analytics] Upgrade CTA shown:', type);
  // TODO: Send to analytics service when available
}

export function trackCTAClicked(tier: 'starter' | 'pro', source: 'modal' | 'banner') {
  console.log('[Analytics] Upgrade CTA clicked:', { tier, source });
  // TODO: Send to analytics service when available
}
