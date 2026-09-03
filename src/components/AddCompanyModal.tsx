import React, { useState } from 'react';
import { Company, MarketType } from '../types';
import { AVAILABLE_SECTORS } from '../data/krxCompanies';
import { PlusCircle, X, AlertCircle } from 'lucide-react';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (company: Company) => void;
  existingCodes: Set<string>;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingCodes,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<MarketType>('KOSPI');
  const [sector, setSector] = useState(AVAILABLE_SECTORS[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      setError('종목코드와 기업명을 입력해주세요.');
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setError('종목코드는 6자리 숫자여야 합니다 (예: 005930).');
      return;
    }

    if (existingCodes.has(cleanCode)) {
      setError('이미 목록에 등록되어 있는 종목코드입니다.');
      return;
    }

    onAdd({
      code: cleanCode,
      name: cleanName,
      market,
      sector,
      description: description.trim() || undefined,
      isCustom: true,
    });

    // Reset and close
    setCode('');
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div
      id="add-company-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="add-company-modal-card"
        className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">상장 기업 직접 추가</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="input-new-code" className="block text-xs font-bold text-slate-700 mb-1">
              종목코드 (6자리 숫자) <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-new-code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="예: 005930"
              className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              네이버 금융 종목분석 링크와 연동되므로 정확한 6자리 코드를 입력해주세요.
            </p>
          </div>

          <div>
            <label htmlFor="input-new-name" className="block text-xs font-bold text-slate-700 mb-1">
              기업명 <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-new-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="예: 현대오토에버"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-new-market" className="block text-xs font-bold text-slate-700 mb-1">
                상장 시장
              </label>
              <select
                id="select-new-market"
                value={market}
                onChange={(e) => setMarket(e.target.value as MarketType)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="KOSPI">KOSPI</option>
                <option value="KOSDAQ">KOSDAQ</option>
                <option value="KONEX">KONEX</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-new-sector" className="block text-xs font-bold text-slate-700 mb-1">
                업종 분류
              </label>
              <select
                id="select-new-sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {AVAILABLE_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="input-new-desc" className="block text-xs font-bold text-slate-700 mb-1">
              주요 사업 및 설명 (선택)
            </label>
            <input
              id="input-new-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: IT 컨설팅, 차량 소프트웨어 플랫폼 개발"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              취소
            </button>
            <button
              id="btn-submit-add-company"
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              기업 추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
