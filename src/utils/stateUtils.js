// Shared state-level helpers used across multiple components.

export function toStateCode(stateName) {
  if (stateName === 'Oregon') return 'OR';
  if (stateName === 'South Carolina') return 'SC';
  return null;
}

const GROUP_KEY_MAP = { Latino: 'latino', Asian: 'asian', Black: 'black', White: 'white' };

export function toGroupKey(minority) {
  return GROUP_KEY_MAP[minority] ?? (minority ? minority.toLowerCase() : null);
}

export function defaultGroup(stateCode) {
  return stateCode === 'OR' ? 'Latino' : 'Black';
}

export function groupOptionsForState(stateName) {
  return stateName === 'Oregon' ? ['Latino'] : ['Black', 'Latino'];
}
