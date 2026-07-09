// Ported from the frontend's getPeriodForDate (nubolso-frontend/src/lib/cashflow.ts),
// stripped of the display label — the backend only needs the date range to sum
// transactions per user cycle. Keep both in sync if the cycle rule changes.
export function getPeriodForDate(
  dateStr: string,
  startDay: number = 1,
): { startDate: string; endDate: string } {
  const [y, m, d] = dateStr.split('-').map(Number);

  const getClampedDate = (year: number, month: number, targetDay: number) => {
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(targetDay, lastDay);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  if (startDay === 1) {
    const lastDay = new Date(y, m, 0).getDate();
    return {
      startDate: `${y}-${String(m).padStart(2, '0')}-01`,
      endDate: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  const currentMonthLastDay = new Date(y, m, 0).getDate();
  const effectiveStartDay = Math.min(startDay, currentMonthLastDay);

  if (d >= effectiveStartDay) {
    const m2 = m === 12 ? 1 : m + 1;
    const y2 = m === 12 ? y + 1 : y;
    return {
      startDate: getClampedDate(y, m, startDay),
      endDate: getClampedDate(y2, m2, startDay - 1),
    };
  }

  const m0 = m === 1 ? 12 : m - 1;
  const y0 = m === 1 ? y - 1 : y;
  return {
    startDate: getClampedDate(y0, m0, startDay),
    endDate: getClampedDate(y, m, startDay - 1),
  };
}
