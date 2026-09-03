import React from 'react';
import { FilterState, MarketType, RatingGrade, SortDirection, SortField } from '../types';
import { AVAILABLE_SECTORS } from '../data/krxCompanies';
import { Search, ArrowUpDown, RotateCcw, Filter, ArrowUp, ArrowDown } from 'lucide-react';

interface FilterAndSortBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onResetFilters: () => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction?: SortDirection) => void;
  onSortDirectionToggle: () => void;
  sectorCounts: Record<string, number>;
}

export const FilterAndSortBar: React.FC<FilterAndSortBarProps> = ({
  filter,
  onFilterChange,
  onResetFilters,
  sortField,
  sortDirection,
  onSortChange,
  onSortDirectionToggle,
  sectorCounts,
}) => {
  const isFiltered =
    filter.searchQuery.trim() !== '' ||
    filter.market !== 'ALL' ||
    filter.sector !== 'ALL' ||
    filter.rating !== 'ALL';

  return (
    <div id="filter-sort-bar" className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs mb-5 space-y-4">
      {/* Top row: Search and Sorting */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-stock-search"
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="종목명 (예: 삼성전자, 알테오젠) 또는 종목코드(005930), 주요사업 검색..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
          />
          {filter.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs"
              title="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>정렬:</span>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="sort-btn-sector"
              type="button"
              onClick={() => onSortChange('sector')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortField === 'sector'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              업종별
            </button>

            <button
              id="sort-btn-name"
              type="button"
              onClick={() => onSortChange('name')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortField === 'name'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              종목명순
            </button>

            <button
              id="sort-btn-code"
              type="button"
              onClick={() => onSortChange('code')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortField === 'code'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              종목코드순
            </button>

            <button
              id="sort-btn-rating"
              type="button"
              onClick={() => onSortChange('rating')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortField === 'rating'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              내 평점순
            </button>

            {/* 시가총액 높은순 (내림차순) / 낮은순 (오름차순) */}
            <div className="inline-flex rounded-md bg-slate-200/60 p-0.5 border border-slate-200/80">
              <button
                id="sort-btn-marketcap-desc"
                type="button"
                onClick={() => onSortChange('marketCap', 'desc')}
                className={`px-2 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                  sortField === 'marketCap' && sortDirection === 'desc'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                title="시가총액 높은순 (내림차순) 정렬"
              >
                <span>시총 높은순</span>
                <ArrowDown className="w-3 h-3" />
              </button>

              <button
                id="sort-btn-marketcap-asc"
                type="button"
                onClick={() => onSortChange('marketCap', 'asc')}
                className={`px-2 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                  sortField === 'marketCap' && sortDirection === 'asc'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                title="시가총액 낮은순 (오름차순) 정렬"
              >
                <span>시총 낮은순</span>
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>

            <button
              id="sort-btn-watchlist"
              type="button"
              onClick={() => onSortChange('watchlist')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                sortField === 'watchlist'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⭐ 관심순</span>
            </button>
          </div>

          {/* Direction toggle button with clear label */}
          <button
            id="sort-direction-toggle"
            type="button"
            onClick={onSortDirectionToggle}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title={sortDirection === 'asc' ? '현재 오름차순 (클릭시 내림차순으로 전환)' : '현재 내림차순 (클릭시 오름차순으로 전환)'}
          >
            {sortDirection === 'asc' ? (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                <span>오름차순 (낮은순)</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                <span>내림차순 (높은순)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom row: Market tabs and Sector selection filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            시장:
          </span>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {(['ALL', 'KOSPI', 'KOSDAQ', 'KONEX'] as const).map((m) => (
              <button
                key={m}
                id={`filter-market-${m}`}
                type="button"
                onClick={() => onFilterChange({ market: m as any })}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter.market === m
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'ALL' ? '전체 시장' : m}
              </button>
            ))}
          </div>

          {/* Sector select dropdown */}
          <div className="flex items-center gap-1.5 ml-2">
            <label htmlFor="sector-filter-select" className="text-xs font-semibold text-slate-500">
              업종:
            </label>
            <select
              id="sector-filter-select"
              value={filter.sector}
              onChange={(e) => onFilterChange({ sector: e.target.value })}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer max-w-[200px]"
            >
              <option value="ALL">모든 업종 전체</option>
              {AVAILABLE_SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec} ({sectorCounts[sec] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Rating filter select */}
          <div className="flex items-center gap-1.5 ml-1">
            <label htmlFor="rating-filter-select" className="text-xs font-semibold text-slate-500">
              평점:
            </label>
            <select
              id="rating-filter-select"
              value={filter.rating}
              onChange={(e) => onFilterChange({ rating: e.target.value as any })}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="ALL">전체 평점</option>
              <option value="RATED">평가 완료만</option>
              <option value="S">S 등급 (최우수 / 강력 매수)</option>
              <option value="A">A 등급 (우수 / 매수)</option>
              <option value="B">B 등급 (보유 / 양호)</option>
              <option value="F">F 등급 (매도 / 제외)</option>
              <option value="UNRATED">미평가 종목만</option>
            </select>
          </div>
        </div>

        {/* Reset filter button */}
        {isFiltered && (
          <button
            id="btn-reset-filters"
            type="button"
            onClick={onResetFilters}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
};
