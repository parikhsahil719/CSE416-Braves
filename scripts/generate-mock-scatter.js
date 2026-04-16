/**
 * Generates realistic Gingles scatter data for all four group/state combos.
 * Uses a seeded LCG PRNG so output is deterministic.
 *
 * Oregon:  ~1680 precincts
 * SC:      ~2400 precincts
 */

const fs = require("fs");
const path = require("path");

// ─── Seeded LCG PRNG ──────────────────────────────────────────────────────────
let _seed = 20240101;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
  return ((_seed >>> 0) / 0xffffffff);
}
function setSeed(s) { _seed = s; }

// Gaussian via Box-Muller
function randn(mu = 0, sigma = 1) {
  let u, v;
  do { u = rand(); } while (u === 0);
  do { v = rand(); } while (v === 0);
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, x)); }
function round(x, d = 4) { return parseFloat(x.toFixed(d)); }

// ─── Precinct generator ───────────────────────────────────────────────────────
/**
 * @param {string} state       'OR' | 'SC'
 * @param {string} group       'latino' | 'asian' | 'black'
 * @param {number} n           number of precincts to generate
 * @param {object} params      shape parameters
 */
function generatePrecincts(state, group, n, params) {
  const points = [];

  for (let i = 0; i < n; i++) {
    const id = `${state}-P${String(i + 1).padStart(4, "0")}`;

    // ── Minority share ─────────────────────────────────────────────────────────
    // Model as a mixture: most precincts are low, some are high.
    let minShare;
    if (rand() < params.highConc) {
      // concentrated precinct
      minShare = clamp(randn(params.highMu, params.highSigma));
    } else {
      // typical precinct
      minShare = clamp(Math.abs(randn(params.lowMu, params.lowSigma)));
    }
    minShare = round(minShare, 4);

    // ── Vote shares ────────────────────────────────────────────────────────────
    // Dem share increases with minority share (Gingles 2/3 polarization)
    // Use a logistic-like relationship + noise
    const demBase = params.demIntercept + params.demSlope * minShare;
    const demNoise = randn(0, params.voteNoiseSigma);
    const demShare = round(clamp(demBase + demNoise, 0.05, 0.97), 4);
    const repShare = round(clamp(1 - demShare + randn(0, 0.02), 0.02, 0.95), 4);

    // ── Population ────────────────────────────────────────────────────────────
    const totalPop = Math.round(1200 + rand() * 2400);
    const minPop   = Math.round(totalPop * minShare);

    points.push({
      precinctId: id,
      minorityShare: minShare,
      demVoteShare: demShare,
      repVoteShare: repShare,
      totalPopulation: totalPop,
      minorityPopulation: minPop,
    });
  }

  // Sort by minority share ascending (cleaner scatter appearance)
  points.sort((a, b) => a.minorityShare - b.minorityShare);
  return points;
}

// ─── Regression curve ─────────────────────────────────────────────────────────
function regressionCurve(party, demIntercept, demSlope, xMin = 0.02, xMax = 0.90, steps = 20) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = round(xMin + (xMax - xMin) * (i / steps), 3);
    const demY = clamp(demIntercept + demSlope * x);
    if (party === "DEM") {
      pts.push({ x, y: round(demY, 3) });
    } else {
      pts.push({ x, y: round(clamp(1 - demY), 3) });
    }
  }
  return pts;
}

// ─── Configurations ───────────────────────────────────────────────────────────
const CONFIGS = {
  // Oregon Latino: 11% CVAP statewide, concentrated in Willamette Valley
  // Oregon is a blue state; low-minority precincts still lean Dem
  OR_latino: {
    n: 1682,
    demIntercept: 0.465,  // baseline Dem support in low-Latino areas
    demSlope:     0.50,   // increase per unit of Latino share
    voteNoiseSigma: 0.045,
    highConc:     0.12,   // 12% of precincts are high-concentration
    highMu:       0.31,
    highSigma:    0.08,
    lowMu:        0.07,
    lowSigma:     0.045,
    xMin: 0.02, xMax: 0.85,
  },
  // Oregon Asian: 5.5% CVAP statewide, very concentrated in Portland
  OR_asian: {
    n: 1682,
    demIntercept: 0.505,
    demSlope:     0.45,
    voteNoiseSigma: 0.043,
    highConc:     0.06,
    highMu:       0.16,
    highSigma:    0.05,
    lowMu:        0.035,
    lowSigma:     0.03,
    xMin: 0.01, xMax: 0.55,
  },
  // SC Black: 25% CVAP statewide, bimodal distribution
  // SC is a red state; strong polarization (Gingles 2/3 clearly satisfied)
  SC_black: {
    n: 2388,
    demIntercept: 0.215,  // low-Black SC precincts are strongly Republican
    demSlope:     0.77,   // sharp increase as Black share rises
    voteNoiseSigma: 0.040,
    highConc:     0.26,
    highMu:       0.58,
    highSigma:    0.15,
    lowMu:        0.14,
    lowSigma:     0.07,
    xMin: 0.01, xMax: 0.95,
  },
  // SC Latino: 6.7% CVAP statewide, scattered
  // Moderate polarization in SC context
  SC_latino: {
    n: 2388,
    demIntercept: 0.245,
    demSlope:     0.50,
    voteNoiseSigma: 0.042,
    highConc:     0.05,
    highMu:       0.18,
    highSigma:    0.06,
    lowMu:        0.04,
    lowSigma:     0.028,
    xMin: 0.01, xMax: 0.60,
  },
};

