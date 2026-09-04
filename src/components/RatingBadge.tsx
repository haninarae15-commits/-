import React from 'react';
import { RatingGrade } from '../types';

interface RatingBadgeProps {
  grade: RatingGrade | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const GRADE_CONFIG: Record<
  RatingGrade,
  { label: string; text: string; bg: string; border: string; desc: string }
> = {
  S: {
    label: 'S 등급',
    text: 'text-purple-700',
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-300',
    desc: '무기한 보유',
  },
  A: {
    label: 'A 등급',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-300',
    desc: '기한 보유',
  },
  B: {
    label: 'B 등급',
    text: 'text-blue-700',
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-300',
    desc: '관망',
  },
  F: {
    label: 'F 등급',
    text: 'text-rose-700',
    bg: 'bg-rose-50 hover:bg-rose-100',
    border: 'border-rose-300',
    desc: '매도 / 제외',
  },
};

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  grade,
  size = 'md',
  showLabel = false,
}) => {
  if (!grade) {
    return (
      <span
        id={`rating-badge-unrated-${size}`}
        className="inline-flex items-center justify-center font-medium rounded-md px-2 py-0.5 text-xs text-slate-400 bg-slate-100 border border-slate-200"
      >
        미평가
      </span>
    );
  }

  const config = GRADE_CONFIG[grade];
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs font-bold',
    md: 'w-7 h-7 text-sm font-black',
    lg: 'w-9 h-9 text-base font-black',
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        id={`rating-badge-${grade}`}
        title={`${config.label} (${config.desc})`}
        className={`inline-flex items-center justify-center rounded-lg border shadow-xs transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      >
        {grade}
      </span>
      {showLabel && (
        <span className={`text-xs font-medium ${config.text}`}>
          {config.desc}
        </span>
      )}
    </div>
  );
};

interface RatingSelectorProps {
  currentGrade: RatingGrade | null | undefined;
  onChange: (grade: RatingGrade | null) => void;
  code: string;
}

export const RatingSelector: React.FC<RatingSelectorProps> = ({
  currentGrade,
  onChange,
  code,
}) => {
  const grades: RatingGrade[] = ['S', 'A', 'B', 'F'];

  return (
    <div
      id={`rating-selector-group-${code}`}
      className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200"
      role="group"
      aria-label="종목 평가 선택"
    >
      {grades.map((g) => {
        const isSelected = currentGrade === g;
        const config = GRADE_CONFIG[g];

        return (
          <button
            key={g}
            id={`btn-rate-${code}-${g}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(isSelected ? null : g);
            }}
            title={`${g} 등급 (${config.desc})${isSelected ? ' - 클릭하여 평가 취소' : ''}`}
            className={`w-7 h-7 text-xs font-bold rounded-md transition-all duration-150 flex items-center justify-center ${
              isSelected
                ? `${config.bg} ${config.text} ${config.border} border-2 shadow-xs scale-105 font-black ring-1 ring-slate-400/20`
                : 'text-slate-600 hover:text-slate-900 hover:bg-white bg-transparent border border-transparent'
            }`}
          >
            {g}
          </button>
        );
      })}
      {currentGrade && (
        <button
          id={`btn-clear-rate-${code}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
          title="평가 취소"
          className="px-1 text-[11px] text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
        >
          ✕
        </button>
      )}
    </div>
  );
};
