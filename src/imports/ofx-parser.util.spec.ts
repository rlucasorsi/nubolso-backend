import { parseOfx } from './ofx-parser.util';

function buildOfx(body: string): string {
  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNRS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>1234567-8
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
${body}
</BANKTRANLIST>
</STMTRS>
</TRNRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;
}

describe('parseOfx', () => {
  it('extrai BANKID/ACCTID e transações com tags não fechadas (formato comum em bancos BR)', () => {
    const ofx = buildOfx(`<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240110
<TRNAMT>-150.00
<FITID>20240110001
<MEMO>Pagamento de conta de luz
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20240112
<TRNAMT>2500.00
<FITID>20240112001
<MEMO>Depósito salário
</STMTTRN>`);

    const result = parseOfx(Buffer.from(ofx, 'latin1'));

    expect(result.bankId).toBe('001');
    expect(result.acctId).toBe('1234567-8');
    expect(result.transactions).toHaveLength(2);

    const [debit, credit] = result.transactions;
    expect(debit.type).toBe('EXPENSE');
    expect(debit.amount).toBe(150);
    expect(debit.fitId).toBe('20240110001');
    expect(debit.description).toBe('Pagamento de conta de luz');
    expect(debit.date.toISOString().slice(0, 10)).toBe('2024-01-10');

    expect(credit.type).toBe('INCOME');
    expect(credit.amount).toBe(2500);
    expect(credit.description).toBe('Depósito salário');
  });

  it('decodifica corretamente acentos quando o arquivo é ISO-8859-1/Windows-1252', () => {
    const ofx = buildOfx(`<STMTTRN>
<DTPOSTED>20240101
<TRNAMT>-10.00
<FITID>1
<MEMO>Pagamento não programado
</STMTTRN>`);

    const result = parseOfx(Buffer.from(ofx, 'latin1'));

    expect(result.transactions[0].description).toBe('Pagamento não programado');
  });

  it('isola erros por transação em vez de falhar o arquivo todo', () => {
    const ofx = buildOfx(`<STMTTRN>
<DTPOSTED>20240101
<TRNAMT>-10.00
<FITID>1
<MEMO>Transação válida
</STMTTRN>
<STMTTRN>
<DTPOSTED>data-invalida
<TRNAMT>-20.00
<FITID>2
<MEMO>Transação com data quebrada
</STMTTRN>`);

    const result = parseOfx(Buffer.from(ofx, 'latin1'));

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fitId).toBe('1');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Transação #2');
  });

  it('lança erro quando o arquivo não contém a tag <OFX>', () => {
    expect(() => parseOfx(Buffer.from('isto não é um OFX', 'utf8'))).toThrow();
  });
});
