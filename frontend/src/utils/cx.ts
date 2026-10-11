export function cx(...classes: Array<string | number | false | null | undefined>): string {
  return classes.filter((value): value is string | number => value !== false && value !== null && value !== undefined && value !== '').join(' ');
}
