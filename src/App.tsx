import React, { useState, useEffect, useMemo } from 'react';
import {
  Company,
  CompanyEvaluation,
  FilterState,
  RatingGrade,
  SortDirection,
  SortField,
  WatchlistEntry,
  WatchlistFolder,
  ViewTab,
} from './types';
import { INITIAL_KRX_COMPANIES } from './data/krxCompanies';
import { StatsHeader } from './components/StatsHeader';
import { FilterAndSortBar } from './components/FilterAndSortBar';
import { CompanyTable } from './components/CompanyTable';
import { WatchlistFolderBar } from './components/WatchlistFolderBar';
import { AddCompanyModal } from './components/AddCompanyModal';
import { DataManagementModal } from './components/DataManagementModal';
import {
  TrendingUp,
  Plus,
  Download,
  Info,
  ExternalLink,
  SlidersHorizontal,
  Star,
  Layers,
} from 'lucide-react';

const STORAGE_KEY_EVALUATIONS = 'krx_company_evaluations_v1';
const STORAGE_KEY_CUSTOM_COMPANIES = 'krx_custom_companies_v1';
const STORAGE_KEY_WATCHLIST = 'krx_company_watchlist_v1';
const STORAGE_KEY_FOLDERS = 'krx_watchlist_folders_v1';

const INITIAL_FOLDERS: WatchlistFolder[] = [
  { id: 'default', name: '기본 관심종목', color: 'amber', createdAt: '2026-01-01' },
  { id: 'tech', name: '반도체·AI 혁신주', color: 'blue', createdAt: '2026-01-01' },
  { id: 'dividend', name: '고배당·가치주', color: 'emerald', createdAt: '2026-01-01' },
];

