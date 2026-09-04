import React, { useState, useEffect, useMemo } from 'react';
import {
  Company,
  CompanyEvaluation,
  FilterState,
  MarketCapSyncStatus,
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
import { MarketCapSyncBar } from './components/MarketCapSyncBar';
import { AddCompanyModal } from './components/AddCompanyModal';
import { DataManagementModal } from './components/DataManagementModal';
import marketCapCacheData from './data/marketCapCache.json';
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

  // Live market cap and daily fluctuation state
  const [liveMarketCaps, setLiveMarketCaps] = useState<
    Record<
      string,
      {
        marketCap: number;
        marketCapText: string;
        price?: string;
        changeRate?: number;
        changePrice?: string;
        updatedAt?: string;
      }
    >
  >(() => (marketCapCacheData && (marketCapCacheData as any).data ? (marketCapCacheData as any).data : {}));

  const [syncStatus, setSyncStatus] = useState<MarketCapSyncStatus>({
    isSyncing: false,
    progress: 0,
    lastSyncedAt: (marketCapCacheData && (marketCapCacheData as any).lastSyncedAt) || null,
  });

  // Fetch initial market caps and status on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLatestMarketCaps = async () => {
      try {
        const res = await fetch('/api/market-cap/latest');
        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            setLiveMarketCaps(json.data);
            setSyncStatus((prev) => ({
              ...prev,
              lastSyncedAt: json.lastSyncedAt || new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.warn('Initial market cap fetch failed:', err);
      }
    };

    fetchLatestMarketCaps();
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger market cap sync on demand
  const handleSyncMarketCap = async () => {
    if (syncStatus.isSyncing) return;
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, progress: 10 }));

    try {
      const syncRes = await fetch('/api/market-cap/sync');
      if (syncRes.ok) {
        const json = await syncRes.json();
        if (json.data) {
          setLiveMarketCaps(json.data);
        }
        setSyncStatus({
          isSyncing: false,
          progress: 100,
          lastSyncedAt: json.lastSyncedAt || new Date().toISOString(),
          totalUpdated: json.updatedCount,
        });
        return;
      }
    } catch (err) {
      console.warn('Sync call returned, polling status...', err);
    }

    // Polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch('/api/market-cap/status');
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          setSyncStatus((prev) => ({
            ...prev,
            isSyncing: statusJson.isSyncing,
            progress: statusJson.syncProgress || 100,
            lastSyncedAt: statusJson.lastSyncedAt,
          }));
          if (!statusJson.isSyncing) {
            clearInterval(pollInterval);
            const latestRes = await fetch('/api/market-cap/latest');
            if (latestRes.ok) {
              const latestJson = await latestRes.json();
              if (latestJson.data) setLiveMarketCaps(latestJson.data);
            }
          }
        }
      } catch {
        clearInterval(pollInterval);
        setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
      }
    }, 800);
  };

  // Combine initial, custom companies, and live market cap fluctuations
  const allCompanies = useMemo(() => {
    const base = [...INITIAL_KRX_COMPANIES, ...customCompanies];
    if (Object.keys(liveMarketCaps).length === 0) return base;
    return base.map((c) => {
      const live = liveMarketCaps[c.code];
      if (!live) return c;
      return {
        ...c,
        marketCap: live.marketCap ?? c.marketCap,
        marketCapText: live.marketCapText ?? c.marketCapText,
        price: live.price ?? c.price,
        changeRate: live.changeRate ?? c.changeRate,
        changePrice: live.changePrice ?? c.changePrice,
      };
    });
  }, [customCompanies, liveMarketCaps]);

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

  // Random shuffle mode state (category & rating agnostic shuffle)
  const [isRandomShuffled, setIsRandomShuffled] = useState<boolean>(false);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // Push evaluated/rated companies to bottom (Default: true)
  const [pushRatedToBottom, setPushRatedToBottom] = useState<boolean>(true);

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
    const counts: Record<RatingGrade, number> = { S: 0, A: 0, B: 0, C: 0, F: 0 };
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
    const filtered = allCompanies.filter((company) => {
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
      });

    // 1. Random Shuffle Mode:
    // Disregard ratings, sector categories, market caps, etc. and shuffle randomly!
    if (isRandomShuffled) {
      const shuffled = [...filtered];
      let seed = shuffleSeed || 42;
      for (let i = shuffled.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    // 2. Normal sorting mode (with automatic 'push evaluated to bottom' behavior)
    return filtered.sort((a, b) => {
      // If pushRatedToBottom is active and user didn't explicitly select 'rating' sort,
      // push evaluated (S, A, B, F) companies to the bottom so unrated companies stay on top
      if (pushRatedToBottom && sortField !== 'rating') {
        const isRatedA = Boolean(evaluations[a.code]?.grade);
        const isRatedB = Boolean(evaluations[b.code]?.grade);
        if (isRatedA !== isRatedB) {
          return isRatedA ? 1 : -1; // Unrated first, rated to bottom
        }
      }

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
        const rankMap: Record<string, number> = { S: 1, A: 2, B: 3, C: 4, F: 5 };
        const rankA = evaluations[a.code]?.grade ? rankMap[evaluations[a.code].grade!] : 6;
        const rankB = evaluations[b.code]?.grade ? rankMap[evaluations[b.code].grade!] : 6;
        cmp = rankA - rankB;
        if (cmp === 0) {
          cmp = a.name.localeCompare(b.name, 'ko-KR');
        }
      } else if (sortField === 'marketCap') {
        const capA = a.marketCap || 0;
        const capB = b.marketCap || 0;
        if (capA === 0 && capB > 0) return 1;
        if (capB === 0 && capA > 0) return -1;
        cmp = sortDirection === 'asc' ? capA - capB : capB - capA;
        if (cmp === 0) {
          cmp = a.name.localeCompare(b.name, 'ko-KR');
        }
        return cmp;
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
    isRandomShuffled,
    shuffleSeed,
    pushRatedToBottom,
  ]);

  const handleSortChange = (field: SortField, direction?: SortDirection) => {
    // If random shuffle was on, turning on an explicit sort returns to normal
    if (isRandomShuffled) {
      setIsRandomShuffled(false);
    }
    if (direction) {
      setSortField(field);
      setSortDirection(direction);
    } else if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'marketCap' ? 'desc' : 'asc');
    }
  };

  const handleToggleShuffle = () => {
    setIsRandomShuffled((prev) => {
      if (!prev) {
        setShuffleSeed(Date.now());
        return true;
      }
      return false;
    });
  };

  const handleReshuffle = () => {
    setShuffleSeed(Date.now());
  };

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

        {/* Live Market Cap & Fluctuation Sync Bar */}
        <MarketCapSyncBar
          status={syncStatus}
          totalCompanies={allCompanies.length}
          onSync={handleSyncMarketCap}
          isRandomShuffled={isRandomShuffled}
          onToggleShuffle={handleToggleShuffle}
          onReshuffle={handleReshuffle}
        />

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
          onSortChange={handleSortChange}
          onSortDirectionToggle={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          sectorCounts={sectorCounts}
        />

        {/* Results Header indicator */}
        <div className="flex items-center justify-between px-1 mb-2.5 text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
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

            {/* Status indicators */}
            {isRandomShuffled && (
              <button
                type="button"
                onClick={handleToggleShuffle}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-full border border-purple-200 transition-colors cursor-pointer"
                title="클릭 시 원래 정렬로 즉시 복귀합니다"
              >
                <span>🎲 무작위 섞기 모드</span>
                <span className="text-[10px] text-purple-600 underline ml-0.5">복귀 ↩</span>
              </button>
            )}

            {/* 각 평가별 불러오기 탭 버튼 (Rating Quick Filter) */}
            <div
              id="rating-quick-filter-group"
              className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/90 shadow-2xs flex-wrap ml-1"
            >
              <span className="text-[11px] font-bold text-slate-500 pl-1.5 pr-0.5 hidden md:inline">
                평가별:
              </span>

              {/* 전체 */}
              <button
                type="button"
                id="btn-quick-filter-all"
                onClick={() => setFilter((prev) => ({ ...prev, rating: 'ALL' }))}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  filter.rating === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="전체 기업 목록을 불러옵니다"
              >
                전체
              </button>

              {/* S 무기한 보유 */}
              <button
                type="button"
                id="btn-quick-filter-s"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    rating: prev.rating === 'S' ? 'ALL' : 'S',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  filter.rating === 'S'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-purple-50/80 text-purple-700 hover:bg-purple-100 border-purple-200/80'
                }`}
                title="S등급(무기한 보유) 기업만 불러옵니다 (클릭 시 토글)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                <span>S 무기한</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-black ${
                    filter.rating === 'S'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-200/80 text-purple-900'
                  }`}
                >
                  {gradeCounts.counts.S}
                </span>
              </button>

              {/* A 기한 보유 */}
              <button
                type="button"
                id="btn-quick-filter-a"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    rating: prev.rating === 'A' ? 'ALL' : 'A',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  filter.rating === 'A'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 border-emerald-200/80'
                }`}
                title="A등급(기한 보유) 기업만 불러옵니다 (클릭 시 토글)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>A 기한</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-black ${
                    filter.rating === 'A'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-200/80 text-emerald-900'
                  }`}
                >
                  {gradeCounts.counts.A}
                </span>
              </button>

              {/* B 관심 */}
              <button
                type="button"
                id="btn-quick-filter-b"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    rating: prev.rating === 'B' ? 'ALL' : 'B',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  filter.rating === 'B'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100 border-blue-200/80'
                }`}
                title="B등급(관심) 기업만 불러옵니다 (클릭 시 토글)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                <span>B 관심</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-black ${
                    filter.rating === 'B'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-200/80 text-blue-900'
                  }`}
                >
                  {gradeCounts.counts.B}
                </span>
              </button>

              {/* C 관망 */}
              <button
                type="button"
                id="btn-quick-filter-c"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    rating: prev.rating === 'C' ? 'ALL' : 'C',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  filter.rating === 'C'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/80 text-amber-700 hover:bg-amber-100 border-amber-200/80'
                }`}
                title="C등급(관망) 기업만 불러옵니다 (클릭 시 토글)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>C 관망</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-black ${
                    filter.rating === 'C'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-200/80 text-amber-900'
                  }`}
                >
                  {gradeCounts.counts.C}
                </span>
              </button>

              {/* F 매도/제외 */}
              <button
                type="button"
                id="btn-quick-filter-f"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    rating: prev.rating === 'F' ? 'ALL' : 'F',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  filter.rating === 'F'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-rose-50/80 text-rose-700 hover:bg-rose-100 border-rose-200/80'
                }`}
                title="F등급(매도/제외) 기업만 불러옵니다 (클릭 시 토글)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                <span>F 매도</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-black ${
                    filter.rating === 'F'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-200/80 text-rose-900'
                  }`}
                >
                  {gradeCounts.counts.F}
                </span>
              </button>

              {/* 미평가만 */}
              <button
                type="button"
                id="btn-quick-filter-unrated"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    rating: prev.rating === 'UNRATED' ? 'ALL' : 'UNRATED',
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  filter.rating === 'UNRATED'
                    ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
                title="아직 평가하지 않은 미평가 기업만 불러옵니다 (클릭 시 토글)"
              >
                <span>미평가</span>
                <span
                  className={`text-[10px] px-1 rounded-full font-black ${
                    filter.rating === 'UNRATED'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {gradeCounts.unrated}
                </span>
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isRandomShuffled ? (
              <span className="font-bold text-purple-700">무작위 순서 (정렬 해제됨)</span>
            ) : (
              <>
                정렬:{' '}
                {sortField === 'watchlist'
                  ? '관심순'
                  : sortField === 'sector'
                  ? '업종별'
                  : sortField === 'name'
                  ? '종목명순'
                  : sortField === 'code'
                  ? '종목코드순'
                  : sortField === 'rating'
                  ? '내 평점순'
                  : sortField === 'marketCap'
                  ? sortDirection === 'desc'
                    ? '시가총액 높은순(내림차순)'
                    : '시가총액 낮은순(오름차순)'
                  : '시장구분순'}{' '}
                ({sortDirection === 'asc' ? '오름차순' : '내림차순'})
              </>
            )}
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
          onSortChange={handleSortChange}
          watchlist={watchlist}
          folders={folders}
          onToggleStar={handleToggleStar}
          onChangeCompanyFolder={handleChangeCompanyFolder}
          activeViewTab={activeViewTab}
          onSwitchToAllTab={() => setActiveViewTab('ALL')}
          isRandomShuffled={isRandomShuffled}
          onToggleShuffle={handleToggleShuffle}
          pushRatedToBottom={pushRatedToBottom}
          onTogglePushRatedToBottom={() => setPushRatedToBottom((prev) => !prev)}
          activeRatingFilter={filter.rating}
          onSelectRatingFilter={(grade) => setFilter((prev) => ({ ...prev, rating: grade }))}
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
