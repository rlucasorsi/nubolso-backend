import { findFuzzyMatch, textSimilarity } from './fuzzy-match.util';

describe('findFuzzyMatch', () => {
  const candidates = [
    {
      id: 'manual-1',
      amount: 150,
      date: new Date('2024-01-10T00:00:00Z'),
      description: 'Conta de luz',
    },
    {
      id: 'manual-2',
      amount: 89.9,
      date: new Date('2024-01-20T00:00:00Z'),
      description: 'Internet',
    },
  ];

  it('encontra candidato com valor exato e data dentro da janela de ±2 dias', () => {
    const match = findFuzzyMatch(
      {
        amount: 150,
        date: new Date('2024-01-11T00:00:00Z'),
        description: 'Pagamento conta de luz',
      },
      candidates,
    );

    expect(match?.id).toBe('manual-1');
    expect(match?.similarityScore).toBeGreaterThan(0);
  });

  it('não casa quando o valor é diferente, mesmo com data igual', () => {
    const match = findFuzzyMatch(
      {
        amount: 150.5,
        date: new Date('2024-01-10T00:00:00Z'),
        description: 'Conta de luz',
      },
      candidates,
    );

    expect(match).toBeNull();
  });

  it('não casa quando a diferença de data excede a janela de tolerância', () => {
    const match = findFuzzyMatch(
      {
        amount: 150,
        date: new Date('2024-01-14T00:00:00Z'),
        description: 'Conta de luz',
      },
      candidates,
    );

    expect(match).toBeNull();
  });

  it('nunca decide automaticamente: apenas retorna o melhor candidato para revisão', () => {
    const match = findFuzzyMatch(
      {
        amount: 89.9,
        date: new Date('2024-01-19T00:00:00Z'),
        description: 'Pagamento internet',
      },
      candidates,
    );

    expect(match?.id).toBe('manual-2');
  });
});

describe('textSimilarity', () => {
  it('retorna 1 para strings idênticas', () => {
    expect(textSimilarity('Conta de luz', 'conta de luz')).toBe(1);
  });

  it('retorna 0 quando uma das strings está vazia', () => {
    expect(textSimilarity('Conta de luz', '')).toBe(0);
  });

  it('retorna um valor intermediário para strings parecidas', () => {
    const score = textSimilarity('Pagamento de conta de luz', 'Conta de luz');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});
