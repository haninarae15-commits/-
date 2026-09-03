import React, { useRef, useState } from 'react';
import { Company, CompanyEvaluation, WatchlistEntry, WatchlistFolder } from '../types';
import { Download, Upload, Check, AlertCircle, FileSpreadsheet, X } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  evaluations: Record<string, CompanyEvaluation>;
  watchlist: Record<string, WatchlistEntry>;
  watchlistFolders: WatchlistFolder[];
  onImportData: (
    importedCompanies: Company[],
    importedEvaluations: Record<string, CompanyEvaluation>,
    importedWatchlist?: Record<string, WatchlistEntry>,
    importedFolders?: WatchlistFolder[]
  ) => void;
  onResetEvaluations: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  companies,
  evaluations,
  watchlist,
  watchlistFolders,
  onImportData,
  onResetEvaluations,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const folderMap = new Map<string, string>(watchlistFolders.map((f) => [f.id, f.name]));

  // Export as JSON
  const handleExportJSON = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      customCompanies: companies.filter((c) => c.isCustom),
      evaluations,
      watchlist,
      watchlistFolders,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `KRX_Evaluation_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export as CSV
  const handleExportCSV = () => {
    const headers = [
      '종목코드',
      '기업명',
      '시장',
      '업종',
      '세부업종',
      '관심기업(별표)',
      '관심폴더',
      '내평점',
      '메모',
      '평가일시',
    ];
    const rows = companies.map((c) => {
      const ev = evaluations[c.code];
      const watch = watchlist[c.code];
      const folderName: string = watch ? folderMap.get(watch.folderId) || '기본 관심종목' : '';

      return [
        `="${c.code}"`, // quote for excel to keep 005930 leading zero
        `"${c.name.replace(/"/g, '""')}"`,
        c.market,
        `"${c.sector}"`,
        `"${c.subSector || ''}"`,
        watch ? 'Y' : 'N',
        `"${folderName.replace(/"/g, '""')}"`,
        ev?.grade || '',
        `"${(ev?.memo || '').replace(/"/g, '""')}"`,
        ev?.updatedAt || '',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KRX_Stock_Evaluations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.evaluations && !parsed.watchlist) {
          throw new Error('올바른 백업 파일 형식이 아닙니다.');
        }

        const customComps: Company[] = Array.isArray(parsed.customCompanies) ? parsed.customCompanies : [];
        const evals: Record<string, CompanyEvaluation> = parsed.evaluations || {};
        const watch: Record<string, WatchlistEntry> = parsed.watchlist || {};
        const folders: WatchlistFolder[] | undefined = Array.isArray(parsed.watchlistFolders)
          ? parsed.watchlistFolders
          : undefined;

        onImportData(customComps, evals, watch, folders);
        setImportStatus({
          success: true,
          message: `성공적으로 데이터를 복원했습니다! (평가 ${Object.keys(evals).length}개, 관심기업 ${
            Object.keys(watch).length
          }개)`,
        });
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: err.message || 'JSON 파일 파싱 실패',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="data-mgmt-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="data-mgmt-modal-card"
        className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">데이터 백업 및 내보내기</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {importStatus && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {importStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-bold text-slate-800 mb-1">엑셀(CSV) 다운로드</div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              전체 종목 및 내가 매긴 S/A/B/F 평점, 메모를 엑셀 호환 CSV 파일로 저장합니다.
            </p>
            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCSV}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              CSV 엑셀 파일로 내보내기
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-bold text-slate-800 mb-1">JSON 백업 파일 내보내기</div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              사용자 추가 종목 및 전체 평가 데이터를 JSON 형태로 안전하게 백업합니다.
            </p>
            <button
              id="btn-export-json"
              type="button"
              onClick={handleExportJSON}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-blue-600" />
              JSON 백업 파일 저장
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-bold text-slate-800 mb-1">백업 파일 복원하기</div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              이전에 백업한 JSON 파일을 업로드하여 평가 데이터를 복원합니다.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              id="btn-import-json"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              JSON 파일 업로드 및 복원
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            id="btn-reset-evaluations"
            type="button"
            onClick={() => {
              if (window.confirm('정말 모든 평가 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                onResetEvaluations();
                onClose();
              }
            }}
            className="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
          >
            평가 데이터 전체 초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
