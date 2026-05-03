# API Test Data Catalog

This catalog maps each implemented server-backed GUI use case to the concrete seeded payload source used for professor review and route verification.

| GUI | Route | State | Lookup params | Collection | Sample payload source | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GUI-1 | `/api/states` | OR, SC | none | `states` | seeded inline in `SeedDataLoader.seedStates()` | `Live` |
| GUI-2 | `/api/states/{stateId}/districts/enacted/topology` | OR | `stateId=OR` | file-backed TopoJSON, sanitized + cacheable | `src/data/oregon_congressional_districts.json` | `Live` |
| GUI-2 | `/api/states/{stateId}/districts/enacted/topology` | SC | `stateId=SC` | file-backed TopoJSON, sanitized + cacheable | `src/data/south_carolina_congressional_districts.json` | `Live` |
| GUI-2 compatibility | `/api/states/{stateId}/districts/enacted/geojson` | OR, SC | `stateId` | file-backed GeoJSON | `src/data/*_congressional_districts.geojson` | `Compatibility` |
| GUI-3 | `/api/states/{stateId}/summary` | OR, SC | `stateId` | `state_summaries` | seeded inline in `SeedDataLoader.seedStateSummaries()` | `Live` |
| GUI-4 geometry | `/api/states/{stateId}/precincts/topology` | OR, SC | `stateId` | file-backed TopoJSON, sanitized + cacheable | `server/src/main/resources/geometry/precincts_or.json`, `server/src/main/resources/geometry/precincts_sc.json` | `Live` |
| GUI-4 | `/api/states/{stateId}/heatmap/precincts?group=...` | OR, SC | `stateId + group` | `heatmap_bins` | seeded inline in `SeedDataLoader.heatmapPayload()` | `Live` |
| GUI-6 | `/api/states/{stateId}/districts/enacted/table?election=...` | OR, SC | `stateId + election` | `district_tables` | seeded inline in `SeedDataLoader.seedDistrictTables()` | `Live` |
| GUI-9 | `/api/states/{stateId}/analysis/gingles?group=...&election=...` | OR | `stateId=OR&group=latino&election=2024_pres` | `gingles_results` | `preprocessing/output/OR_2024_latino_gingles_scatter.json` -> locked sampled chart payload in Mongo | `Live` |
| GUI-9 | `/api/states/{stateId}/analysis/gingles?group=...&election=...` | SC | `stateId=SC&group=black&election=2024_pres` | `gingles_results` | `preprocessing/output/SC_2024_black_gingles_scatter.json` -> locked sampled chart payload in Mongo | `Live` |
| GUI-10 | `/api/states/{stateId}/analysis/gingles/table?group=...&election=...` | OR | `stateId=OR&group=latino&election=2024_pres` | `gingles_tables` | `preprocessing/output/OR_2024_latino_gingles_table.json` -> locked full-row table payload in Mongo | `Live` |
| GUI-10 | `/api/states/{stateId}/analysis/gingles/table?group=...&election=...` | SC | `stateId=SC&group=black&election=2024_pres` | `gingles_tables` | `preprocessing/output/SC_2024_black_gingles_table.json` -> locked full-row table payload in Mongo | `Live` |
| GUI-12 | `/api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...` | OR | `stateId=OR&groups=latino&election=2024_pres&party=DEM` | `ei_support_results` | `mock-data/v1/ei-support/OR_2024_president.json` | `Live` |
| GUI-12 | `/api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...` | SC | `stateId=SC&groups=black&election=2024_pres&party=DEM` | `ei_support_results` | `mock-data/v1/ei-support/SC_2024_president.json` | `Live` |
| GUI-13 | `/api/states/{stateId}/analysis/ei-precinct-bar-ci?group=...&election=...&party=...` | OR | `stateId=OR&group=latino&election=2024_pres&party=DEM` | `ei_precinct_bar_ci_results` | `mock-data/v1/ei-precinct-bar-ci/OR_demo.json` | `Live` |
| GUI-13 | `/api/states/{stateId}/analysis/ei-precinct-bar-ci?group=...&election=...&party=...` | SC | `stateId=SC&group=black&election=2024_pres&party=DEM` | `ei_precinct_bar_ci_results` | `mock-data/v1/ei-precinct-bar-ci/SC_demo.json` | `Live` |
| GUI-15 | `/api/states/{stateId}/analysis/ei-kde?group=...&election=...&metric=...` | OR | `stateId=OR&group=latino&election=2024_pres&metric=support_gap` | `ei_kde_results` | `mock-data/v1/ei-kde/OR_demo.json` | `Live` |
| GUI-15 | `/api/states/{stateId}/analysis/ei-kde?group=...&election=...&metric=...` | SC | `stateId=SC&group=black&election=2024_pres&metric=support_gap` | `ei_kde_results` | `mock-data/v1/ei-kde/SC_demo.json` | `Live` |
| GUI-16 | `/api/states/{stateId}/ensembles/splits?ensembleSize=...&election=...` | OR, SC | `stateId + ensembleSize + election` | `ensemble_splits` | `mock-data/v1/ensemble-splits/*_compare.json` | `Live` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...` | OR, SC | `stateId + group + ensembleType + metric` | `box_whisker_results` | `mock-data/v1/box-whisker/*.json` | `Live` |
| GUI-19 | `/api/states/{stateId}/districts/interesting?planId=...` | OR, SC | `stateId + planId` | `interesting_plans` | seeded by `SeedDataLoader.seedInterestingPlans()` using stored district Topology JSON | `Live` |
| GUI-20 | `/api/states/{stateId}/analysis/vra-impact-thresholds?group=...&election=...` | OR | `stateId=OR&group=latino&election=2024_pres` | `vra_impact_threshold_tables` | `mock-data/v1/vra-impact-thresholds/OR_latino_2024_pres.json` | `Live` |
| GUI-20 | `/api/states/{stateId}/analysis/vra-impact-thresholds?group=...&election=...` | SC | `stateId=SC&group=black&election=2024_pres` | `vra_impact_threshold_tables` | `mock-data/v1/vra-impact-thresholds/SC_black_2024_pres.json` | `Live` |
| GUI-21 | `/api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=...` | OR, SC | `stateId + election` | `minority_effectiveness_box_whisker` | `mock-data/v1/minority-effectiveness-box-whisker/*_2024_pres.json` | `Live` |
| GUI-22 | `/api/states/{stateId}/analysis/minority-effectiveness/histogram?group=...&election=...` | OR | `stateId=OR&group=latino&election=2024_pres` | `minority_effectiveness_histograms` | `mock-data/v1/minority-effectiveness-histogram/OR_latino_2024_pres.json` | `Live` |
| GUI-22 | `/api/states/{stateId}/analysis/minority-effectiveness/histogram?group=...&election=...` | SC | `stateId=SC&group=black&election=2024_pres` | `minority_effectiveness_histograms` | `mock-data/v1/minority-effectiveness-histogram/SC_black_2024_pres.json` | `Live` |

Client-only use cases:
- `GUI-7`: highlight district using data already loaded by `GUI-2` and `GUI-6`
- `GUI-24`: reset frontend state; no server request
