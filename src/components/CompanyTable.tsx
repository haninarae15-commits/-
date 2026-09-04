import React, { useState, useEffect } from 'react';
import {
  Company,
  CompanyEvaluation,
  RatingGrade,
  SortDirection,
  SortField,
  WatchlistEntry,
  WatchlistFolder,
  ViewTab,
} from '../types';
import { getNaverFinanceUrl, getFnGuideUrl } from '../data/krxCompanies';
import { RatingBadge, RatingSelector } from './RatingBadge';
import {
  ExternalLink,
  Copy,
  Check,
  FileText,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Folder,
  Layers,
  Shuffle,
  RotateCcw,
} from 'lucide-react';

interface CompanyTableProps {
  companies: Company[];
  evaluations: Record<string, CompanyEvaluation>;
  onRate: (code: string, grade: RatingGrade | null) => void;
  onUpdateMemo: (code: string, memo: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction?: SortDirection) => void;
  watchlist: Record<string, WatchlistEntry>;
  folders: WatchlistFolder[];
  onToggleStar: (companyCode: string, folderId?: string) => void;
  onChangeCompanyFolder: (companyCode: string, newFolderId: string) => void;
  activeViewTab?: ViewTab;
  onSwitchToAllTab?: () => void;
  isRandomShuffled?: boolean;
  onToggleShuffle?: () => void;
  pushRatedToBottom?: boolean;
  onTogglePushRatedToBottom?: () => void;
  activeRatingFilter?: string;
  onSelectRatingFilter?: (grade: RatingGrade | 'ALL') => void;
}

// Helper function to format market cap into easy Korean units (조, 억)
export function formatKoreanMarketCap(capInEok?: number): string {
  if (!capInEok || capInEok <= 0) return '-';
  if (capInEok >= 10000) {
    const jo = Math.floor(capInEok / 10000);
    const remainder = capInEok % 10000;
    if (remainder === 0) {
      return `${jo.toLocaleString()}조원`;
    }
    return `${jo.toLocaleString()}조 ${remainder.toLocaleString()}억`;
  }
  return `${capInEok.toLocaleString()}억원`;
}

// Inline rating check button group component placed right next to company name
interface InlineRatingCheckProps {
  companyCode: string;
  currentGrade?: RatingGrade | null;
  onRate: (code: string, grade: RatingGrade | null) => void;
}

