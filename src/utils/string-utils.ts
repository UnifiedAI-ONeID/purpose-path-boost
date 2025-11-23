export function endsWith(str: string, suffix: string): boolean {
  return str.slice(-suffix.length) === suffix;
}
