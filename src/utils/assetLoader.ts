import { Rank, Suit } from '../types/card';
import { CardType } from '@/types/card';

// Asset loading state
export interface AssetState {
  isLoading: boolean;
  error: Error | null;
  loadedAssets: Set<string>;
  totalAssets: number;
  loadedCount: number;
}

// Asset types
export type CardAsset = {
  rank: Rank;
  suit: Suit;
  svg: string;
  lastAccessed: number;
};

// Asset cache with LRU-like behavior
const assetCache = new Map<string, CardAsset>();
const MAX_CACHE_SIZE = 52; // Maximum number of cards
const assetState: AssetState = {
  isLoading: false,
  error: null,
  loadedAssets: new Set(),
  totalAssets: 52, // Total number of possible cards
  loadedCount: 0,
};

// Asset loading functions
export async function loadCardAsset(rank: Rank, suit: Suit): Promise<string> {
  const assetKey = getAssetKey(rank, suit);

  // Check cache first
  const cachedAsset = assetCache.get(assetKey);
  if (cachedAsset) {
    cachedAsset.lastAccessed = Date.now();
    return cachedAsset.svg;
  }

  try {
    assetState.isLoading = true;
    assetState.error = null;

    const card: CardType = {
      id: assetKey,
      rank,
      suit,
      isFaceUp: true,
      position: {
        x: 0,
        y: 0,
        zIndex: 0
      }
    };
    const assetPath = getAssetPath(card);
    const response = await fetch(assetPath);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${assetPath}`);
    }

    const svgContent = await response.text();

    // Implement LRU cache
    if (assetCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(assetCache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      )[0][0];
      assetCache.delete(oldestKey);
    }

    // Add to cache
    assetCache.set(assetKey, {
      rank,
      suit,
      svg: svgContent,
      lastAccessed: Date.now(),
    });

    assetState.loadedAssets.add(assetKey);
    assetState.loadedCount = assetCache.size;

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
  assetState.loadedCount = 0;
  assetState.error = null;
}

// Asset validation
export function isValidCardAsset(rank: Rank, suit: Suit): boolean {
  // Validate rank
  if (!Object.values(Rank).includes(rank)) {
    return false;
  }

  // Validate suit
  if (!Object.values(Suit).includes(suit)) {
    return false;
  }

  return true;
}

// Asset path generation
export function getAssetKey(rank: Rank, suit: Suit): string {
  return `${rank.toLowerCase()}_${suit.toLowerCase()}`;
}

export function getAssetPath(card: CardType): string {
  if (!card.isFaceUp) {
    return '/assets/cards/back.svg';
  }
  
  const rank = card.rank.toLowerCase();
  const suit = card.suit.toLowerCase();
  return `/assets/cards/face-cards/${rank}_of_${suit}.svg`;
}

// Preload all assets with progress tracking
export async function preloadAllAssets(onProgress?: (progress: number) => void): Promise<void> {
  const ranks = Object.values(Rank);
  const suits = Object.values(Suit);
  const totalAssets = ranks.length * suits.length;
  let loadedCount = 0;

  const loadPromises = ranks.flatMap(rank =>
    suits.map(async suit => {
      try {
        await loadCardAsset(rank, suit);
        loadedCount++;
        onProgress?.(loadedCount / totalAssets);
      } catch (error) {
        console.error(`Failed to preload asset for ${rank} of ${suit}:`, error);
      }
    })
  );

  await Promise.all(loadPromises);
}

// Cache management
export function getCacheSize(): number {
  return assetCache.size;
}

export function getCacheKeys(): string[] {
  return Array.from(assetCache.keys());
}

// Performance monitoring
export function getCacheStats(): {
  size: number;
  oldestAsset: string | null;
  newestAsset: string | null;
} {
  const entries = Array.from(assetCache.entries());
  const sorted = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

  return {
    size: assetCache.size,
    oldestAsset: sorted[0]?.[0] ?? null,
    newestAsset: sorted[sorted.length - 1]?.[0] ?? null,
  };
}