// ─── Build scatter JSON ───────────────────────────────────────────────────────
function buildScatter(state, group, label, cfg) {
  setSeed(state.charCodeAt(0) * 1000 + group.charCodeAt(0) * 100);
  const points = generatePrecincts(state, group, cfg.n, cfg);
  const demCurve = regressionCurve("DEM", cfg.demIntercept, cfg.demSlope, cfg.xMin, cfg.xMax);
  const repCurve = regressionCurve("REP", cfg.demIntercept, cfg.demSlope, cfg.xMin, cfg.xMax);
  const totalDistricts = state === "OR" ? 6 : 7;

  return {
    schemaVersion: "v1",
    chartType: "gingles-scatter",
    state,
    totalDistricts,
    election: "2024 Presidential",
    selectedGroup: label,
    units: { share: "decimal_0_to_1" },
    points,
    regressionCurves: [
      {
        key: "dem_nlr",
        label: "Democratic best-fit regression",
        party: "DEM",
        curveType: "best_fit",
        points: demCurve,
      },
      {
        key: "rep_nlr",
        label: "Republican best-fit regression",
        party: "REP",
        curveType: "best_fit",
        points: repCurve,
      },
    ],
  };
}

// ─── Build table JSON (first 100 precincts, sorted by minority share desc) ───
function buildTable(state, group, label, scatterData) {
  const totalDistricts = state === "OR" ? 6 : 7;
  const rows = scatterData.points
    .slice()
    .sort((a, b) => b.minorityShare - a.minorityShare)
    .slice(0, 100)
    .map((p, i) => ({
      precinctId: p.precinctId,
      precinctName: `${label} Precinct ${i + 1}`,
      totalPopulation: p.totalPopulation,
      minorityPopulation: p.minorityPopulation,
      republicanVotes: Math.round(p.totalPopulation * p.repVoteShare * 0.65),
      democraticVotes: Math.round(p.totalPopulation * p.demVoteShare * 0.65),
      minorityShare: p.minorityShare,
      repVoteShare: p.repVoteShare,
      demVoteShare: p.demVoteShare,
    }));

  return {
    schemaVersion: "v1",
    tableType: "gingles-precinct-table",
    state,
    election: "2024 Presidential",
    selectedGroup: label,
    totalDistricts,
    rows,
  };
}

// ─── Write files ───────────────────────────────────────────────────────────────
const OUT_SCATTER = path.resolve(__dirname, "../mock-data/v1/gingles-scatter");
const OUT_TABLE   = path.resolve(__dirname, "../mock-data/v1/gingles-table");

const jobs = [
  { state: "OR", group: "latino", label: "Latino",  cfgKey: "OR_latino" },
  { state: "OR", group: "asian",  label: "Asian",   cfgKey: "OR_asian"  },
  { state: "SC", group: "black",  label: "Black",   cfgKey: "SC_black"  },
  { state: "SC", group: "latino", label: "Latino",  cfgKey: "SC_latino" },
];

for (const { state, group, label, cfgKey } of jobs) {
  const cfg = CONFIGS[cfgKey];
  const scatter = buildScatter(state, group, label, cfg);
  const table   = buildTable(state, group, label, scatter);

  const scatterFile = path.join(OUT_SCATTER, `${state}_2024_${group}.json`);
  const tableFile   = path.join(OUT_TABLE,   `${state}_2024_${group}.json`);

  fs.writeFileSync(scatterFile, JSON.stringify(scatter, null, 2));
  fs.writeFileSync(tableFile,   JSON.stringify(table,   null, 2));

  const pointCount = scatter.points.length;
  const avgDem = scatter.points.reduce((s, p) => s + p.demVoteShare, 0) / pointCount;
  const avgMin = scatter.points.reduce((s, p) => s + p.minorityShare, 0) / pointCount;
  console.log(`${state} ${label}: ${pointCount} precincts | avg minority share ${(avgMin*100).toFixed(1)}% | avg dem ${(avgDem*100).toFixed(1)}%`);
}

console.log("\nDone — scatter + table files written.");
