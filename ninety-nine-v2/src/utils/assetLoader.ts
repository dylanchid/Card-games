import { Rank, Suit } from '../../types/card';

// Asset loading state
export interface AssetState {
  isLoading: boolean;
  error: Error | null;
  loadedAssets: Set<string>;
}

// Asset types
export type CardAsset = {
  rank: Rank;
  suit: Suit;
  svg: string;
};

// Asset cache
const assetCache = new Map<string, string>();
const assetState: AssetState = {
  isLoading: false,
  error: null,
  loadedAssets: new Set(),
};

// Asset loading functions
export async function loadCardAsset(rank: Rank, suit: Suit): Promise<string> {
  const assetKey = getAssetKey(rank, suit);
  
  if (assetCache.has(assetKey)) {
    return assetCache.get(assetKey)!;
  }

  try {
    assetState.isLoading = true;
    assetState.error = null;

    const assetPath = getAssetPath(rank, suit);
    const response = await fetch(assetPath);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${assetPath}`);
    }

    const svgContent = await response.text();
    assetCache.set(assetKey, svgContent);
    assetState.loadedAssets.add(assetKey);
    
    return svgContent;
  } catch (error) {
    assetState.error = error instanceof Error ? error : new Error('Failed to load asset');
    throw assetState.error;
  } finally {
    assetState.isLoading = false;
  }
}

// Asset state management
export function getAssetState(): AssetState {
  return { ...assetState };
}

export function clearAssetCache(): void {
  assetCache.clear();
  assetState.loadedAssets.clear();
  assetState.error = null;
}

// Asset validation
export function isValidCardAsset(rank: Rank, suit: Suit): boolean {
  return [Rank.ACE, Rank.JACK, Rank.QUEEN, Rank.KING].includes(rank);
}

// Asset path generation
export function getAssetKey(rank: Rank, suit: Suit): string {
  return `${rank.toLowerCase()}_${suit.toLowerCase()}`;
}

export function getAssetPath(rank: Rank, suit: Suit): string {
  const rankName = rank.toLowerCase().replace('_', '');
  const suitName = suit.toLowerCase().replace('_', '');
  return `/assets/cards/face-cards/${rankName}_of_${suitName}.svg`;
}

// Preload all assets
export async function preloadAllAssets(): Promise<void> {
  const ranks = Object.values(Rank);
  const suits = Object.values(Suit);
  
  const loadPromises = ranks.flatMap(rank =>
    suits.map(suit => loadCardAsset(rank, suit))
  );
  
  await Promise.all(loadPromises);
} 