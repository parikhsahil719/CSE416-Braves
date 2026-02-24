export const pct = (value, digits = 1) => `${(Number(value) * 100).toFixed(digits)}%`;
export const num = (value) => new Intl.NumberFormat('en-US').format(Number(value));
