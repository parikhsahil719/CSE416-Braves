import orGingles from '../../mock-data/v1/gingles-scatter/OR_2024_latino.json';
import scGingles from '../../mock-data/v1/gingles-scatter/SC_2024_black.json';
import orEnsembleSplits from '../../mock-data/v1/ensemble-splits/OR_compare.json';
import scEnsembleSplits from '../../mock-data/v1/ensemble-splits/SC_compare.json';
import orEiSupport from '../../mock-data/v1/ei-support/OR_2024_president.json';
import scEiSupport from '../../mock-data/v1/ei-support/SC_2024_president.json';
import orBoxWhisker from '../../mock-data/v1/box-whisker/OR_latino_cvap.json';
import scBoxWhisker from '../../mock-data/v1/box-whisker/SC_black_cvap.json';

const stateMap = {
  oregon: 'OR',
  or: 'OR',
  'south carolina': 'SC',
  southcarolina: 'SC',
  sc: 'SC',
};

function normalizeState(state) {
  if (!state) return null;
  return stateMap[String(state).trim().toLowerCase()] ?? null;
}

const payloads = {
  OR: {
    gingles: orGingles,
    ensembleSplits: orEnsembleSplits,
    eiSupport: orEiSupport,
    boxWhisker: orBoxWhisker,
  },
  SC: {
    gingles: scGingles,
    ensembleSplits: scEnsembleSplits,
    eiSupport: scEiSupport,
    boxWhisker: scBoxWhisker,
  },
};

function getPayload(state, key) {
  const normalized = normalizeState(state);
  if (!normalized) {
    throw new Error(`Unsupported state: ${state}`);
  }
  return payloads[normalized][key];
}

export function getGinglesPayload(state) {
  return getPayload(state, 'gingles');
}

export function getEnsembleSplitsPayload(state) {
  return getPayload(state, 'ensembleSplits');
}

export function getEiSupportPayload(state) {
  return getPayload(state, 'eiSupport');
}

export function getBoxWhiskerPayload(state) {
  return getPayload(state, 'boxWhisker');
}
