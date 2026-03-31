# Mongo Schema and Use Case Mapping

## Purpose

This document explains how the Braves backend stores client-ready interface payloads in MongoDB and how each use case maps to one collection plus a specific lookup pattern.

## Collection Inventory

| Collection | Purpose | Status in packet |
| --- | --- | --- |
| `states` | supported state list and state metadata used for GUI-1 | `Live` |
| `district_maps` | enacted district GeoJSON payloads | `Live` |
| `state_summaries` | state-level overview payloads | `Seeded contract` |
| `district_tables` | congressional representation table payloads | `Seeded contract` |
| `heatmap_bins` | precomputed heatmap bin definitions by group | `Seeded contract` |
| `gingles_results` | Gingles scatter and regression payloads | `Seeded contract` |
| `ei_support_results` | ecological inference support distribution payloads | `Seeded contract` |
| `ensemble_splits` | ensemble split histogram payloads | `Seeded contract` |
| `box_whisker_results` | box-and-whisker ensemble summary payloads | `Seeded contract` |
| `run_manifests` | provenance for analytical runs | provenance |
| `ingest_manifests` | provenance for ingest/loading operations | provenance |

## Shared Mongo Document Structure

All analytical payload collections extend the same base document definition from `BasePayloadDocument`.

| Field | Meaning |
| --- | --- |
| `_id` | MongoDB document identifier |
| `stateId` | state selector, such as `OR` or `SC` |
| `electionId` | election selector, such as `2024_pres` |
| `groupKey` | minority or demographic selector, such as `latino` or `black` |
| `ensembleType` | ensemble variant selector, such as `vra_constrained` or `race_blind` |
| `metricKey` | analytical metric selector, such as `minority_share` or route-side selector values |
| `populationMeasure` | measure used by the payload, such as `TOTAL` or `CVAP` |
| `schemaVersion` | payload contract version, currently `v1` |
| `sourceManifestId` | link back to a provenance manifest |
| `createdAt` | creation timestamp |
| `payload` | the client-ready JSON or GeoJSON returned by the server |

## Lookup Key by Use Case

| Use Case | Route | Collection | Lookup key(s) |
| --- | --- | --- | --- |
| GUI-1 | `/api/states` | `states` | `stateId` |
| GUI-2 | `/api/states/{stateId}/districts/enacted/geojson` | `district_maps` | `stateId` |
| GUI-3 | `/api/states/{stateId}/summary` | `state_summaries` | `stateId` |
| GUI-4 | `/api/states/{stateId}/heatmap/precincts?group=...` | `heatmap_bins` | `stateId + groupKey` |
| GUI-6 | `/api/states/{stateId}/districts/enacted/table?election=...` | `district_tables` | `stateId + electionId` |
| GUI-9 | `/api/states/{stateId}/analysis/gingles?group=...&election=...` | `gingles_results` | `stateId + groupKey + electionId` |
| GUI-12 | `/api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...` | `ei_support_results` | `stateId + electionId + groupKey` |
| GUI-16 | `/api/states/{stateId}/ensembles/splits?ensembleSize=...&election=...` | `ensemble_splits` | `stateId + electionId + metricKey` |
| GUI-17 | `/api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...` | `box_whisker_results` | `stateId + groupKey + ensembleType + metricKey` |

## Repository-Level Mapping

The repository interfaces in the backend make the lookup strategy explicit:

- `DistrictMapRepository.findByStateId`
- `StateSummaryRepository.findByStateId`
- `HeatmapBinRepository.findByStateIdAndGroupKey`
- `DistrictTableRepository.findByStateIdAndElectionId`
- `GinglesResultRepository.findByStateIdAndGroupKeyAndElectionId`
- `EiSupportResultRepository.findByStateIdAndElectionIdAndGroupKey`
- `EnsembleSplitRepository.findByStateIdAndElectionIdAndMetricKey`
- `BoxWhiskerResultRepository.findByStateIdAndGroupKeyAndEnsembleTypeAndMetricKey`

This is the cleanest way to explain the data model orally: each use case maps to exactly one collection and one lookup signature.

## Relational-Style Explanation

Even though the backend uses MongoDB, the data can be described in relational terms:

- `states` acts like the root state dimension table
- each analytical collection acts like a payload table keyed by `stateId` plus optional selectors
- `run_manifests` and `ingest_manifests` act like provenance tables for derived artifacts
- `sourceManifestId` is the logical bridge from a returned payload back to the run or ingest metadata that produced it

The main difference from a traditional relational schema is that the actual response body is embedded as a document in `payload`, rather than normalized across multiple tables.

## Collection-to-Use-Case Notes

### `states`

- Used by `GUI-1`
- Stores lightweight metadata used to populate the client’s state selector
- Payload example fields:
  - `stateId`
  - `stateName`
  - `totalDistricts`

### `district_maps`

- Used by `GUI-2`
- Stores client-ready GeoJSON by state
- This is the strongest current end-to-end example because the frontend already fetches it live

### `state_summaries`

- Used by `GUI-3`
- Stores one summary document per state
- Payload is already shaped for direct frontend rendering

### `heatmap_bins`

- Used by `GUI-4`
- Stores bin definitions for demographic heat maps by state and group
- Current payload focuses on legend and bin metadata rather than raw geometry

### `district_tables`

- Used by `GUI-6`
- Stores the enacted district-by-district representation table for a specific election

### `gingles_results`

- Used by `GUI-9`
- Stores client-ready scatter payloads and regression curves for a state, group, and election

### `ei_support_results`

- Used by `GUI-12`
- Stores ecological inference support distributions
- Current route contract includes `groups` and `party`, while the seeded repository key currently tracks one stored `groupKey` per state example

### `ensemble_splits`

- Used by `GUI-16`
- Stores split-frequency summaries by election and route-side selector
- Current seed loader stores the demo compare payload under `metricKey=final`

### `box_whisker_results`

- Used by `GUI-17`
- Stores box-and-whisker summaries by group, ensemble type, and metric

### `run_manifests` and `ingest_manifests`

- Not exposed directly as professor-facing use case routes
- Important for discussion of reproducibility and provenance
- Document how data was derived and loaded

## How to Discuss Data vs Use Cases

When explaining the system orally, use this pattern:

1. A use case represents a question the UI is asking.
2. The route parameters determine which analytical slice is requested.
3. The Mongo collection choice tells you what kind of artifact answers that question.
4. The `payload` field holds the exact client-ready JSON for that use case.
5. The manifest collections explain where that derived artifact came from.

Examples:

- `GUI-2` asks for the enacted district map of a state, so the backend reads one GeoJSON payload from `district_maps` using `stateId`.
- `GUI-9` asks for Gingles analysis of a specific group and election, so the backend reads one scatter payload from `gingles_results` using `stateId + groupKey + electionId`.
- `GUI-17` asks for an ensemble summary for a group, ensemble type, and metric, so the backend reads one ranked-summary payload from `box_whisker_results` using all three selectors plus `stateId`.

That relationship between route, parameters, collection, and payload is the main concept to emphasize when discussing how data supports each use case.
