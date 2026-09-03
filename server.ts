import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for live market caps and sync state
interface MarketCapItem {
  marketCap: number; // in 억
  marketCapText: string;
  price?: string;
  changeRate?: number;
  updatedAt?: string;
}

const marketCapCache: Record<string, MarketCapItem> = {};
let lastSyncedAt: string | null = null;
let isSyncing = false;
let syncProgress = 0;

// Load codes from krxCompanies.json
function getStockCodes(): string[] {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'krxCompanies.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (Array.isArray(data)) {
        // Initialize cache with existing marketCaps
        for (const item of data) {
          if (item.code && item.marketCap && !marketCapCache[item.code]) {
            marketCapCache[item.code] = {
              marketCap: item.marketCap,
              marketCapText: item.marketCapText || `${item.marketCap.toLocaleString()}억`,
            };
          }
        }
        return data.map((c: { code: string }) => c.code).filter(Boolean);
      }
    }
  } catch (err) {
    console.error('Failed to load stock codes from krxCompanies.json:', err);
  }
  return [];
}

const allStockCodes = getStockCodes();
console.log(`Loaded ${allStockCodes.length} KRX stock codes for market cap sync.`);

// Batch fetch from Naver Finance polling API
async function fetchNaverBatch(chunk: string[]): Promise<Record<string, MarketCapItem>> {
  const result: Record<string, MarketCapItem> = {};
  const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${chunk.join(',')}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`Naver fetch failed with status ${res.status}`);
      return result;
    }
    const json = (await res.json()) as { datas?: Array<Record<string, unknown>> };
    const items = json.datas || [];
    for (const item of items) {
      const code = String(item.itemCode || '');
      if (!code) continue;
      
      const rawVal = item.marketValueFullRaw
        ? Number(item.marketValueFullRaw)
        : item.marketValue
        ? Number(item.marketValue) * 100000000
        : 0;

      const capInEok = Math.round(rawVal / 100000000);
      const price = item.closePrice ? String(item.closePrice) : undefined;
      const changeRate = item.fluctuationsRatio !== undefined && item.fluctuationsRatio !== null
        ? Number(item.fluctuationsRatio)
        : undefined;

      if (capInEok > 0) {
        result[code] = {
          marketCap: capInEok,
          marketCapText: `${capInEok.toLocaleString()}억`,
          price,
          changeRate,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Error in fetchNaverBatch:', err);
  }
  return result;
}

// Background sync worker
async function performMarketCapSync(): Promise<number> {
  if (isSyncing) return 0;
  isSyncing = true;
  syncProgress = 0;

  const codes = allStockCodes.length > 0 ? allStockCodes : getStockCodes();
  const chunkSize = 80;
  const chunks: string[][] = [];
  for (let i = 0; i < codes.length; i += chunkSize) {
    chunks.push(codes.slice(i, i + chunkSize));
  }

  let updatedCount = 0;
  const totalChunks = chunks.length;

  try {
    for (let i = 0; i < totalChunks; i++) {
      const batchResult = await fetchNaverBatch(chunks[i]);
      for (const [code, info] of Object.entries(batchResult)) {
        marketCapCache[code] = info;
        updatedCount++;
      }
      syncProgress = Math.round(((i + 1) / totalChunks) * 100);
      // Small pause to be gentle
      if (i % 4 === 0 && i > 0) {
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    lastSyncedAt = new Date().toISOString();
    console.log(`Successfully synced market caps for ${updatedCount} KRX stocks at ${lastSyncedAt}`);
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    isSyncing = false;
    syncProgress = 100;
  }

  return updatedCount;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/market-cap/status', (req, res) => {
  res.json({
    lastSyncedAt: lastSyncedAt || new Date().toISOString(),
    totalCodes: allStockCodes.length,
    cachedCount: Object.keys(marketCapCache).length,
    isSyncing,
    syncProgress,
  });
});

app.get('/api/market-cap/latest', (req, res) => {
  res.json({
    success: true,
    lastSyncedAt: lastSyncedAt || new Date().toISOString(),
    count: Object.keys(marketCapCache).length,
    data: marketCapCache,
  });
});

// Trigger sync on demand
app.all('/api/market-cap/sync', async (req, res) => {
  if (isSyncing) {
    return res.json({
      success: true,
      message: '동기화가 이미 진행 중입니다.',
      isSyncing: true,
      syncProgress,
      lastSyncedAt,
      data: marketCapCache,
    });
  }

  try {
    const updatedCount = await performMarketCapSync();
    return res.json({
      success: true,
      message: '전 종목 시가총액 최신 동기화 완료',
      updatedCount,
      lastSyncedAt,
      data: marketCapCache,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: '시가총액 동기화 중 오류가 발생했습니다.',
    });
  }
});

async function startServer() {
  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
