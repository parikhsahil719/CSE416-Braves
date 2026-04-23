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

export function useEiSupport(stateCode, group) {
  return useQuery({
    queryKey: keys.eiSupport(stateCode, group, ELECTION, 'DEM'),
    queryFn: () => get(`/api/states/${stateCode}/analysis/ei-support`, { groups: group, election: ELECTION, party: 'DEM' }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useEiPrecinctBarCi(stateCode, group) {
  return useQuery({
    queryKey: keys.eiPrecinctBarCi(stateCode, group, ELECTION, 'DEM'),
    queryFn: () => get(`/api/states/${stateCode}/analysis/ei-precinct-bar-ci`, { group, election: ELECTION, party: 'DEM' }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}

export function useEiKde(stateCode, group) {
  return useQuery({
    queryKey: keys.eiKde(stateCode, group, ELECTION, 'support_gap'),
    queryFn: () => get(`/api/states/${stateCode}/analysis/ei-kde`, { group, election: ELECTION, metric: 'support_gap' }),
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

export function useMeBoxWhisker(stateCode) {
  return useQuery({
    queryKey: keys.meBoxWhisker(stateCode, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/minority-effectiveness/box-whisker`, { election: ELECTION }),
    enabled: Boolean(stateCode),
  });
}

export function useMeHistogram(stateCode, group) {
  return useQuery({
    queryKey: keys.meHistogram(stateCode, group, ELECTION),
    queryFn: () => get(`/api/states/${stateCode}/analysis/minority-effectiveness/histogram`, { group, election: ELECTION }),
    enabled: Boolean(stateCode) && Boolean(group),
  });
}