export default function App() {
  // Load custom companies from localStorage
  const [customCompanies, setCustomCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPANIES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Combine initial and custom companies
  const allCompanies = useMemo(() => {
    return [...INITIAL_KRX_COMPANIES, ...customCompanies];
  }, [customCompanies]);

  // Load evaluations from localStorage
  const [evaluations, setEvaluations] = useState<Record<string, CompanyEvaluation>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVALUATIONS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load watchlist folders from localStorage
  const [folders, setFolders] = useState<WatchlistFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_FOLDERS;
    } catch {
      return INITIAL_FOLDERS;
    }
  });

  // Load watchlist entries from localStorage
  const [watchlist, setWatchlist] = useState<Record<string, WatchlistEntry>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // View mode tab: ALL companies or WATCHLIST
  const [activeViewTab, setActiveViewTab] = useState<ViewTab>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');

  // Save evaluations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVALUATIONS, JSON.stringify(evaluations));
    } catch (e) {
      console.error('Failed to save evaluations to localStorage', e);
    }
  }, [evaluations]);

  // Save custom companies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_COMPANIES, JSON.stringify(customCompanies));
    } catch (e) {
      console.error('Failed to save custom companies to localStorage', e);
    }
  }, [customCompanies]);

  // Save folders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.error('Failed to save folders to localStorage', e);
    }
  }, [folders]);

  // Save watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, [watchlist]);

  // Filtering & Sorting State
  const [filter, setFilter] = useState<FilterState>({
    market: 'ALL',
    sector: 'ALL',
    rating: 'ALL',
    searchQuery: '',
  });

  const [sortField, setSortField] = useState<SortField>('sector');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Sector counts calculation
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCompanies.forEach((c) => {
      counts[c.sector] = (counts[c.sector] || 0) + 1;
    });
    return counts;
  }, [allCompanies]);

  // Grade counts calculation
  const gradeCounts = useMemo(() => {
    const counts: Record<RatingGrade, number> = { S: 0, A: 0, B: 0, F: 0 };
    let unrated = 0;

    allCompanies.forEach((c) => {
      const grade = evaluations[c.code]?.grade;
      if (grade && counts[grade] !== undefined) {
        counts[grade]++;
      } else {
        unrated++;
      }
    });

    return { counts, unrated };
  }, [allCompanies, evaluations]);

  // Watchlist calculations
  const watchlistCount = Object.keys(watchlist).length;

  const folderItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (Object.values(watchlist) as WatchlistEntry[]).forEach((entry) => {
      counts[entry.folderId] = (counts[entry.folderId] || 0) + 1;
    });
    return counts;
  }, [watchlist]);

  // Handlers for rating
  const handleRate = (code: string, grade: RatingGrade | null) => {
    setEvaluations((prev) => {
      const next = { ...prev };
      if (grade === null) {
        if (next[code] && next[code].memo) {
          next[code] = {
            ...next[code],
            grade: null,
            updatedAt: new Date().toISOString(),
          };
        } else {
          delete next[code];
        }
      } else {
        next[code] = {
          code,
          grade,
          memo: next[code]?.memo || '',
          updatedAt: new Date().toISOString(),
        };
      }
      return next;
    });
  };

  const handleUpdateMemo = (code: string, memo: string) => {
    setEvaluations((prev) => {
      const next = { ...prev };
      if (!memo && !next[code]?.grade) {
        delete next[code];
      } else {
        next[code] = {
          code,
          grade: next[code]?.grade || null,
          memo,
          updatedAt: new Date().toISOString(),
        };
      }
      return next;
    });
  };

  // Watchlist Star Toggle
  const handleToggleStar = (companyCode: string, folderId?: string) => {
    setWatchlist((prev) => {
      const next = { ...prev };
      if (next[companyCode]) {
        delete next[companyCode];
      } else {
        const targetFolder =
          folderId ||
          (selectedFolderId !== 'ALL' && folders.some((f) => f.id === selectedFolderId)
            ? selectedFolderId
            : folders[0]?.id || 'default');

        next[companyCode] = {
          companyCode,
          folderId: targetFolder,
          addedAt: new Date().toISOString(),
        };
      }
      return next;
    });
  };

  // Change company's assigned folder
  const handleChangeCompanyFolder = (companyCode: string, newFolderId: string) => {
    setWatchlist((prev) => {
      if (!prev[companyCode]) return prev;
      return {
        ...prev,
        [companyCode]: {
          ...prev[companyCode],
          folderId: newFolderId,
        },
      };
    });
  };

  // Create new folder
  const handleCreateFolder = (name: string, color: string) => {
    const newFolder: WatchlistFolder = {
      id: `folder_${Date.now()}`,
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
  };

  // Rename folder
  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    const fallbackFolderId = folders.find((f) => f.id !== folderId)?.id || 'default';
    setWatchlist((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((code) => {
        if (next[code].folderId === folderId) {
          next[code] = {
            ...next[code],
            folderId: fallbackFolderId,
          };
        }
      });
      return next;
    });

    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (selectedFolderId === folderId) {
      setSelectedFolderId('ALL');
    }
  };

  const handleAddCompany = (newCompany: Company) => {
    setCustomCompanies((prev) => [newCompany, ...prev]);
  };

  const handleImportData = (
    importedCustoms: Company[],
    importedEvals: Record<string, CompanyEvaluation>,
    importedWatchlist?: Record<string, WatchlistEntry>,
    importedFolders?: WatchlistFolder[]
  ) => {
    if (importedCustoms.length > 0) {
      setCustomCompanies(importedCustoms);
    }
    setEvaluations(importedEvals);
    if (importedWatchlist) {
      setWatchlist(importedWatchlist);
    }
    if (importedFolders && importedFolders.length > 0) {
      setFolders(importedFolders);
    }
  };

  const handleResetEvaluations = () => {
    setEvaluations({});
  };

  // Filter & Sort Pipeline
  const filteredAndSortedCompanies = useMemo(() => {
    return allCompanies
      .filter((company) => {
        // Watchlist Tab Filter
        if (activeViewTab === 'WATCHLIST') {
          const entry = watchlist[company.code];
          if (!entry) return false;
          if (selectedFolderId !== 'ALL' && entry.folderId !== selectedFolderId) {
            return false;
          }
        }

        // Market filter
        if (filter.market !== 'ALL' && company.market !== filter.market) {
          return false;
        }

        // Sector filter
        if (filter.sector !== 'ALL' && company.sector !== filter.sector) {
          return false;
        }

        // Rating filter
        const currentGrade = evaluations[company.code]?.grade;
        if (filter.rating === 'RATED' && !currentGrade) {
          return false;
        }
        if (filter.rating === 'UNRATED' && currentGrade) {
          return false;
        }
        if (
          filter.rating === 'S' ||
          filter.rating === 'A' ||
          filter.rating === 'B' ||
          filter.rating === 'F'
        ) {
          if (currentGrade !== filter.rating) return false;
        }

        // Search Query filter
        const query = filter.searchQuery.trim().toLowerCase();
        if (query) {
          const matchName = company.name.toLowerCase().includes(query);
          const matchCode = company.code.includes(query);
          const matchSector = company.sector.toLowerCase().includes(query);
          const matchSubSector = company.subSector?.toLowerCase().includes(query);
          const matchDesc = company.description?.toLowerCase().includes(query);
          const matchMemo = evaluations[company.code]?.memo?.toLowerCase().includes(query);

          if (!matchName && !matchCode && !matchSector && !matchSubSector && !matchDesc && !matchMemo) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;

        if (sortField === 'watchlist') {
          const starA = watchlist[a.code] ? 1 : 0;
          const starB = watchlist[b.code] ? 1 : 0;
          cmp = starB - starA; // Starred items first
          if (cmp === 0) {
            cmp = a.name.localeCompare(b.name, 'ko-KR');
          }
        } else if (sortField === 'sector') {
          cmp = a.sector.localeCompare(b.sector, 'ko-KR');
          if (cmp === 0) {
            cmp = a.name.localeCompare(b.name, 'ko-KR');
          }
        } else if (sortField === 'name') {
          cmp = a.name.localeCompare(b.name, 'ko-KR');
        } else if (sortField === 'code') {
          cmp = a.code.localeCompare(b.code);
        } else if (sortField === 'market') {
          cmp = a.market.localeCompare(b.market);
        } else if (sortField === 'rating') {
          const rankMap: Record<string, number> = { S: 1, A: 2, B: 3, F: 4 };
          const rankA = evaluations[a.code]?.grade ? rankMap[evaluations[a.code].grade!] : 5;
          const rankB = evaluations[b.code]?.grade ? rankMap[evaluations[b.code].grade!] : 5;
          cmp = rankA - rankB;
          if (cmp === 0) {
            cmp = a.name.localeCompare(b.name, 'ko-KR');
          }
        } else if (sortField === 'marketCap') {
          const capA = a.marketCap || 0;
          const capB = b.marketCap || 0;
          cmp = capA - capB;
          if (cmp === 0) {
            cmp = a.name.localeCompare(b.name, 'ko-KR');
          }
        }

        return sortDirection === 'asc' ? cmp : -cmp;
      });
  }, [
    allCompanies,
    evaluations,
    watchlist,
    activeViewTab,
    selectedFolderId,
    filter,
    sortField,
    sortDirection,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  KRX 상장사 분석 및 평가
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  네이버 금융 연동
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                한국거래소 2,800여개 전체 상장사 · 네이버 금융 종목분석 연동 · 관심기업 폴더 · S/A/B/F 투자 등급
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-data-modal"
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors"
              title="데이터 백업 및 엑셀 내보내기"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">데이터 백업/내보내기</span>
              <span className="sm:hidden">백업</span>
            </button>

            <button
              id="btn-open-add-company"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>종목 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Guide Callout banner */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 mb-5 flex items-start gap-3 text-emerald-950">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
            <span className="font-bold text-emerald-900">사용 방법: </span>
            기업 목록에서 <span className="font-semibold text-emerald-800 underline decoration-emerald-400">종목명을 클릭</span>하거나{' '}
            <span className="font-semibold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-0.5 shadow-2xs">
              네이버 금융 <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
            </span>{' '}
            버튼을 누르면 해당 기업의 네이버 금융 종목분석 페이지(예: 고려신용정보 `049720`)가 새 창으로 열립니다.{' '}
            종목 좌측의{' '}
            <span className="inline-flex items-center font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500 mr-0.5" /> 별표
            </span>
            를 누르면 관심기업 폴더에 즉시 등록되며, 상단의 <span className="font-bold text-slate-900">내 관심기업 폴더</span> 탭에서 폴더별로 나누어 모아볼 수 있습니다.
          </div>
        </div>

        {/* Evaluation Stats Overview */}
        <StatsHeader
          totalCompanies={allCompanies.length}
          gradeCounts={gradeCounts.counts}
          unratedCount={gradeCounts.unrated}
          activeRatingFilter={filter.rating}
          onSelectRatingFilter={(newRating) => setFilter((prev) => ({ ...prev, rating: newRating }))}
        />

        {/* Main View Mode Selector Tabs (전체 상장사 vs 내 관심기업) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-200 pb-2">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/70 shadow-2xs">
            <button
              type="button"
              id="tab-all-companies"
              onClick={() => setActiveViewTab('ALL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeViewTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>전체 상장사</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  activeViewTab === 'ALL'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-300/70 text-slate-700'
                }`}
              >
                {allCompanies.length.toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              id="tab-watchlist"
              onClick={() => setActiveViewTab('WATCHLIST')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeViewTab === 'WATCHLIST'
                  ? 'bg-white text-slate-900 shadow-sm border border-amber-300/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star
                className={`w-4 h-4 ${
                  activeViewTab === 'WATCHLIST'
                    ? 'text-amber-500 fill-amber-400'
                    : 'text-amber-500'
                }`}
              />
              <span>내 관심기업 폴더</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  watchlistCount > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                    : 'bg-slate-300/70 text-slate-600'
                }`}
              >
                {watchlistCount}
              </span>
            </button>
          </div>

          {activeViewTab === 'WATCHLIST' && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>원하는 관심 폴더를 자유롭게 추가하고 종목 좌측 별표(⭐)를 눌러 분류하세요.</span>
            </div>
          )}
        </div>

        {/* Watchlist Folder Bar (Shown when in WATCHLIST tab) */}
        {activeViewTab === 'WATCHLIST' && (
          <WatchlistFolderBar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            itemCounts={folderItemCounts}
            totalCount={watchlistCount}
          />
        )}

        {/* Filter & Sort Controls */}
        <FilterAndSortBar
          filter={filter}
          onFilterChange={(changes) => setFilter((prev) => ({ ...prev, ...changes }))}
          onResetFilters={() =>
            setFilter({
              market: 'ALL',
              sector: 'ALL',
              rating: 'ALL',
              searchQuery: '',
            })
          }
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={(field) => {
            if (sortField === field) {
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortField(field);
              setSortDirection('asc');
            }
          }}
          onSortDirectionToggle={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          sectorCounts={sectorCounts}
        />

        {/* Results Header indicator */}
        <div className="flex items-center justify-between px-1 mb-2.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {activeViewTab === 'WATCHLIST' ? '관심기업 목록' : '상장사 목록'}: 총{' '}
              <span className="font-bold text-slate-900">{filteredAndSortedCompanies.length}</span>개 종목 표시 중
              {activeViewTab === 'WATCHLIST' ? (
                <span className="text-amber-700 font-semibold ml-1">
                  (전체 관심기업 {watchlistCount}개)
                </span>
              ) : (
                filteredAndSortedCompanies.length !== allCompanies.length && (
                  <span className="text-slate-400"> (전체 {allCompanies.length}개)</span>
                )
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            정렬: {sortField === 'watchlist' ? '관심순' : sortField === 'sector' ? '업종별' : sortField === 'name' ? '종목명순' : sortField === 'code' ? '종목코드순' : sortField === 'rating' ? '내 평점순' : sortField === 'marketCap' ? '시가총액순' : '시장구분순'} ({sortDirection === 'asc' ? '오름차순' : '내림차순'})
          </span>
        </div>

        {/* Companies Table */}
        <CompanyTable
          companies={filteredAndSortedCompanies}
          evaluations={evaluations}
          onRate={handleRate}
          onUpdateMemo={handleUpdateMemo}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={(field) => {
            if (sortField === field) {
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortField(field);
              setSortDirection(field === 'marketCap' ? 'desc' : 'asc');
            }
          }}
          watchlist={watchlist}
          folders={folders}
          onToggleStar={handleToggleStar}
          onChangeCompanyFolder={handleChangeCompanyFolder}
          activeViewTab={activeViewTab}
          onSwitchToAllTab={() => setActiveViewTab('ALL')}
        />
      </main>

      {/* Add Custom Company Modal */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCompany}
        existingCodes={new Set(allCompanies.map((c) => c.code))}
      />

      {/* Data Backup & Export Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        companies={allCompanies}
        evaluations={evaluations}
        watchlist={watchlist}
        watchlistFolders={folders}
        onImportData={handleImportData}
        onResetEvaluations={handleResetEvaluations}
      />
    </div>
  );
}
