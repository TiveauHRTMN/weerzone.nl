export type ISODate = string & { readonly __brand: "ISODate" };

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_IN_MS = 86_400_000;

export function isISODate(value: string): value is ISODate {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
export function toISODate(value: string): ISODate {
  if (!isISODate(value)) throw new RangeError(`Ongeldige ISO-datum: ${value}`);
  return value;
}

export function isoDateFromDate(value: Date): ISODate {
  return toISODate(value.toISOString().slice(0, 10));
}

function epochDay(value: ISODate): number {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

export function compareISODates(left: ISODate, right: ISODate): -1 | 0 | 1 {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function differenceInCalendarDays(later: ISODate, earlier: ISODate): number {
  return epochDay(later) - epochDay(earlier);
}

export interface DateInterval {
  arrivalDate: ISODate;
  departureDate: ISODate;
}

export function isValidTravelInterval(interval: DateInterval): boolean {
  return compareISODates(interval.arrivalDate, interval.departureDate) < 0;
}

/** Travel stops use half-open intervals: checkout and the next check-in may share a date. */
export function intervalsOverlap(left: DateInterval, right: DateInterval): boolean {
  return left.arrivalDate < right.departureDate && right.arrivalDate < left.departureDate;
}

export function intervalContains(outer: DateInterval, inner: DateInterval): boolean {
  return outer.arrivalDate <= inner.arrivalDate && inner.departureDate <= outer.departureDate;
}
