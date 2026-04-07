# Mongo Schema And Use-Case Mapping

This document explains how each implemented GUI use case maps to MongoDB, file-backed geometry assets, or client-only behavior.

## Geometry Storage Model
- Static geometry is file-backed and served directly by backend routes:
  - enacted district topology
  - precinct topology
  - US states overview topology
- Analytical payloads and plan-specific payloads remain Mongo-backed.
- `GUI-19` interesting plans stay in Mongo so the backend still answers that use case with one lookup returning both plan metadata and geometry.

## Collection Summary
| Collection | Purpose | Used by |
| --- | --- | --- |
| `states` | supported state options | `GUI-1` |
| `state_summaries` | statewide summary payloads | `GUI-3` |
| `heatmap_bins` | precomputed precinct heatmap legend/bin payloads | `GUI-4` |
| `district_tables` | enacted district representation tables | `GUI-6` |
| `gingles_results` | scatter plot and regression payloads | `GUI-9` |
| `gingles_tables` | precinct-level Gingles table payloads | `GUI-10` |
| `ei_support_results` | ecological inference support distributions | `GUI-12` |
| `ei_precinct_bar_ci_results` | EI category peak + confidence interval payloads | `GUI-13` |
| `ei_kde_results` | EI KDE comparison payloads | `GUI-15` |
| `ensemble_splits` | race-blind vs VRA split distributions | `GUI-16` |
| `box_whisker_results` | ranked ensemble box-and-whisker summaries | `GUI-17` |
| `interesting_plans` | plan metadata plus map-ready TopoJSON | `GUI-19` |
| `vra_impact_threshold_tables` | legal-threshold comparison tables | `GUI-20` |
| `minority_effectiveness_box_whisker` | by-group minority-effectiveness box summaries | `GUI-21` |
| `minority_effectiveness_histograms` | by-group minority-effectiveness histograms | `GUI-22` |
| `run_manifests` | reproducibility metadata | not directly exposed |
| `ingest_manifests` | ingest provenance metadata | not directly exposed |

## Route Mapping
| GUI | Route | Mongo collection | Lookup signature |
| --- | --- | --- | --- |
| GUI-1 | `/api/states` | `states` | ordered `stateId` list |
| GUI-2 | `/api/states/{stateId}/districts/enacted/topology` | file-backed TopoJSON asset | `stateId` |
| GUI-3 | `/api/states/{stateId}/summary` | `state_summaries` | `stateId` |
| GUI-4 geometry | `/api/states/{stateId}/precincts/topology` | file-backed TopoJSON asset | `stateId` |
| GUI-4 bins | `/api/states/{stateId}/heatmap/precincts?group=...` | `heatmap_bins` | `stateId + groupKey` |
| GUI-6 | `/api/states/{stateId}/districts/enacted/table?election=...` | `district_tables` | `stateId + electionId` |
| GUI-7 | client-only | none | uses `GUI-2` + `GUI-6` payloads already in browser state |
| GUI-9 | `/api/states/{stateId}/analysis/gingles?group=...&election=...` | `gingles_results` | `stateId + groupKey + electionId` |
| GUI-10 | `/api/states/{stateId}/analysis/gingles/table?group=...&election=...` | `gingles_tables` | `stateId + groupKey + electionId` |
| GUI-12 | `/api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...` | `ei_support_results` | `stateId + electionId + groupKey` |
| GUI-13 | `/api/states/{stateId}/analysis/ei-precinct-bar-ci?group=...&election=...&party=...` | `ei_precinct_bar_ci_results` | `stateId + groupKey + electionId + partyKey` |
| GUI-15 | `/api/states/{stateId}/analysis/ei-kde?group=...&election=...&metric=...` | `ei_kde_results` | `stateId + groupKey + electionId + metricKey` |
| GUI-16 | `/api/states/{stateId}/ensembles/splits?ensembleSize=...&election=...` | `ensemble_splits` | `stateId + electionId + metricKey` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...` | `box_whisker_results` | `stateId + groupKey + ensembleType + metricKey` |
| GUI-19 | `/api/states/{stateId}/districts/interesting?planId=...` | `interesting_plans` | `stateId + planId` |
| GUI-20 | `/api/states/{stateId}/analysis/vra-impact-thresholds?group=...&election=...` | `vra_impact_threshold_tables` | `stateId + groupKey + electionId` |
| GUI-21 | `/api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=...` | `minority_effectiveness_box_whisker` | `stateId + electionId` |
| GUI-22 | `/api/states/{stateId}/analysis/minority-effectiveness/histogram?group=...&election=...` | `minority_effectiveness_histograms` | `stateId + groupKey + electionId` |
| GUI-24 | client-only | none | local state reset only |

## Discussion Pattern
Use this explanation when presenting the server model:
1. A GUI use case represents a specific question the frontend is asking.
2. Route parameters select the analytical slice or plan slice that answers that question.
3. The backend either performs one lookup against the mapped collection or reads a static TopoJSON asset for geometry-only routes.
4. The route returns client-ready JSON or TopoJSON.