const InlineRatingCheck: React.FC<InlineRatingCheckProps> = ({
  companyCode,
  currentGrade,
  onRate,
}) => {
  const grades: { grade: RatingGrade; label: string; activeClass: string; inactiveClass: string }[] = [
    {
      grade: 'S',
      label: 'S등급 (무기한 보유)',
      activeClass: 'bg-purple-600 text-white border-purple-700 shadow-xs font-black ring-2 ring-purple-300',
      inactiveClass: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300',
    },
    {
      grade: 'A',
      label: 'A등급 (기한 보유)',
      activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black ring-2 ring-emerald-300',
      inactiveClass: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300',
    },
    {
      grade: 'B',
      label: 'B등급 (관심)',
      activeClass: 'bg-blue-600 text-white border-blue-700 shadow-xs font-black ring-2 ring-blue-300',
      inactiveClass: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300',
    },
    {
      grade: 'C',
      label: 'C등급 (관망)',
      activeClass: 'bg-amber-500 text-white border-amber-600 shadow-xs font-black ring-2 ring-amber-300',
      inactiveClass: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300',
    },
    {
      grade: 'F',
      label: 'F등급 (매도/제외)',
      activeClass: 'bg-rose-600 text-white border-rose-700 shadow-xs font-black ring-2 ring-rose-300',
      inactiveClass: 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-300',
    },
  ];

  return (
    <div
      id={`inline-rating-group-${companyCode}`}
      className="inline-flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/90 shrink-0"
      onClick={(e) => e.stopPropagation()}
      title="기업 평가 등급 체크 (클릭하여 선택/해제)"
    >
      {grades.map((item) => {
        const isChecked = currentGrade === item.grade;
        return (
          <button
            key={item.grade}
            type="button"
            id={`btn-rate-${companyCode}-${item.grade}`}
            onClick={(e) => {
              e.stopPropagation();
              onRate(companyCode, isChecked ? null : item.grade);
            }}
            title={`${item.label}${isChecked ? ' - 클릭 시 체크 해제' : ' - 클릭하여 평가 체크'}`}
            className={`min-w-[23px] h-[22px] px-1 text-[11px] font-bold rounded flex items-center justify-center transition-all cursor-pointer border select-none ${
              isChecked
                ? `${item.activeClass} scale-105`
                : item.inactiveClass
            }`}
          >
            {item.grade}
          </button>
        );
      })}
      {currentGrade && (
        <button
          type="button"
          id={`btn-inline-clear-${companyCode}`}
          onClick={(e) => {
            e.stopPropagation();
            onRate(companyCode, null);
          }}
          title="평가 해제 (미평가)"
          className="w-4 h-[22px] flex items-center justify-center text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  evaluations,
  onRate,
  onUpdateMemo,
  sortField,
  sortDirection,
  onSortChange,
  watchlist,
  folders,
  onToggleStar,
  onChangeCompanyFolder,
  activeViewTab = 'ALL',
  onSwitchToAllTab,
  isRandomShuffled = false,
  onToggleShuffle,
  pushRatedToBottom = true,
  onTogglePushRatedToBottom,
  activeRatingFilter = 'ALL',
  onSelectRatingFilter,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeMemoCode, setActiveMemoCode] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'row' | 'name'>(() => {
    try {
      const saved = localStorage.getItem('krx_rating_color_mode');
      return saved === 'name' ? 'name' : 'row';
    } catch {
      return 'row';
    }
  });

  const handleColorModeChange = (mode: 'row' | 'name') => {
    setColorMode(mode);
    try {
      localStorage.setItem('krx_rating_color_mode', mode);
    } catch {}
  };

  // Helper for row rating background
  const getRowRatingClass = (grade?: RatingGrade | null, isStarred?: boolean, mode: 'row' | 'name' = 'row') => {
    if (mode === 'row' && grade) {
      switch (grade) {
        case 'S':
          return 'bg-purple-50/70 hover:bg-purple-100/80 border-l-4 border-l-purple-500';
        case 'A':
          return 'bg-emerald-50/70 hover:bg-emerald-100/80 border-l-4 border-l-emerald-500';
        case 'B':
          return 'bg-blue-50/70 hover:bg-blue-100/80 border-l-4 border-l-blue-500';
        case 'C':
          return 'bg-amber-100/50 hover:bg-amber-100/80 border-l-4 border-l-amber-500';
        case 'F':
          return 'bg-rose-50/70 hover:bg-rose-100/80 border-l-4 border-l-rose-500';
      }
    }
    if (isStarred) {
      return 'bg-amber-50/25 hover:bg-amber-50/60 border-l-4 border-l-amber-400';
    }
    return 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent';
  };

  // Helper for company name rating style
  const getNameRatingStyle = (grade?: RatingGrade | null, mode: 'row' | 'name' = 'row') => {
    if (!grade) {
      return {
        boxClass: '',
        textClass: 'text-slate-900 group-hover:text-emerald-700',
        badgeClass: '',
      };
    }

    if (mode === 'name') {
      switch (grade) {
        case 'S':
          return {
            boxClass: 'bg-purple-100/90 border border-purple-300 px-2 py-0.5 rounded-md shadow-2xs',
            textClass: 'text-purple-950 font-black',
            badgeClass: 'bg-purple-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-2xs',
          };
        case 'A':
          return {
            boxClass: 'bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs',
            textClass: 'text-emerald-950 font-black',
            badgeClass: 'bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-2xs',
          };
        case 'B':
          return {
            boxClass: 'bg-blue-100/90 border border-blue-300 px-2 py-0.5 rounded-md shadow-2xs',
            textClass: 'text-blue-950 font-black',
            badgeClass: 'bg-blue-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-2xs',
          };
        case 'C':
          return {
            boxClass: 'bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md shadow-2xs',
            textClass: 'text-amber-950 font-black',
            badgeClass: 'bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-2xs',
          };
        case 'F':
          return {
            boxClass: 'bg-rose-100/90 border border-rose-300 px-2 py-0.5 rounded-md shadow-2xs',
            textClass: 'text-rose-950 font-black',
            badgeClass: 'bg-rose-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-2xs',
          };
      }
    }

    // mode === 'row'
    switch (grade) {
      case 'S':
        return {
          boxClass: '',
          textClass: 'text-purple-950 font-extrabold',
          badgeClass: 'bg-purple-600 text-white font-bold text-[10px] px-1 py-0.2 rounded shadow-2xs',
        };
      case 'A':
        return {
          boxClass: '',
          textClass: 'text-emerald-950 font-extrabold',
          badgeClass: 'bg-emerald-600 text-white font-bold text-[10px] px-1 py-0.2 rounded shadow-2xs',
        };
      case 'B':
        return {
          boxClass: '',
          textClass: 'text-blue-950 font-extrabold',
          badgeClass: 'bg-blue-600 text-white font-bold text-[10px] px-1 py-0.2 rounded shadow-2xs',
        };
      case 'C':
        return {
          boxClass: '',
          textClass: 'text-amber-950 font-extrabold',
          badgeClass: 'bg-amber-500 text-white font-bold text-[10px] px-1 py-0.2 rounded shadow-2xs',
        };
      case 'F':
        return {
          boxClass: '',
          textClass: 'text-rose-950 font-extrabold',
          badgeClass: 'bg-rose-600 text-white font-bold text-[10px] px-1 py-0.2 rounded shadow-2xs',
        };
    }
  };

  // Reset to first page if companies filter list shrinks
  const totalPages = Math.max(1, Math.ceil(companies.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, companies.length);
  const displayedCompanies = companies.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 1500);
  };

  const handleOpenNaverFinance = (company: Company) => {
    const url = getNaverFinanceUrl(company.code);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openMemoEditor = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const currentMemo = evaluations[code]?.memo || '';
    setMemoDraft(currentMemo);
    setActiveMemoCode(code);
  };

  const saveMemo = (code: string) => {
    onUpdateMemo(code, memoDraft.trim());
    setActiveMemoCode(null);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-60 group-hover:opacity-100" />;
    }
    if (field === 'marketCap') {
      return sortDirection === 'desc' ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded border border-blue-200">
          <span>높은순</span>
          <ArrowDown className="w-3 h-3 text-blue-700" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded border border-blue-200">
          <span>낮은순</span>
          <ArrowUp className="w-3 h-3 text-blue-700" />
        </span>
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900 font-bold" />
    );
  };

  if (companies.length === 0) {
    if (activeViewTab === 'WATCHLIST') {
      return (
        <div
          id="empty-watchlist-message"
          className="bg-white border border-dashed border-amber-300 rounded-xl p-12 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-2xs">
            <Star className="w-6 h-6 fill-amber-300 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">선택된 관심기업 폴더가 비어있습니다</h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            전체 상장사 목록에서 종목 좌측의 별표(⭐) 아이콘을 클릭하면 관심기업 폴더에 즉시 등록됩니다.
          </p>
          {onSwitchToAllTab && (
            <button
              type="button"
              id="btn-go-to-all-companies"
              onClick={onSwitchToAllTab}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>전체 2,800여개 상장사 둘러보기</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        id="empty-companies-message"
        className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center"
      >
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">일치하는 상장 기업이 없습니다</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          검색어 또는 필터 조건을 조정하시거나, 상단의 '필터 초기화' 버튼을 눌러보세요.
        </p>
      </div>
    );
  }

  const getFolderInfo = (folderId: string) => {
    return folders.find((f) => f.id === folderId) || { name: '기본 관심종목', color: 'amber' };
  };

  const getFolderColorClass = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div id="companies-table-container" className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      {/* Rating Legend & Color Highlight Mode Switcher Bar */}
      <div
        id="rating-color-control-bar"
        className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        {/* Rating Legend / Interactive Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <span>평가 등급:</span>
          </span>
          <button
            type="button"
            onClick={() => onSelectRatingFilter?.(activeRatingFilter === 'S' ? 'ALL' : 'S')}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeRatingFilter === 'S'
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-300'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
            }`}
            title="S등급(무기한 보유) 기업만 불러오기 (클릭하여 토글)"
          >
            <span className={`w-2 h-2 rounded-full inline-block ${activeRatingFilter === 'S' ? 'bg-white' : 'bg-purple-600'}`}></span>
            S 무기한 보유
          </button>
          <button
            type="button"
            onClick={() => onSelectRatingFilter?.(activeRatingFilter === 'A' ? 'ALL' : 'A')}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeRatingFilter === 'A'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            }`}
            title="A등급(기한 보유) 기업만 불러오기 (클릭하여 토글)"
          >
            <span className={`w-2 h-2 rounded-full inline-block ${activeRatingFilter === 'A' ? 'bg-white' : 'bg-emerald-600'}`}></span>
            A 기한 보유
          </button>
          <button
            type="button"
            onClick={() => onSelectRatingFilter?.(activeRatingFilter === 'B' ? 'ALL' : 'B')}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeRatingFilter === 'B'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-300'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
            }`}
            title="B등급(관심) 기업만 불러오기 (클릭하여 토글)"
          >
            <span className={`w-2 h-2 rounded-full inline-block ${activeRatingFilter === 'B' ? 'bg-white' : 'bg-blue-600'}`}></span>
            B 관심
          </button>
          <button
            type="button"
            onClick={() => onSelectRatingFilter?.(activeRatingFilter === 'C' ? 'ALL' : 'C')}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeRatingFilter === 'C'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
            }`}
            title="C등급(관망) 기업만 불러오기 (클릭하여 토글)"
          >
            <span className={`w-2 h-2 rounded-full inline-block ${activeRatingFilter === 'C' ? 'bg-white' : 'bg-amber-500'}`}></span>
            C 관망
          </button>
          <button
            type="button"
            onClick={() => onSelectRatingFilter?.(activeRatingFilter === 'F' ? 'ALL' : 'F')}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
              activeRatingFilter === 'F'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
            }`}
            title="F등급(매도/제외) 기업만 불러오기 (클릭하여 토글)"
          >
            <span className={`w-2 h-2 rounded-full inline-block ${activeRatingFilter === 'F' ? 'bg-white' : 'bg-rose-600'}`}></span>
            F 매도/제외
          </button>
        </div>

        {/* Controls: Random Shuffle Status & Push-Rated-Bottom Toggle & Color Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. 무작위 섞기 활성 시 상태 배지 및 복귀 버튼 */}
          {isRandomShuffled && onToggleShuffle && (
            <button
              type="button"
              id="btn-table-restore-shuffle"
              onClick={onToggleShuffle}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="현재 무작위 섞기 모드입니다. 클릭 시 원래 정렬로 복귀합니다"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>무작위 섞기 활성 중 (원래 정렬 복귀)</span>
            </button>
          )}

          {/* 2. 평가완료 종목 맨 아래로 보내기 토글 */}
          {onTogglePushRatedToBottom && (
            <button
              type="button"
              id="btn-toggle-push-rated-bottom"
              onClick={onTogglePushRatedToBottom}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border select-none ${
                pushRatedToBottom
                  ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
              title="평가완료(S/A/B/F)한 기업을 자동으로 목록 맨 아래로 이동시켜 미평가 기업만 상단에 유지합니다"
            >
              <span>⬇️ 평가완료 맨 아래로</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                  pushRatedToBottom ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {pushRatedToBottom ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* 3. Color Highlight Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 pl-1">색상 강조:</span>
            <button
              type="button"
              id="btn-color-mode-row"
              onClick={() => handleColorModeChange('row')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                colorMode === 'row'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="평가 등급에 따라 전체 행에 은은한 테마 색상을 칠합니다"
            >
              <span>🎨 전체 행 색칠</span>
            </button>
            <button
              type="button"
              id="btn-color-mode-name"
              onClick={() => handleColorModeChange('name')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                colorMode === 'name'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="평가 등급에 따라 기업명에만 테마 색상을 칠합니다"
            >
              <span>🏷️ 기업명만 색칠</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-500 tracking-wider">
              {/* 1. 별표 (Star) */}
              <th
                id="th-company-star"
                className="py-3 px-2 w-[46px] text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('watchlist')}
                title="관심기업(별표) 정렬"
              >
                <div className="flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400 group-hover:scale-110 transition-transform" />
                </div>
              </th>

              {/* 2. 종목코드 */}
              <th
                id="th-company-code"
                className="py-3 px-3 w-[105px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('code')}
              >
                <div className="flex items-center gap-1.5">
                  <span>종목코드</span>
                  {renderSortIndicator('code')}
                </div>
              </th>

              {/* 3. 기업명 & 평가 */}
              <th
                id="th-company-name"
                className="py-3 px-4 min-w-[280px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>기업명 & 평가 (S/A/B/F)</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              {/* 4. 시장 */}
              <th
                id="th-company-market"
                className="py-3 px-3 w-[85px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('market')}
              >
                <div className="flex items-center gap-1.5">
                  <span>시장</span>
                  {renderSortIndicator('market')}
                </div>
              </th>

              {/* 5. 업종 (폭 축소) */}
              <th
                id="th-company-sector"
                className="py-3 px-3 w-[95px] sm:w-[105px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('sector')}
                title="업종 정렬"
              >
                <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                  <span>업종</span>
                  {renderSortIndicator('sector')}
                </div>
              </th>

              {/* 6. 시가총액 */}
              <th
                id="th-company-marketcap"
                className={`py-3 px-4 w-[160px] text-right cursor-pointer transition-colors group select-none ${
                  sortField === 'marketCap' ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-100 text-slate-800'
                }`}
                onClick={() => {
                  if (sortField === 'marketCap') {
                    onSortChange('marketCap', sortDirection === 'desc' ? 'asc' : 'desc');
                  } else {
                    onSortChange('marketCap', 'desc');
                  }
                }}
                title="시가총액 정렬: 클릭 시 높은순(내림차순) ↔ 낮은순(오름차순) 전환"
              >
                <div className="flex items-center justify-end gap-1.5 font-bold">
                  <span>시가총액</span>
                  {renderSortIndicator('marketCap')}
                </div>
              </th>

              {/* 7. 메모 */}
              <th id="th-company-memo" className="py-3 px-3 w-[125px] text-center">
                메모
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {displayedCompanies.map((company) => {
              const evalData = evaluations[company.code];
              const currentGrade = evalData?.grade;
              const hasMemo = Boolean(evalData?.memo && evalData.memo.trim().length > 0);
              const naverFinanceUrl = getNaverFinanceUrl(company.code);

              const watchEntry = watchlist[company.code];
              const isStarred = Boolean(watchEntry);
              const folderInfo = isStarred ? getFolderInfo(watchEntry.folderId) : null;
              const rowRatingClass = getRowRatingClass(currentGrade, isStarred, colorMode);
              const nameStyle = getNameRatingStyle(currentGrade, colorMode);

              return (
                <tr
                  key={company.code}
                  id={`company-row-${company.code}`}
                  onClick={() => handleOpenNaverFinance(company)}
                  className={`transition-colors cursor-pointer group ${rowRatingClass}`}
                  title="클릭하여 네이버 금융 종목분석(finance.naver.com) 열기"
                >
                  {/* 1. 별표 (Star) */}
                  <td
                    className="py-3.5 px-2 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      id={`btn-star-${company.code}`}
                      onClick={() => onToggleStar(company.code)}
                      className="p-1 rounded-md hover:bg-amber-100/70 transition-transform active:scale-90 cursor-pointer"
                      title={
                        isStarred
                          ? `관심기업 등록됨 (${folderInfo?.name}) - 클릭 시 해제`
                          : '관심기업 폴더에 추가 (클릭)'
                      }
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          isStarred
                            ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                            : 'text-slate-300 group-hover:text-slate-400 hover:!text-amber-500'
                        }`}
                      />
                    </button>
                  </td>

                  {/* 2. 종목코드 */}
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{company.code}</span>
                      <button
                        type="button"
                        id={`btn-copy-code-${company.code}`}
                        onClick={(e) => handleCopy(e, company.code)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                        title="종목코드 복사"
                      >
                        {copiedCode === company.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 3. 기업명 & S A B F 즉시 평가 체크 */}
                  <td className="py-3.5 px-4 min-w-[280px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 기업명 텍스트 박스 */}
                        <div className={`inline-flex items-center gap-1.5 transition-all ${nameStyle.boxClass}`}>
                          {currentGrade && nameStyle.badgeClass && (
                            <span className={nameStyle.badgeClass}>{currentGrade}</span>
                          )}
                          <span className={`text-[14px] sm:text-[15px] transition-colors ${nameStyle.textClass}`}>
                            {company.name}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                        </div>

                        {/* S / A / B / F 즉시 평가 체크 버튼 그룹 */}
                        <InlineRatingCheck
                          companyCode={company.code}
                          currentGrade={currentGrade}
                          onRate={onRate}
                        />

                        {company.isCustom && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                            사용자추가
                          </span>
                        )}

                        {/* Watchlist Folder Tag / Switcher */}
                        {isStarred && folderInfo && (
                          <div
                            className="inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${getFolderColorClass(
                                folderInfo.color
                              )}`}
                            >
                              <Folder className="w-2.5 h-2.5" />
                              {folderInfo.name}
                            </span>

                            {folders.length > 1 && (
                              <select
                                id={`select-folder-${company.code}`}
                                value={watchEntry.folderId}
                                onChange={(e) => {
                                  onChangeCompanyFolder(company.code, e.target.value);
                                }}
                                className="text-[10px] py-0.5 px-1 bg-white border border-slate-200 rounded text-slate-600 font-medium cursor-pointer focus:outline-none"
                                title="다른 관심 폴더로 변경"
                              >
                                {folders.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                      {company.description && (
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {company.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 4. 시장 (KOSPI/KOSDAQ/KONEX) */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                        company.market === 'KOSPI'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                          : company.market === 'KOSDAQ'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : 'bg-purple-50 text-purple-700 border border-purple-200/70'
                      }`}
                    >
                      {company.market}
                    </span>
                  </td>

                  {/* 5. 업종 (폭 축소 및 간결한 표시) */}
                  <td
                    className="py-3.5 px-3 w-[95px] sm:w-[105px] max-w-[110px]"
                    title={company.sector}
                  >
                    <span className="text-xs font-semibold text-slate-700 truncate block">
                      {company.sector}
                    </span>
                  </td>

                  {/* 6. 시가총액 (단위: 억) & 당일 변동 */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span
                        className="font-semibold text-slate-900 tabular-nums text-xs sm:text-[13px]"
                        title={company.marketCap ? `정확한 시가총액: ${company.marketCap.toLocaleString()}억원` : undefined}
                      >
                        {formatKoreanMarketCap(company.marketCap) || company.marketCapText || '-'}
                      </span>

                      {/* 당일 주가 및 등락률 */}
                      {company.changeRate !== undefined && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] tabular-nums font-medium">
                          {company.changeRate > 0 ? (
                            <span className="text-rose-600 inline-flex items-center font-bold">
                              ▲ +{company.changeRate}%
                            </span>
                          ) : company.changeRate < 0 ? (
                            <span className="text-blue-600 inline-flex items-center font-bold">
                              ▼ {company.changeRate}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              0.0%
                            </span>
                          )}
                          {company.price && (
                            <span className="text-slate-500 font-medium text-[11px]">
                              {company.price}원
                            </span>
                          )}
                        </div>
                      )}
                      {!company.changeRate && company.price && (
                        <span className="text-slate-500 font-medium text-[11px] mt-0.5">
                          {company.price}원
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 7. 메모 (메모 및 등급) */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-center gap-1.5">
                      {currentGrade && (
                        <RatingBadge grade={currentGrade} size="sm" />
                      )}
                      <button
                        type="button"
                        id={`btn-memo-${company.code}`}
                        onClick={(e) => openMemoEditor(e, company.code)}
                        title={hasMemo ? `메모: ${evalData?.memo}` : '메모 작성 및 등급 평가'}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 ${
                          hasMemo
                            ? 'bg-amber-50 text-amber-700 border-amber-300/80 hover:bg-amber-100 shadow-2xs'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {hasMemo ? (
                          <span className="text-[11px] font-bold text-amber-800 max-w-[60px] truncate">
                            {evalData?.memo}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">작성</span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        id="table-pagination-footer"
        className="px-4 py-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600"
      >
        <div className="flex items-center gap-3">
          <span>
            총 <strong className="text-slate-900 font-bold">{companies.length.toLocaleString()}</strong>개 중{' '}
            <strong className="text-slate-900 font-bold">{(startIndex + 1).toLocaleString()}</strong> -{' '}
            <strong className="text-slate-900 font-bold">{endIndex.toLocaleString()}</strong>번째 표시
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400">페이지당:</span>
            <select
              id="select-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value={50}>50개씩</option>
              <option value={100}>100개씩</option>
              <option value={200}>200개씩</option>
              <option value={500}>500개씩</option>
            </select>
          </div>
        </div>

        {/* Page navigation buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="pagination-first"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="첫 페이지"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="pagination-prev"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="이전 페이지"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400">
                      ...
                    </span>
                  );
                }
                const isCurrent = p === safePage;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    id={`pagination-page-${p}`}
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-[28px] h-7 px-2 rounded text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              id="pagination-next"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="다음 페이지"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="pagination-last"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="마지막 페이지"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Memo Editor Modal */}
      {activeMemoCode && (
        <div
          id="memo-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveMemoCode(null)}
        >
          <div
            id="memo-modal-card"
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>
                  {companies.find((c) => c.code === activeMemoCode)?.name} ({activeMemoCode}) 투자 메모
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveMemoCode(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="memo-textarea" className="block text-xs font-semibold text-slate-500 mb-1">
                종목 분석 코멘트 / 투자 아이디어 (자동 저장)
              </label>
              <textarea
                id="memo-textarea"
                rows={4}
                value={memoDraft}
                onChange={(e) => setMemoDraft(e.target.value)}
                placeholder="예: 실적 턴어라운드 기대, PER 10배 미만 저평가, 신약 3상 모멘텀 확인 필요 등"
                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900"
                autoFocus
              />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                투자 평가 등급 (S: 무기한 보유 / A: 기한 보유 / B: 관망 / F: 매도·제외)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <RatingSelector
                  currentGrade={evaluations[activeMemoCode]?.grade}
                  onChange={(newGrade) => onRate(activeMemoCode, newGrade)}
                  code={activeMemoCode}
                />
                {evaluations[activeMemoCode]?.grade && (
                  <button
                    type="button"
                    onClick={() => onRate(activeMemoCode, null)}
                    className="text-[11px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
                  >
                    평가 취소
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveMemoCode(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                닫기
              </button>
              <button
                id="btn-save-memo"
                type="button"
                onClick={() => saveMemo(activeMemoCode)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
              >
                메모 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
