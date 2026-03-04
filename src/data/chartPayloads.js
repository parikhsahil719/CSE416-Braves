import orGingles from '../../mock-data/v1/gingles-scatter/OR_2024_latino.json';
import scGingles from '../../mock-data/v1/gingles-scatter/SC_2024_black.json';
import orEnsembleSplits from '../../mock-data/v1/ensemble-splits/OR_compare.json';
import scEnsembleSplits from '../../mock-data/v1/ensemble-splits/SC_compare.json';
import orEiSupport from '../../mock-data/v1/ei-support/OR_2024_president.json';
import scEiSupport from '../../mock-data/v1/ei-support/SC_2024_president.json';
import orBoxWhiskerVra from '../../mock-data/v1/box-whisker/OR_latino_cvap_vra.json';
import orBoxWhiskerRaceBlind from '../../mock-data/v1/box-whisker/OR_latino_cvap_race_blind.json';
import scBoxWhiskerVra from '../../mock-data/v1/box-whisker/SC_black_cvap_vra.json';
import scBoxWhiskerRaceBlind from '../../mock-data/v1/box-whisker/SC_black_cvap_race_blind.json';

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
    boxWhiskers: {
      vraConstrained: orBoxWhiskerVra,
      raceBlind: orBoxWhiskerRaceBlind,
    },
  },
  SC: {
    gingles: scGingles,
    ensembleSplits: scEnsembleSplits,
    eiSupport: scEiSupport,
    boxWhiskers: {
      vraConstrained: scBoxWhiskerVra,
      raceBlind: scBoxWhiskerRaceBlind,
    },
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

export function getBoxWhiskerPayloads(state) {
  return getPayload(state, 'boxWhiskers');
}

export function getBoxWhiskerPayload(state) {
  return getBoxWhiskerPayloads(state).vraConstrained;
}
