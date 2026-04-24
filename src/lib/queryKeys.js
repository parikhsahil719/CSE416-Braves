// Centralized query key factory. All useQuery calls reference these keys so
// invalidation and prefetch targets are always in sync.
export const keys = {
  meta:            ()              => ['meta'],
  usStatesTopology:()              => ['topology', 'us-states'],
  stateSummary:    (s)             => ['stateSummary', s],
  ensemblesSummary:(s)             => ['ensemblesSummary', s],
  districtTopology:(s)             => ['topology', 'districts', s],
  precinctTopology:(s)             => ['topology', 'precincts', s],
  districtTable:   (s, e)          => ['districtTable', s, e],
  heatmap:         (s, g)          => ['heatmap', s, g],
  gingles:         (s, g, e)       => ['gingles', s, g, e],
  ginglesTable:    (s, g, e)       => ['ginglesTable', s, g, e],
  eiSupport:       (s, g, e, p)    => ['eiSupport', s, g, e, p],
  eiPrecinctBarCi: (s, g, e, p)    => ['eiPrecinctBarCi', s, g, e, p],
  eiKde:           (s, g, e, m)    => ['eiKde', s, g, e, m],
  ensembleSplits:  (s, size, e)    => ['ensembleSplits', s, size, e],
  boxWhisker:      (s, g, type, m) => ['boxWhisker', s, g, type, m],
  vraImpact:       (s, g, e)       => ['vraImpact', s, g, e],
  meBoxWhisker:    (s, e)          => ['meBoxWhisker', s, e],
  meHistogram:     (s, g, e)       => ['meHistogram', s, g, e],
};
