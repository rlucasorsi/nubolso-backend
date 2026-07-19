import { Injectable, Logger } from '@nestjs/common';

export interface InvestmentQuoteResult {
  ticker: string;
  price: number | null;
  previousClose: number | null;
  currency: string | null;
  asOf: string;
  available: boolean;
}

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{ meta?: YahooChartMeta }>;
  };
}

export interface InvestmentTickerSearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
}

interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
}

const TTL_MS = 5 * 60 * 1000;
const SEARCH_TTL_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

// Cotação via endpoint não-oficial e gratuito do Yahoo Finance. Sem SLA - pode
// mudar de formato ou ficar indisponível a qualquer momento, então esse
// serviço nunca lança: qualquer falha vira { available: false }, sem quebrar
// o resto da aplicação.
@Injectable()
export class InvestmentsQuoteService {
  private readonly logger = new Logger(InvestmentsQuoteService.name);
  private readonly cache = new Map<
    string,
    { data: InvestmentQuoteResult; expiresAt: number }
  >();
  private readonly searchCache = new Map<
    string,
    { data: InvestmentTickerSearchResult[]; expiresAt: number }
  >();

  async getQuote(rawTicker: string): Promise<InvestmentQuoteResult> {
    const ticker = rawTicker.trim().toUpperCase();

    const cached = this.cache.get(ticker);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const symbol = ticker.endsWith('.SA') ? ticker : `${ticker}.SA`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);

      const json = (await res.json()) as YahooChartResponse;
      const meta = json.chart?.result?.[0]?.meta;
      if (!meta || typeof meta.regularMarketPrice !== 'number') {
        throw new Error('formato de resposta inesperado');
      }

      const result: InvestmentQuoteResult = {
        ticker,
        price: meta.regularMarketPrice,
        previousClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
        currency: meta.currency ?? 'BRL',
        asOf: new Date().toISOString(),
        available: true,
      };
      this.cache.set(ticker, { data: result, expiresAt: Date.now() + TTL_MS });
      return result;
    } catch (err) {
      this.logger.warn(
        `Falha ao buscar cotação de ${ticker}: ${(err as Error).message}`,
      );
      return {
        ticker,
        price: null,
        previousClose: null,
        currency: null,
        asOf: new Date().toISOString(),
        available: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // Autocomplete de ticker via busca não-oficial e gratuita do Yahoo Finance.
  // Filtra só ações/FIIs/ETFs listados na B3 (.SA). Nunca lança - devolve
  // lista vazia em qualquer falha, pra não travar o formulário de criação.
  async searchTickers(
    rawQuery: string,
  ): Promise<InvestmentTickerSearchResult[]> {
    const query = rawQuery.trim();
    if (query.length < 1) return [];

    const cacheKey = query.toUpperCase();
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=pt-BR&region=BR&quotesCount=8&newsCount=0`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);

      const json = (await res.json()) as YahooSearchResponse;
      const results = (json.quotes ?? [])
        .filter((q) => !!q.symbol && q.symbol.endsWith('.SA'))
        .map((q) => ({
          symbol: q.symbol!.replace(/\.SA$/, ''),
          name: q.shortname ?? q.longname ?? q.symbol!,
          exchange: q.exchange ?? null,
        }));

      this.searchCache.set(cacheKey, {
        data: results,
        expiresAt: Date.now() + SEARCH_TTL_MS,
      });
      return results;
    } catch (err) {
      this.logger.warn(
        `Falha ao buscar tickers para "${query}": ${(err as Error).message}`,
      );
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
