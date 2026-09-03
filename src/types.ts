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

export type SortField = 'sector' | 'name' | 'code' | 'rating' | 'market';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  market: 'ALL' | MarketType;
  sector: string;
  rating: 'ALL' | 'RATED' | 'UNRATED' | RatingGrade;
  searchQuery: string;
}
