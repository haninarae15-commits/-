export type MarketType = 'KOSPI' | 'KOSDAQ' | 'KONEX';

export type RatingGrade = 'S' | 'A' | 'B' | 'C' | 'F';

export interface Company {
  code: string; // 6-digit KRX stock code (e.g. '005930')
  name: string;
  market: MarketType;
  sector: string; // Industry sector
  subSector?: string;
  description?: string;
  isCustom?: boolean;
  marketCap?: number; // Market cap in 억원 (e.g. 14615697)
  marketCapText?: string; // Formatted with 억 (e.g. '14,615,697억')
  price?: string; // Current price (e.g. '250,000')
  changeRate?: number; // Today's fluctuation rate in % (e.g. -0.2, +1.5)
  changePrice?: string; // Today's fluctuation price in KRW (e.g. '+5,000', '-500')
}

export interface MarketCapSyncStatus {
  isSyncing: boolean;
  progress: number;
  lastSyncedAt: string | null;
  totalUpdated?: number;
  error?: string | null;
}

export interface CompanyEvaluation {
  code: string;
  grade: RatingGrade | null;
  memo?: string;
  updatedAt: string;
}

export interface WatchlistFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface WatchlistEntry {
  code: string;
  folderId: string;
  addedAt: string;
}

export type ViewTab = 'ALL' | 'WATCHLIST';

export type SortField = 'sector' | 'name' | 'code' | 'rating' | 'market' | 'watchlist' | 'marketCap';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  market: 'ALL' | MarketType;
  sector: string;
  rating: 'ALL' | 'RATED' | 'UNRATED' | RatingGrade;
  searchQuery: string;
  selectedFolderId?: string; // 'ALL' or specific folder id
}

