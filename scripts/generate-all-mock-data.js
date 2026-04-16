/**
 * Generates all missing mock data JSON files for OR Asian and SC Latino groups,
 * and rewrites EI KDE files to the single-curve (support-gap) format.
 *
 * Run with: node scripts/generate-all-mock-data.js
 */

const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function write(relPath, data) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
  console.log("  wrote", relPath);
}

// ── Gaussian KDE helper ───────────────────────────────────────────────────────
function gaussianKde(mu, sigma, xMin, xMax, steps = 60) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * (i / steps);
    const z = (x - mu) / sigma;
    const density = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    pts.push({ x: parseFloat(x.toFixed(3)), density: parseFloat(density.toFixed(4)) });
  }
  return pts;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BOX WHISKER  (GUI-17)
// ─────────────────────────────────────────────────────────────────────────────

// OR Asian — 6 districts, Asian CVAP ~5.5% statewide
// VRA-constrained packs more into one district (Beaverton/Hillsboro CD-1)
const orAsianRaceBlind = {
  schemaVersion: "v1", chartType: "box-whisker",
  state: "OR", totalDistricts: 6, election: "2024 Presidential",
  ensembleType: "race_blind", selectedGroup: "Asian",
  metricLabel: "Asian CVAP share",
  units: { share: "decimal_0_to_1" },
  rankSummaries: [
    { districtRank: 1, min: 0.013, q1: 0.020, median: 0.026, q3: 0.033, max: 0.042, enactedValue: 0.023, proposedValue: null },
    { districtRank: 2, min: 0.024, q1: 0.032, median: 0.038, q3: 0.045, max: 0.056, enactedValue: 0.036, proposedValue: null },
    { districtRank: 3, min: 0.035, q1: 0.042, median: 0.050, q3: 0.058, max: 0.070, enactedValue: 0.048, proposedValue: null },
    { districtRank: 4, min: 0.046, q1: 0.055, median: 0.063, q3: 0.072, max: 0.085, enactedValue: 0.061, proposedValue: null },
    { districtRank: 5, min: 0.058, q1: 0.069, median: 0.079, q3: 0.090, max: 0.106, enactedValue: 0.076, proposedValue: null },
    { districtRank: 6, min: 0.082, q1: 0.096, median: 0.108, q3: 0.122, max: 0.142, enactedValue: 0.105, proposedValue: null },
  ],
};

const orAsianVra = {
  ...orAsianRaceBlind,
  ensembleType: "vra_constrained",
  rankSummaries: [
    { districtRank: 1, min: 0.016, q1: 0.023, median: 0.029, q3: 0.037, max: 0.046, enactedValue: 0.023, proposedValue: null },
    { districtRank: 2, min: 0.028, q1: 0.036, median: 0.043, q3: 0.051, max: 0.062, enactedValue: 0.036, proposedValue: null },
    { districtRank: 3, min: 0.040, q1: 0.048, median: 0.056, q3: 0.065, max: 0.077, enactedValue: 0.048, proposedValue: null },
    { districtRank: 4, min: 0.052, q1: 0.062, median: 0.070, q3: 0.080, max: 0.094, enactedValue: 0.061, proposedValue: null },
    { districtRank: 5, min: 0.066, q1: 0.077, median: 0.088, q3: 0.100, max: 0.117, enactedValue: 0.076, proposedValue: null },
    { districtRank: 6, min: 0.095, q1: 0.112, median: 0.127, q3: 0.145, max: 0.170, enactedValue: 0.105, proposedValue: null },
  ],
};

