function reverseTwo(str: string): string {
  if (str.length !== 2) throw new Error('Must be exactly 2 characters');
  return str[1] + str[0];
}

export function getExpectedPin(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  return reverseTwo(month) + reverseTwo(day) + reverseTwo(hour);
}

export function validatePin(enteredPin: string): boolean {
  return enteredPin === getExpectedPin();
}
