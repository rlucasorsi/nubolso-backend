const MS_PER_DAY = 86_400_000;
const AMOUNT_EPSILON = 0.005;
const MAX_DAY_DIFF = 2;

export interface FuzzyMatchCandidate {
  id: string;
  amount: number;
  date: Date;
  description: string;
}

export interface FuzzyMatchResult {
  id: string;
  similarityScore: number;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0),
  );
  for (let j = 0; j < cols; j++) dist[0][j] = j;
  for (let i = 0; i < rows; i++) dist[i][0] = i;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost,
      );
    }
  }

  return dist[rows - 1][cols - 1];
}

export function textSimilarity(a: string, b: string): number {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (!normA && !normB) return 1;
  if (!normA || !normB) return 0;

  const maxLen = Math.max(normA.length, normB.length);
  return 1 - levenshtein(normA, normB) / maxLen;
}

/**
 * Encontra, entre candidatos sem FITID (lançamentos manuais), o melhor match
 * difuso para uma transação importada: valor exato + data dentro da janela
 * de tolerância. Nunca mescla automaticamente — apenas sinaliza o melhor
 * candidato para revisão humana.
 */
export function findFuzzyMatch(
  target: { amount: number; date: Date; description: string },
  candidates: FuzzyMatchCandidate[],
): FuzzyMatchResult | null {
  let best: FuzzyMatchResult | null = null;
  let bestDayDiff = Infinity;

  for (const candidate of candidates) {
    if (Math.abs(candidate.amount - target.amount) > AMOUNT_EPSILON) continue;

    const dayDiff =
      Math.abs(candidate.date.getTime() - target.date.getTime()) / MS_PER_DAY;
    if (dayDiff > MAX_DAY_DIFF) continue;

    if (dayDiff < bestDayDiff) {
      bestDayDiff = dayDiff;
      best = {
        id: candidate.id,
        similarityScore: textSimilarity(
          target.description,
          candidate.description,
        ),
      };
    }
  }

  return best;
}
