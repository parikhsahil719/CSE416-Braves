import { useQuery } from "@tanstack/react-query";
import { getJson } from "../lib/apiClient.js";
import { queryKeys } from "../lib/queryKeys.js";
import { QUERY_TIMES } from "../lib/queryClient.js";
import { topologyToFeatureCollection } from "../utils/topology.js";

const DEFAULT_ELECTION = "2024_pres";
const DEFAULT_PARTY = "DEM";
const DEFAULT_ENSEMBLE_SIZE = "final";
const DEFAULT_INTERESTING_PLAN_ID = "plan-42";
const DEFAULT_KDE_METRIC = "support_gap";
const DEFAULT_BOXPLOT_METRIC = "minority_share";

function withEnabled(options, enabled) {
  return {
    ...options,
    enabled,
  };
}

export function statesQueryOptions() {
  return {
    queryKey: queryKeys.states(),
    queryFn: () => getJson("/api/states"),
  };
}

export function usStatesTopologyQueryOptions() {
  return {
    queryKey: queryKeys.usStatesTopology(),
    queryFn: async () => topologyToFeatureCollection(await getJson("/api/maps/us-states/topology"), "us-states"),
    staleTime: QUERY_TIMES.precinctTopologyStaleTime,
  };
}

export function stateSummaryQueryOptions(stateCode) {
  return {
    queryKey: queryKeys.stateSummary(stateCode),
    queryFn: () => getJson(`/api/states/${stateCode}/state-summary`),
  };
}

export function ensembleSummaryQueryOptions(stateCode) {
  return {
    queryKey: queryKeys.ensembleSummary(stateCode),
    queryFn: () => getJson(`/api/states/${stateCode}/ensembles-summary`),
  };
}

export function districtTopologyQueryOptions(stateCode) {
  return {
    queryKey: queryKeys.districtTopology(stateCode),
    queryFn: async () => topologyToFeatureCollection(await getJson(`/api/states/${stateCode}/districts/enacted/topology`), "districts"),
    staleTime: QUERY_TIMES.districtTopologyStaleTime,
  };
}

export function precinctTopologyQueryOptions(stateCode) {
  return {
    queryKey: queryKeys.precinctTopology(stateCode),
    queryFn: async () => topologyToFeatureCollection(await getJson(`/api/states/${stateCode}/precincts/topology`), stateCode),
    staleTime: QUERY_TIMES.precinctTopologyStaleTime,
  };
}

export function heatmapQueryOptions(stateCode, group) {
  return {
    queryKey: queryKeys.heatmap(stateCode, group),
    queryFn: () => getJson(`/api/states/${stateCode}/heatmap/precincts`, { params: { group } }),
    placeholderData: (previousData) => previousData,
  };
}

export function districtTableQueryOptions(stateCode, election = DEFAULT_ELECTION) {
  return {
    queryKey: queryKeys.districtTable(stateCode, election),
    queryFn: () => getJson(`/api/states/${stateCode}/districts/enacted/table`, { params: { election } }),
  };
}

export function eiSupportQueryOptions(stateCode, group, election = DEFAULT_ELECTION, party = DEFAULT_PARTY) {
  return {
    queryKey: queryKeys.eiSupport(stateCode, group, election, party),
    queryFn: () => getJson(`/api/states/${stateCode}/analysis/ei-support`, { params: { groups: group, election, party } }),
    placeholderData: (previousData) => previousData,
  };
}

export function eiPrecinctBarCiQueryOptions(stateCode, group, election = DEFAULT_ELECTION, party = DEFAULT_PARTY) {
  return {
    queryKey: queryKeys.eiPrecinctBarCi(stateCode, group, election, party),
    queryFn: () => getJson(`/api/states/${stateCode}/analysis/ei-precinct-bar-ci`, { params: { group, election, party } }),
    placeholderData: (previousData) => previousData,
  };
}

export function eiKdeQueryOptions(stateCode, group, election = DEFAULT_ELECTION, metric = DEFAULT_KDE_METRIC) {
  return {
    queryKey: queryKeys.eiKde(stateCode, group, election, metric),
    queryFn: () => getJson(`/api/states/${stateCode}/analysis/ei-kde`, { params: { group, election, metric } }),
    placeholderData: (previousData) => previousData,
  };
}

export function ensembleSplitsQueryOptions(stateCode, ensembleSize = DEFAULT_ENSEMBLE_SIZE, election = DEFAULT_ELECTION) {
  return {
    queryKey: queryKeys.ensembleSplits(stateCode, ensembleSize, election),
    queryFn: () => getJson(`/api/states/${stateCode}/ensembles/splits`, { params: { ensembleSize, election } }),
  };
}

export function boxWhiskerQueryOptions(stateCode, group, ensembleType, metric = DEFAULT_BOXPLOT_METRIC) {
  return {
    queryKey: queryKeys.boxWhisker(stateCode, group, ensembleType, metric),
    queryFn: () => getJson(`/api/states/${stateCode}/ensembles/box-whisker`, { params: { group, ensembleType, metric } }),
    placeholderData: (previousData) => previousData,
  };
}

export function interestingPlanQueryOptions(stateCode, planId = DEFAULT_INTERESTING_PLAN_ID) {
  return {
    queryKey: queryKeys.interestingPlan(stateCode, planId),
    queryFn: async () => {
      const payload = await getJson(`/api/states/${stateCode}/districts/interesting`, { params: { planId } });
      return {
        ...payload,
        transformedTopology: topologyToFeatureCollection(payload.topology, "districts"),
      };
    },
    staleTime: QUERY_TIMES.districtTopologyStaleTime,
  };
}

