export interface ParsedOfxTransaction {
  fitId: string | null;
  date: Date;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
}

export interface ParsedOfx {
  bankId: string | null;
  acctId: string | null;
  transactions: ParsedOfxTransaction[];
  errors: string[];
}

const STMTTRN_BLOCK = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
const ACCTFROM_BLOCK = /<(BANKACCTFROM|CCACCTFROM)>([\s\S]*?)<\/\1>/i;

function decodeOfxBuffer(buffer: Buffer): string {
  const headerSample = buffer.subarray(0, 512).toString('ascii');
  const declared = (
    headerSample.match(/CHARSET:\s*([\w-]+)/i)?.[1] ??
    headerSample.match(/ENCODING:\s*([\w-]+)/i)?.[1] ??
    ''
  ).toUpperCase();

  if (declared.includes('UTF')) {
    return buffer.toString('utf8');
  }

  // Bancos brasileiros tipicamente exportam em ISO-8859-1/Windows-1252.
  // Sem declaração confiável, tentamos UTF-8 e caímos para latin1 se inválido.
  const utf8Text = buffer.toString('utf8');
  if (utf8Text.includes('�')) {
    return buffer.toString('latin1');
  }
  return utf8Text;
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, 'i'));
  const value = match?.[1]?.trim();
  return value ? value : null;
}

function parseOfxDate(raw: string): Date | null {
  const digits = raw.match(/^(\d{8,14})/)?.[1];
  if (!digits) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const hour = digits.length >= 10 ? Number(digits.slice(8, 10)) : 0;
  const minute = digits.length >= 12 ? Number(digits.slice(10, 12)) : 0;
  const second = digits.length >= 14 ? Number(digits.slice(12, 14)) : 0;

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOfxAmount(raw: string): number | null {
  // TRNAMT deveria sempre usar '.' como separador decimal, mas alguns bancos
  // BR exportam no formato monetário local (ex: "1.234,56").
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  const normalized =
    hasComma && hasDot
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.');

  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

export function parseOfx(buffer: Buffer): ParsedOfx {
  const text = decodeOfxBuffer(buffer);

  if (!/<OFX>/i.test(text)) {
    throw new Error('Arquivo OFX inválido: tag <OFX> não encontrada');
  }

  const acctMatch = text.match(ACCTFROM_BLOCK);
  const acctBlock = acctMatch?.[2] ?? '';
  const bankId = extractTag(acctBlock, 'BANKID');
  const acctId = extractTag(acctBlock, 'ACCTID');

  const transactions: ParsedOfxTransaction[] = [];
  const errors: string[] = [];

  let match: RegExpExecArray | null;
  let index = 0;
  STMTTRN_BLOCK.lastIndex = 0;
  while ((match = STMTTRN_BLOCK.exec(text)) !== null) {
    index++;
    const block = match[1];
    try {
      const fitId = extractTag(block, 'FITID');
      const dtPosted = extractTag(block, 'DTPOSTED');
      const trnAmt = extractTag(block, 'TRNAMT');

      if (!dtPosted) throw new Error('DTPOSTED ausente');
      if (!trnAmt) throw new Error('TRNAMT ausente');

      const date = parseOfxDate(dtPosted);
      if (!date) throw new Error(`DTPOSTED inválido: ${dtPosted}`);

      const amount = parseOfxAmount(trnAmt);
      if (amount === null) throw new Error(`TRNAMT inválido: ${trnAmt}`);

      const description =
        extractTag(block, 'NAME') ??
        extractTag(block, 'MEMO') ??
        'Transação importada';

      transactions.push({
        fitId,
        date,
        amount: Math.abs(amount),
        type: amount < 0 ? 'EXPENSE' : 'INCOME',
        description,
      });
    } catch (err) {
      errors.push(`Transação #${index}: ${(err as Error).message}`);
    }
  }

  return { bankId, acctId, transactions, errors };
}
