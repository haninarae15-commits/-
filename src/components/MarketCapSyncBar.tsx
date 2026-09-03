import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { MarketCapSyncStatus } from '../types';

interface MarketCapSyncBarProps {
  status: MarketCapSyncStatus;
  totalCompanies: number;
  onSync: () => void;
}

export const MarketCapSyncBar: React.FC<MarketCapSyncBarProps> = ({
  status,
  totalCompanies,
  onSync,
}) => {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '동기화 필요';
    try {
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="marketcap-sync-bar"
      className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-emerald-50/60 border border-blue-200/70 rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Zap className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              시가총액 일일 변동 실시간 연동
            </span>
            <span className="text-[11px] bg-blue-100/80 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200/80">
              네이버 증권 시세 API
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              최종 시세 갱신: <strong className="text-slate-700 font-semibold">{formatTime(status.lastSyncedAt)}</strong>
            </span>
            <span>·</span>
            <span>대상: {totalCompanies.toLocaleString()}개사 전 종목</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {status.isSyncing ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-100/90 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>최신 시가총액 연동 중 ({status.progress}%)...</span>
          </div>
        ) : (
          <button
            id="btn-sync-marketcap"
            type="button"
            onClick={onSync}
            disabled={status.isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 text-xs font-bold rounded-lg border border-blue-300 shadow-2xs transition-all cursor-pointer hover:border-blue-400 active:scale-98"
            title="한국거래소 전 종목의 최신 시가총액 및 당일 등락률을 즉시 동기화합니다"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>최신 시세 동기화</span>
          </button>
        )}
      </div>
    </div>
  );
};