export function vraImpactThresholdsQueryOptions(stateCode, group, election = DEFAULT_ELECTION) {
  return {
    queryKey: queryKeys.vraImpactThresholds(stateCode, group, election),
    queryFn: () => getJson(`/api/states/${stateCode}/analysis/vra-impact-thresholds`, { params: { group, election } }),
    placeholderData: (previousData) => previousData,
  };
}

export function minorityEffectivenessBoxWhiskerQueryOptions(stateCode, election = DEFAULT_ELECTION) {
  return {
    queryKey: queryKeys.minorityEffectivenessBoxWhisker(stateCode, election),
    queryFn: () => getJson(`/api/states/${stateCode}/analysis/minority-effectiveness/box-whisker`, { params: { election } }),
  };
}

export function minorityEffectivenessHistogramQueryOptions(stateCode, group, election = DEFAULT_ELECTION) {
  return {
    queryKey: queryKeys.minorityEffectivenessHistogram(stateCode, group, election),
    queryFn: () => getJson(`/api/states/${stateCode}/analysis/minority-effectiveness/histogram`, { params: { group, election } }),
    placeholderData: (previousData) => previousData,
  };
}

export function useStatesQuery() {
  return useQuery(statesQueryOptions());
}

export function useUsStatesTopologyQuery() {
  return useQuery(usStatesTopologyQueryOptions());
}

export function useStateSummaryQuery(stateCode, enabled = true) {
  return useQuery(withEnabled(stateSummaryQueryOptions(stateCode), enabled && Boolean(stateCode)));
}

export function useEnsembleSummaryQuery(stateCode, enabled = true) {
  return useQuery(withEnabled(ensembleSummaryQueryOptions(stateCode), enabled && Boolean(stateCode)));
}

export function useDistrictTopologyQuery(stateCode, enabled = true) {
  return useQuery(withEnabled(districtTopologyQueryOptions(stateCode), enabled && Boolean(stateCode)));
}

export function usePrecinctTopologyQuery(stateCode, enabled = true) {
  return useQuery(withEnabled(precinctTopologyQueryOptions(stateCode), enabled && Boolean(stateCode)));
}

export function useHeatmapQuery(stateCode, group, enabled = true) {
  return useQuery(withEnabled(heatmapQueryOptions(stateCode, group), enabled && Boolean(stateCode && group)));
}

export function useDistrictTableQuery(stateCode, election = DEFAULT_ELECTION, enabled = true) {
  return useQuery(withEnabled(districtTableQueryOptions(stateCode, election), enabled && Boolean(stateCode)));
}

export function useEiSupportQuery(stateCode, group, enabled = true) {
  return useQuery(withEnabled(eiSupportQueryOptions(stateCode, group), enabled && Boolean(stateCode && group)));
}

export function useEiPrecinctBarCiQuery(stateCode, group, enabled = true) {
  return useQuery(withEnabled(eiPrecinctBarCiQueryOptions(stateCode, group), enabled && Boolean(stateCode && group)));
}

export function useEiKdeQuery(stateCode, group, enabled = true) {
  return useQuery(withEnabled(eiKdeQueryOptions(stateCode, group), enabled && Boolean(stateCode && group)));
}

export function useEnsembleSplitsQuery(stateCode, enabled = true) {
  return useQuery(withEnabled(ensembleSplitsQueryOptions(stateCode), enabled && Boolean(stateCode)));
}

export function useBoxWhiskerQuery(stateCode, group, ensembleType, enabled = true) {
  return useQuery(withEnabled(boxWhiskerQueryOptions(stateCode, group, ensembleType), enabled && Boolean(stateCode && group && ensembleType)));
}

export function useInterestingPlanQuery(stateCode, planId = DEFAULT_INTERESTING_PLAN_ID, enabled = true) {
  return useQuery(withEnabled(interestingPlanQueryOptions(stateCode, planId), enabled && Boolean(stateCode && planId)));
}

export function useVraImpactThresholdsQuery(stateCode, group, enabled = true) {
  return useQuery(withEnabled(vraImpactThresholdsQueryOptions(stateCode, group), enabled && Boolean(stateCode && group)));
}

export function useMinorityEffectivenessBoxWhiskerQuery(stateCode, enabled = true) {
  return useQuery(withEnabled(minorityEffectivenessBoxWhiskerQueryOptions(stateCode), enabled && Boolean(stateCode)));
}

export function useMinorityEffectivenessHistogramQuery(stateCode, group, enabled = true) {
  return useQuery(withEnabled(minorityEffectivenessHistogramQueryOptions(stateCode, group), enabled && Boolean(stateCode && group)));
}

export function prefetchStateLandingData(queryClient, stateCode) {
  return Promise.all([
    queryClient.prefetchQuery(stateSummaryQueryOptions(stateCode)),
    queryClient.prefetchQuery(districtTopologyQueryOptions(stateCode)),
  ]);
}

export function prefetchStateOverviewData(queryClient, stateCode) {
  return Promise.all([
    queryClient.prefetchQuery(districtTableQueryOptions(stateCode)),
    queryClient.prefetchQuery(ensembleSummaryQueryOptions(stateCode)),
  ]);
}

export function prefetchInterestingPlanData(queryClient, stateCode, planId = DEFAULT_INTERESTING_PLAN_ID) {
  return queryClient.prefetchQuery(interestingPlanQueryOptions(stateCode, planId));
}