// SC Latino — 7 districts, Latino CVAP ~6.7% statewide
// Concentrated in Upstate (Greenville/Spartanburg) and Lowcountry
const scLatinoRaceBlind = {
  schemaVersion: "v1", chartType: "box-whisker",
  state: "SC", totalDistricts: 7, election: "2024 Presidential",
  ensembleType: "race_blind", selectedGroup: "Latino",
  metricLabel: "Latino CVAP share",
  units: { share: "decimal_0_to_1" },
  rankSummaries: [
    { districtRank: 1, min: 0.014, q1: 0.021, median: 0.027, q3: 0.034, max: 0.044, enactedValue: 0.024, proposedValue: null },
    { districtRank: 2, min: 0.025, q1: 0.033, median: 0.040, q3: 0.048, max: 0.059, enactedValue: 0.037, proposedValue: null },
    { districtRank: 3, min: 0.037, q1: 0.045, median: 0.052, q3: 0.061, max: 0.073, enactedValue: 0.050, proposedValue: null },
    { districtRank: 4, min: 0.048, q1: 0.057, median: 0.065, q3: 0.074, max: 0.088, enactedValue: 0.063, proposedValue: null },
    { districtRank: 5, min: 0.060, q1: 0.070, median: 0.079, q3: 0.089, max: 0.105, enactedValue: 0.077, proposedValue: null },
    { districtRank: 6, min: 0.074, q1: 0.085, median: 0.095, q3: 0.107, max: 0.124, enactedValue: 0.093, proposedValue: null },
    { districtRank: 7, min: 0.093, q1: 0.106, median: 0.118, q3: 0.132, max: 0.153, enactedValue: 0.116, proposedValue: null },
  ],
};

const scLatinoVra = {
  ...scLatinoRaceBlind,
  ensembleType: "vra_constrained",
  rankSummaries: [
    { districtRank: 1, min: 0.017, q1: 0.024, median: 0.031, q3: 0.039, max: 0.050, enactedValue: 0.024, proposedValue: null },
    { districtRank: 2, min: 0.029, q1: 0.038, median: 0.046, q3: 0.055, max: 0.068, enactedValue: 0.037, proposedValue: null },
    { districtRank: 3, min: 0.043, q1: 0.052, median: 0.060, q3: 0.070, max: 0.084, enactedValue: 0.050, proposedValue: null },
    { districtRank: 4, min: 0.056, q1: 0.066, median: 0.075, q3: 0.085, max: 0.100, enactedValue: 0.063, proposedValue: null },
    { districtRank: 5, min: 0.070, q1: 0.082, median: 0.093, q3: 0.105, max: 0.122, enactedValue: 0.077, proposedValue: null },
    { districtRank: 6, min: 0.088, q1: 0.102, median: 0.115, q3: 0.130, max: 0.150, enactedValue: 0.093, proposedValue: null },
    { districtRank: 7, min: 0.115, q1: 0.132, median: 0.149, q3: 0.168, max: 0.196, enactedValue: 0.116, proposedValue: null },
  ],
};

write("mock-data/v1/box-whisker/OR_asian_cvap_race_blind.json", orAsianRaceBlind);
write("mock-data/v1/box-whisker/OR_asian_cvap_vra.json",        orAsianVra);
write("mock-data/v1/box-whisker/SC_latino_cvap_race_blind.json", scLatinoRaceBlind);
write("mock-data/v1/box-whisker/SC_latino_cvap_vra.json",        scLatinoVra);

// ─────────────────────────────────────────────────────────────────────────────
// 2. VRA IMPACT THRESHOLDS  (GUI-20)
// ─────────────────────────────────────────────────────────────────────────────
// OR Asian CVAP share statewide ~5.5%.  Rough proportionality = ~0.33 of 6 districts → 0 effective districts satisfies it only if threshold rounds down.
// In practice rough proportionality means: effectiveCount/totalDistricts ≥ cvapShare.
// With 5.5% CVAP and 6 districts you'd need ≥0.33 effective districts → effectively 0 or 1.
// Race-blind ensembles very rarely produce even 1 effective Asian district.
// VRA-constrained pushes to guarantee at least 1 effective district.
write("mock-data/v1/vra-impact-thresholds/OR_asian_2024_pres.json", {
  schemaVersion: "v1", tableType: "vra-impact-thresholds",
  state: "OR", election: "2024 Presidential",
  selectedGroup: "Asian", populationMeasure: "CVAP",
  rows: [
    {
      metricKey: "meet_or_exceed_enacted",
      metricLabel: "Meet or exceed enacted effective minority districts",
      raceBlindShare: 0.09,
      vraConstrainedShare: 0.54,
    },
    {
      metricKey: "rough_proportionality",
      metricLabel: "Achieve rough proportionality relative to Asian CVAP share",
      raceBlindShare: 0.13,
      vraConstrainedShare: 0.61,
    },
    {
      metricKey: "joint_satisfaction",
      metricLabel: "Satisfy both legal thresholds jointly",
      raceBlindShare: 0.07,
      vraConstrainedShare: 0.48,
    },
  ],
});

