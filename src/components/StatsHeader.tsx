import React from 'react';
import { RatingGrade } from '../types';
import { GRADE_CONFIG } from './RatingBadge';
import { CheckCircle2, ListFilter, TrendingUp } from 'lucide-react';

interface StatsHeaderProps {
  totalCompanies: number;
  gradeCounts: Record<RatingGrade, number>;
  unratedCount: number;
  activeRatingFilter: 'ALL' | 'RATED' | 'UNRATED' | RatingGrade;
  onSelectRatingFilter: (filter: 'ALL' | 'RATED' | 'UNRATED' | RatingGrade) => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  totalCompanies,
  gradeCounts,
  unratedCount,
  activeRatingFilter,
  onSelectRatingFilter,
}) => {
  const ratedCount = totalCompanies - unratedCount;
  const ratedPercent = totalCompanies > 0 ? Math.round((ratedCount / totalCompanies) * 100) : 0;

  const grades: RatingGrade[] = ['S', 'A', 'B', 'F'];

  return (
    <div id="stats-header-container" className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-900 text-white rounded-lg inline-flex">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              KRX 상장사 포트폴리오 평가 현황
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            각 기업명을 클릭하면 FnGuide 기업분석 페이지로 바로 이동하며, 아래 등급 카드를 클릭해 등급별 필터링을 할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">평가 진행률</div>
            <div className="text-sm sm:text-base font-bold text-slate-800">
              <span className="text-slate-950 font-black">{ratedCount}</span>
              <span className="text-slate-400 font-normal"> / {totalCompanies}개</span>
              <span className="ml-1.5 text-xs font-semibold text-emerald-600">({ratedPercent}%)</span>
            </div>
          </div>
          <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${ratedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grade Quick Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mt-4">
        {/* 전체 */}
        <button
          id="stat-filter-all"
          type="button"
          onClick={() => onSelectRatingFilter('ALL')}
          className={`flex flex-col p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
            activeRatingFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
          }`}
        >
          <span className="text-xs font-medium opacity-80 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" />
            전체 상장사
          </span>
          <span className="text-lg font-black mt-1">
            {totalCompanies}
            <span className="text-xs font-normal ml-0.5 opacity-70">개</span>
          </span>
        </button>

        {/* Grades A, B, C, F */}
        {grades.map((g) => {
          const cfg = GRADE_CONFIG[g];
          const count = gradeCounts[g] || 0;
          const isActive = activeRatingFilter === g;

          return (
            <button
              key={g}
              id={`stat-filter-grade-${g}`}
              type="button"
              onClick={() => onSelectRatingFilter(isActive ? 'ALL' : g)}
              className={`flex flex-col p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
                isActive
                  ? `${cfg.bg} ${cfg.text} ${cfg.border} border-2 shadow-xs scale-[1.02]`
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1">
                  <span
                    className={`w-4 h-4 rounded text-[10px] font-black inline-flex items-center justify-center ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                  >
                    {g}
                  </span>
                  <span>{g} 등급</span>
                </span>
                <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                  {cfg.desc.split('/')[0]}
                </span>
              </div>
              <span className="text-lg font-black mt-1 text-slate-900">
                {count}
                <span className="text-xs font-normal text-slate-400 ml-0.5">개</span>
              </span>
            </button>
          );
        })}

        {/* 미평가 */}
        <button
          id="stat-filter-unrated"
          type="button"
          onClick={() => onSelectRatingFilter(activeRatingFilter === 'UNRATED' ? 'ALL' : 'UNRATED')}
          className={`flex flex-col p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
            activeRatingFilter === 'UNRATED'
              ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
              : 'bg-slate-50/70 hover:bg-slate-100 text-slate-600 border-slate-200/80'
          }`}
        >
          <span className="text-xs font-medium opacity-80 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            미평가
          </span>
          <span className="text-lg font-black mt-1 text-slate-700">
            {unratedCount}
            <span className="text-xs font-normal text-slate-400 ml-0.5">개</span>
          </span>
        </button>
      </div>
    </div>
  );
};
