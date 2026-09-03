import React, { useState, useEffect } from 'react';
import { Company, CompanyEvaluation, RatingGrade, SortDirection, SortField } from '../types';
import { getFnGuideUrl } from '../data/krxCompanies';
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
} from 'lucide-react';

interface CompanyTableProps {
  companies: Company[];
  evaluations: Record<string, CompanyEvaluation>;
  onRate: (code: string, grade: RatingGrade | null) => void;
  onUpdateMemo: (code: string, memo: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
}

export const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  evaluations,
  onRate,
  onUpdateMemo,
  sortField,
  sortDirection,
  onSortChange,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeMemoCode, setActiveMemoCode] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const handleOpenFnGuide = (company: Company) => {
    const url = getFnGuideUrl(company.code);
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
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900 font-bold" />
    );
  };

  if (companies.length === 0) {
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

  return (
    <div id="companies-table-container" className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      {/* Desktop & Tablet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-500 tracking-wider">
              <th
                id="th-company-code"
                className="py-3 px-4 w-[110px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('code')}
              >
                <div className="flex items-center gap-1.5">
                  <span>종목코드</span>
                  {renderSortIndicator('code')}
                </div>
              </th>

              <th
                id="th-company-name"
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>기업명</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              <th
                id="th-company-market"
                className="py-3 px-3 w-[90px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('market')}
              >
                <div className="flex items-center gap-1.5">
                  <span>시장</span>
                  {renderSortIndicator('market')}
                </div>
              </th>

              <th
                id="th-company-sector"
                className="py-3 px-4 w-[150px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('sector')}
              >
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <span>업종 (소팅)</span>
                  {renderSortIndicator('sector')}
                </div>
              </th>

              <th id="th-company-guide" className="py-3 px-4 w-[130px] text-center">
                FnGuide 분석
              </th>

              <th
                id="th-company-rating"
                className="py-3 px-4 w-[210px] cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => onSortChange('rating')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>내 평가 (S/A/B/F)</span>
                  {renderSortIndicator('rating')}
                </div>
              </th>

              <th id="th-company-memo" className="py-3 px-3 w-[70px] text-center">
                메모
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {displayedCompanies.map((company) => {
              const evalData = evaluations[company.code];
              const currentGrade = evalData?.grade;
              const hasMemo = Boolean(evalData?.memo && evalData.memo.trim().length > 0);
              const fnGuideUrl = getFnGuideUrl(company.code);

              return (
                <tr
                  key={company.code}
                  id={`company-row-${company.code}`}
                  onClick={() => handleOpenFnGuide(company)}
                  className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                  title="클릭하여 FnGuide 기업분석 페이지 열기"
                >
                  {/* Stock Code */}
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
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

                  {/* Company Name & Description */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-[15px]">
                          {company.name}
                        </span>
                        {company.isCustom && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                            사용자추가
                          </span>
                        )}
                      </div>
                      {company.description && (
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {company.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Market (KOSPI/KOSDAQ) */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                        company.market === 'KOSPI'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      }`}
                    >
                      {company.market}
                    </span>
                  </td>

                  {/* Sector */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800">{company.sector}</span>
                      {company.subSector && (
                        <span className="text-[11px] text-slate-400">{company.subSector}</span>
                      )}
                    </div>
                  </td>

                  {/* FnGuide Link Action Button */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <a
                      id={`link-fnguide-${company.code}`}
                      href={fnGuideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 rounded-md transition-colors"
                      title="새 탭에서 FnGuide 기업분석 열기"
                    >
                      <span>FnGuide</span>
                      <ExternalLink className="w-3 h-3 text-blue-500" />
                    </a>
                  </td>

                  {/* Ratings (A, B, C, F) */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <RatingSelector
                      currentGrade={currentGrade}
                      onChange={(newGrade) => onRate(company.code, newGrade)}
                      code={company.code}
                    />
                  </td>

                  {/* Quick Memo */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      id={`btn-memo-${company.code}`}
                      onClick={(e) => openMemoEditor(e, company.code)}
                      title={hasMemo ? `메모: ${evalData?.memo}` : '메모 추가'}
                      className={`p-1.5 rounded-lg border transition-all ${
                        hasMemo
                          ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                          : 'bg-transparent text-slate-300 border-transparent hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
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

            <div className="mt-4 flex items-center justify-between">
              {evaluations[activeMemoCode]?.grade && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">현재 평점:</span>
                  <RatingBadge grade={evaluations[activeMemoCode]?.grade} size="sm" showLabel />
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setActiveMemoCode(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  닫기
                </button>
                <button
                  id="btn-save-memo"
                  type="button"
                  onClick={() => saveMemo(activeMemoCode)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  메모 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