// SC Latino CVAP share ~6.7%.  In Republican-dominated SC it is even harder for Latino
// to reach effectiveness thresholds — both ensembles show lower proportions than OR.
write("mock-data/v1/vra-impact-thresholds/SC_latino_2024_pres.json", {
  schemaVersion: "v1", tableType: "vra-impact-thresholds",
  state: "SC", election: "2024 Presidential",
  selectedGroup: "Latino", populationMeasure: "CVAP",
  rows: [
    {
      metricKey: "meet_or_exceed_enacted",
      metricLabel: "Meet or exceed enacted effective minority districts",
      raceBlindShare: 0.07,
      vraConstrainedShare: 0.48,
    },
    {
      metricKey: "rough_proportionality",
      metricLabel: "Achieve rough proportionality relative to Latino CVAP share",
      raceBlindShare: 0.11,
      vraConstrainedShare: 0.55,
    },
    {
      metricKey: "joint_satisfaction",
      metricLabel: "Satisfy both legal thresholds jointly",
      raceBlindShare: 0.05,
      vraConstrainedShare: 0.41,
    },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MINORITY EFFECTIVENESS HISTOGRAM  (GUI-22)
// ─────────────────────────────────────────────────────────────────────────────
// OR Asian: with 5.5% CVAP it is very difficult to elect even 1 effective district.
// Race-blind: ~76% of plans have 0 effective Asian districts.
// VRA-constrained: ~60% of plans get to 1 effective Asian district.
write("mock-data/v1/minority-effectiveness-histogram/OR_asian_2024_pres.json", {
  schemaVersion: "v1", chartType: "minority-effectiveness-histogram",
  state: "OR", election: "2024 Presidential", totalDistricts: 6,
  selectedGroup: "Asian", ensembleSize: 250,
  units: { count: "plans" },
  series: {
    raceBlind: [
      { effectiveDistricts: 0, frequency: 191, shareOfEnsemble: 0.764 },
      { effectiveDistricts: 1, frequency:  52, shareOfEnsemble: 0.208 },
      { effectiveDistricts: 2, frequency:   7, shareOfEnsemble: 0.028 },
    ],
    vraConstrained: [
      { effectiveDistricts: 0, frequency:  37, shareOfEnsemble: 0.148 },
      { effectiveDistricts: 1, frequency: 149, shareOfEnsemble: 0.596 },
      { effectiveDistricts: 2, frequency:  64, shareOfEnsemble: 0.256 },
    ],
  },
});

// SC Latino: even harder than OR Asian due to SC's overall Republican lean.
write("mock-data/v1/minority-effectiveness-histogram/SC_latino_2024_pres.json", {
  schemaVersion: "v1", chartType: "minority-effectiveness-histogram",
  state: "SC", election: "2024 Presidential", totalDistricts: 7,
  selectedGroup: "Latino", ensembleSize: 250,
  units: { count: "plans" },
  series: {
    raceBlind: [
      { effectiveDistricts: 0, frequency: 203, shareOfEnsemble: 0.812 },
      { effectiveDistricts: 1, frequency:  43, shareOfEnsemble: 0.172 },
      { effectiveDistricts: 2, frequency:   4, shareOfEnsemble: 0.016 },
    ],
    vraConstrained: [
      { effectiveDistricts: 0, frequency:  52, shareOfEnsemble: 0.208 },
      { effectiveDistricts: 1, frequency: 144, shareOfEnsemble: 0.576 },
      { effectiveDistricts: 2, frequency:  54, shareOfEnsemble: 0.216 },
    ],
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EI SUPPORT DISTRIBUTION  (GUI-12)
// ─────────────────────────────────────────────────────────────────────────────
// OR Asian: Asian voters in OR lean strongly Democratic (~65% for Hardy).
// non-Asian in OR: ~38%.  Clear but less extreme than Latino.
write("mock-data/v1/ei-support/OR_asian_2024_president.json", {
  schemaVersion: "v1", chartType: "ei-support",
  state: "OR", totalDistricts: 6, election: "2024 Presidential",
  selectedCandidate: "Hardy", selectedGroup: "Asian",
  units: { share: "decimal_0_to_1" },
  series: [
    {
      key: "asian", label: "Asian", confidenceScore: 0.79,
      points: [
        { xSupportShare: 0.30, density: 0.10 },
        { xSupportShare: 0.40, density: 0.35 },
        { xSupportShare: 0.50, density: 0.90 },
        { xSupportShare: 0.60, density: 2.20 },
        { xSupportShare: 0.65, density: 3.40 },
        { xSupportShare: 0.70, density: 3.90 },
        { xSupportShare: 0.75, density: 3.20 },
        { xSupportShare: 0.80, density: 1.80 },
        { xSupportShare: 0.85, density: 0.60 },
        { xSupportShare: 0.90, density: 0.15 },
      ],
    },
    {
      key: "non_asian", label: "Non-Asian", confidenceScore: 0.72,
      points: [
        { xSupportShare: 0.15, density: 0.30 },
        { xSupportShare: 0.25, density: 1.50 },
        { xSupportShare: 0.35, density: 3.20 },
        { xSupportShare: 0.40, density: 2.80 },
        { xSupportShare: 0.45, density: 1.40 },
        { xSupportShare: 0.55, density: 0.40 },
        { xSupportShare: 0.65, density: 0.08 },
      ],
    },
  ],
});

// SC Latino: Latino voters in SC lean Democratic but less so than Black (~52% for Dem candidate).
// non-Latino SC: ~22% Dem (heavily Republican state).
write("mock-data/v1/ei-support/SC_latino_2024_president.json", {
  schemaVersion: "v1", chartType: "ei-support",
  state: "SC", totalDistricts: 7, election: "2024 Presidential",
  selectedCandidate: "Hardy", selectedGroup: "Latino",
  units: { share: "decimal_0_to_1" },
  series: [
    {
      key: "latino", label: "Latino", confidenceScore: 0.73,
      points: [
        { xSupportShare: 0.20, density: 0.20 },
        { xSupportShare: 0.30, density: 0.80 },
        { xSupportShare: 0.40, density: 2.10 },
        { xSupportShare: 0.50, density: 3.50 },
        { xSupportShare: 0.55, density: 3.80 },
        { xSupportShare: 0.60, density: 2.90 },
        { xSupportShare: 0.70, density: 1.20 },
        { xSupportShare: 0.80, density: 0.30 },
      ],
    },
    {
      key: "non_latino", label: "Non-Latino", confidenceScore: 0.68,
      points: [
        { xSupportShare: 0.05, density: 0.40 },
        { xSupportShare: 0.10, density: 1.10 },
        { xSupportShare: 0.15, density: 2.60 },
        { xSupportShare: 0.20, density: 3.50 },
        { xSupportShare: 0.25, density: 2.80 },
        { xSupportShare: 0.30, density: 1.30 },
        { xSupportShare: 0.35, density: 0.40 },
        { xSupportShare: 0.40, density: 0.10 },
      ],
    },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EI PRECINCT BAR + CI  (GUI-13)
// ─────────────────────────────────────────────────────────────────────────────
// OR Asian: peak support for Hardy ~0.68 Asian voters, ~0.37 non-Asian
write("mock-data/v1/ei-precinct-bar-ci/OR_asian_demo.json", {
  schemaVersion: "v1", chartType: "ei-precinct-bar-ci",
  state: "OR", totalDistricts: 6, election: "2024 Presidential",
  selectedCandidate: "Hardy",
  categories: [
    { category: "Asian",  peak: 0.68, ciLow: 0.61, ciHigh: 0.76 },
    { category: "Latino", peak: 0.71, ciLow: 0.64, ciHigh: 0.79 },
    { category: "White",  peak: 0.36, ciLow: 0.29, ciHigh: 0.43 },
    { category: "Other",  peak: 0.52, ciLow: 0.42, ciHigh: 0.63 },
  ],
});

// SC Latino
write("mock-data/v1/ei-precinct-bar-ci/SC_latino_demo.json", {
  schemaVersion: "v1", chartType: "ei-precinct-bar-ci",
  state: "SC", totalDistricts: 7, election: "2024 Presidential",
  selectedCandidate: "Hardy",
  categories: [
    { category: "Latino", peak: 0.54, ciLow: 0.44, ciHigh: 0.65 },
    { category: "Black",  peak: 0.78, ciLow: 0.70, ciHigh: 0.86 },
    { category: "White",  peak: 0.22, ciLow: 0.16, ciHigh: 0.30 },
    { category: "Other",  peak: 0.38, ciLow: 0.25, ciHigh: 0.52 },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. EI KDE  (GUI-15) — redesigned to SINGLE support-gap curve + threshold
// ─────────────────────────────────────────────────────────────────────────────
// The support-gap KDE shows the distribution of (minority Dem support − non-minority Dem support)
// across precincts. ONE curve; threshold reference line overlaid.

// OR Latino support gap: centered ~0.33  (70% Latino vs 37% non-Latino Dem support)
write("mock-data/v1/ei-kde/OR_demo.json", {
  schemaVersion: "v1", chartType: "ei-kde",
  state: "OR", totalDistricts: 6, selectedGroup: "Latino",
  metricLabel: "Latino − non-Latino Dem support gap (2024 Presidential)",
  domain: [-0.20, 0.75],
  thresholdX: 0.25,
  thresholdLabel: "Prob(gap > 0.25)",
  thresholdProbability: 0.81,
  series: [
    {
      key: "support_gap",
      label: "Latino support gap",
      points: gaussianKde(0.33, 0.10, -0.20, 0.75, 60),
    },
  ],
});

// OR Asian support gap: centered ~0.28  (68% Asian vs 37% non-Asian)
write("mock-data/v1/ei-kde/OR_asian_demo.json", {
  schemaVersion: "v1", chartType: "ei-kde",
  state: "OR", totalDistricts: 6, selectedGroup: "Asian",
  metricLabel: "Asian − non-Asian Dem support gap (2024 Presidential)",
  domain: [-0.20, 0.70],
  thresholdX: 0.20,
  thresholdLabel: "Prob(gap > 0.20)",
  thresholdProbability: 0.74,
  series: [
    {
      key: "support_gap",
      label: "Asian support gap",
      points: gaussianKde(0.28, 0.11, -0.20, 0.70, 60),
    },
  ],
});

// SC Black support gap: centered ~0.56  (78% Black vs 22% non-Black Dem support)
// Very strongly right-shifted — high polarization
write("mock-data/v1/ei-kde/SC_demo.json", {
  schemaVersion: "v1", chartType: "ei-kde",
  state: "SC", totalDistricts: 7, selectedGroup: "Black",
  metricLabel: "Black − non-Black Dem support gap (2024 Presidential)",
  domain: [-0.10, 0.95],
  thresholdX: 0.40,
  thresholdLabel: "Prob(gap > 0.40)",
  thresholdProbability: 0.91,
  series: [
    {
      key: "support_gap",
      label: "Black support gap",
      points: gaussianKde(0.56, 0.09, -0.10, 0.95, 60),
    },
  ],
});

// SC Latino support gap: centered ~0.30  (54% Latino vs 22% non-Latino Dem support)
write("mock-data/v1/ei-kde/SC_latino_demo.json", {
  schemaVersion: "v1", chartType: "ei-kde",
  state: "SC", totalDistricts: 7, selectedGroup: "Latino",
  metricLabel: "Latino − non-Latino Dem support gap (2024 Presidential)",
  domain: [-0.15, 0.75],
  thresholdX: 0.20,
  thresholdLabel: "Prob(gap > 0.20)",
  thresholdProbability: 0.68,
  series: [
    {
      key: "support_gap",
      label: "Latino support gap",
      points: gaussianKde(0.30, 0.12, -0.15, 0.75, 60),
    },
  ],
});

console.log("\nAll mock data files written successfully.");
