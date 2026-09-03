export type MarketType = 'KOSPI' | 'KOSDAQ' | 'KONEX';

export type RatingGrade = 'S' | 'A' | 'B' | 'F';

export interface Company {
  code: string; // 6-digit KRX stock code (e.g. '005930')
  name: string;
  market: MarketType;
  sector: string; // Industry sector
  subSector?: string;
  description?: string;
  isCustom?: boolean;
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

export type SortField = 'sector' | 'name' | 'code' | 'rating' | 'market' | 'watchlist';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  market: 'ALL' | MarketType;
  sector: string;
  rating: 'ALL' | 'RATED' | 'UNRATED' | RatingGrade;
  searchQuery: string;
  selectedFolderId?: string; // 'ALL' or specific folder id
}

