import { Company } from '../types';
import rawCompanies from './krxCompanies.json';

export function getNaverFinanceUrl(code: string): string {
  const cleanCode = code.trim().padStart(6, '0');
  return `https://finance.naver.com/item/main.naver?code=${cleanCode}`;
}

export function getFnGuideUrl(code: string): string {
  const cleanCode = code.trim().padStart(6, '0');
  return `https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?pGB=1&gicode=A${cleanCode}&cID=AA&MenuYn=Y&ReportGB=&NewMenuID=101&stkGb=701`;
}

export const INITIAL_KRX_COMPANIES: Company[] = rawCompanies as Company[];

// Dynamically extract all unique sorted sectors from the comprehensive dataset
export const AVAILABLE_SECTORS: string[] = Array.from(
  new Set(INITIAL_KRX_COMPANIES.map((c) => c.sector).filter(Boolean))
).sort((a, b) => a.localeCompare(b, 'ko-KR'));
