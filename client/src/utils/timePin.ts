// client/src/utils/timePin.ts

/**
 * Reverses a 2-character string.
 */
function reverseTwo(str: string): string {
  if (str.length !== 2) throw new Error('Input must be 2 characters');
  return str[1] + str[0];
}

/**
 * Swaps the two 2-digit blocks of a 4-digit year string.
 * Example: "2026" → "2620"
 */
function swapYearBlocks(yearStr: string): string {
  if (yearStr.length !== 4) throw new Error('Year must be 4 digits');
  return yearStr.slice(2) + yearStr.slice(0, 2);
}

/**
 * Generates the expected PIN for a given date (defaults to current time).
 * This is used ONLY for validation. You (admin) will generate the PIN externally.
 */
export function getExpectedPin(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const year = String(date.getFullYear());

  return reverseTwo(month) + reverseTwo(day) + reverseTwo(hour) + swapYearBlocks(year);
}

/**
 * Validates the entered PIN against the expected value for the current time.
 */
export function validateTimePin(enteredPin: string): boolean {
  const expected = getExpectedPin();
  return enteredPin === expected;
}
