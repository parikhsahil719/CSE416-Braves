import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { keys } from '../lib/queryKeys.js';

const ELECTION = '2024_pres';

// Geometry endpoints are content-addressed via ETag; treat as immutable once loaded.
const TOPO = { staleTime: Infinity };

function get(url, params) {
  return axios.get(url, params ? { params } : undefined).then(r => r.data);
}

export function useServerMeta() {
  return useQuery({ queryKey: keys.meta(), queryFn: () => get('/api/meta') });
}

export function useUsStatesTopology() {
  return useQuery({ queryKey: keys.usStatesTopology(), queryFn: () => get('/api/maps/us-states/topology'), ...TOPO });
}

export function useStateSummary(stateCode) {
  return useQuery({
    queryKey: keys.stateSummary(stateCode),
    queryFn: () => get(`/api/states/${stateCode}/state-summary`),
    enabled: Boolean(stateCode),
  });
}

export function useEnsemblesSummary(stateCode) {
  return useQuery({
    queryKey: keys.ensemblesSummary(stateCode),
    queryFn: () => get(`/api/states/${stateCode}/ensembles-summary`),
    enabled: Boolean(stateCode),
  });
}

export function useDistrictTopology(stateCode) {
  return useQuery({
    queryKey: keys.districtTopology(stateCode),
    queryFn: () => get(`/api/states/${stateCode}/districts/enacted/topology`),
    enabled: Boolean(stateCode),
    ...TOPO,
  });
}

export function usePrecinctTopology(stateCode) {
  return useQuery({
    queryKey: keys.precinctTopology(stateCode),
    queryFn: () => get(`/api/states/${stateCode}/precincts/topology`),
    enabled: Boolean(stateCode),
    ...TOPO,
  });
}

export function useDistrictTable(stateCode, enabled = true) {
  return useQuery({
    queryKey: keys.districtTable(stateCode, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/districts/enacted/table`, { election: ELECTION }),
    enabled: Boolean(stateCode) && enabled,
  });
}

export function useHeatmap(stateCode, group) {
  return useQuery({
    queryKey: keys.heatmap(stateCode, group),
    queryFn: () => get(`/api/states/${stateCode}/heatmap/precincts`, { group }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useGingles(stateCode, group) {
  return useQuery({
    queryKey: keys.gingles(stateCode, group, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/gingles`, { group, election: ELECTION }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useGinglesTable(stateCode, group) {
  return useQuery({
    queryKey: keys.ginglesTable(stateCode, group, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/gingles/table`, { group, election: ELECTION }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useEiSupport(stateCode, group, party = 'DEM') {
  return useQuery({
    queryKey: keys.eiSupport(stateCode, group, ELECTION, party),
    queryFn: () => get(`/api/states/${stateCode}/analysis/ei-support`, { groups: group, election: ELECTION, party }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useEiPrecinctBarCi(stateCode, group, party = 'DEM') {
  return useQuery({
    queryKey: keys.eiPrecinctBarCi(stateCode, group, ELECTION, party),
    queryFn: () => get(`/api/states/${stateCode}/analysis/ei-precinct-bar-ci`, { group, election: ELECTION, party }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useEiKde(stateCode, group, party = 'DEM') {
  return useQuery({
    queryKey: keys.eiKde(stateCode, group, ELECTION, 'support_gap', party),
    queryFn: () => get(`/api/states/${stateCode}/analysis/ei-kde`, { group, election: ELECTION, metric: 'support_gap', party }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useEnsembleSplits(stateCode, size = 'final') {
  return useQuery({
    queryKey: keys.ensembleSplits(stateCode, size, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/ensembles/splits`, { ensembleSize: size, election: ELECTION }),
    enabled: Boolean(stateCode),
  });
}

export function useBoxWhisker(stateCode, group, ensembleType) {
  return useQuery({
    queryKey: keys.boxWhisker(stateCode, group, ensembleType, 'minority_share'),
    queryFn: () => get(`/api/states/${stateCode}/ensembles/box-whisker`, { group, ensembleType, metric: 'minority_share' }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useVraImpact(stateCode, group) {
  return useQuery({
    queryKey: keys.vraImpact(stateCode, group, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/vra-impact-thresholds`, { group, election: ELECTION }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

// Fetches race-blind box-and-whisker data for the given ensemble run (1–4).
// TanStack Query caches each (stateCode, ensembleIndex) pair independently,
// so switching ensembles serves from cache after the first load.
export function useMeBoxWhiskerRb(stateCode, ensembleIndex) {
  return useQuery({
    queryKey: keys.meBoxWhisker(stateCode, ELECTION, 'rb', ensembleIndex),
    queryFn: () => get(
      `/api/states/${stateCode}/analysis/minority-effectiveness/box-whisker`,
      { election: ELECTION, ensembleType: 'rb', ensembleIndex }
    ),
    enabled: Boolean(stateCode) && Boolean(ensembleIndex),
  });
}

// Fetches VRA-constrained box-and-whisker data for the given ensemble run (1–4).
export function useMeBoxWhiskerVra(stateCode, ensembleIndex) {
  return useQuery({
    queryKey: keys.meBoxWhisker(stateCode, ELECTION, 'vra', ensembleIndex),
    queryFn: () => get(
      `/api/states/${stateCode}/analysis/minority-effectiveness/box-whisker`,
      { election: ELECTION, ensembleType: 'vra', ensembleIndex }
    ),
    enabled: Boolean(stateCode) && Boolean(ensembleIndex),
  });
}

export function useMeHistogram(stateCode, group) {
  return useQuery({
    queryKey: keys.meHistogram(stateCode, group, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/minority-effectiveness/histogram`, { group, election: ELECTION }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useInterestingPlanList(stateCode) {
  return useQuery({
    queryKey: keys.interestingPlanList(stateCode),
    queryFn: () => get(`/api/states/${stateCode}/districts/interesting/list`),
    enabled: Boolean(stateCode),
  });
}

export function useInterestingPlan(stateCode, planId) {
  return useQuery({
    queryKey: keys.interestingPlan(stateCode, planId),
    queryFn: () => get(`/api/states/${stateCode}/districts/interesting`, { planId }),
    enabled: Boolean(stateCode) && Boolean(planId),
  });
}

export function useMajorityMinorityBar(stateCode) {
  return useQuery({
    queryKey: keys.majorityMinorityBar(stateCode, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/majority-minority-bar`, { election: ELECTION }),
    enabled: Boolean(stateCode),
  });
}
