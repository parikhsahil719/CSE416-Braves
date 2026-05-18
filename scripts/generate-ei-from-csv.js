const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_ROOT = path.join(ROOT, "preprocessing", "output", "ei");
const MODELED_GROUPS = ["white", "black", "asian", "latino"];
const GROUP_LABELS = {
  white: "White",
  black: "Black",
  asian: "Asian",
  latino: "Latino",
};
const CSV_GROUP_KEYS = {
  white: "white",
  black: "black",
  asian: "asian",
  latino: "hispanic",
};
const PARTIES = {
  DEM: {
    candidate: "Kamala Harris",
    voteFractionField: "dem",
    label: "Democratic",
  },
  REP: {
    candidate: "Donald Trump",
    voteFractionField: "rep",
    label: "Republican",
  },
};
const STATES = [
  {
    stateId: "OR",
    stateName: "Oregon",
    totalDistricts: 6,
    supportedGroups: ["latino", "white"],
    precinctCsv: path.join(ROOT, "preprocessing", "oregon_ei_precinct (1).csv"),
    statewideCsv: path.join(ROOT, "preprocessing", "oregon_ei_statewide (4).csv"),
    topologyJson: path.join(ROOT, "src", "data", "precincts_or.json"),
    samplesCsv: path.join(ROOT, "preprocessing", "oregon_ei_samples.csv"),
    overlapCsv: path.join(ROOT, "preprocessing", "output", "oregon_prepro15_overlap.csv"),
  },
  {
    stateId: "SC",
    stateName: "South Carolina",
    totalDistricts: 7,
    supportedGroups: ["black", "latino", "white"],
    precinctCsv: path.join(ROOT, "preprocessing", "south_carolina_ei_precinct.csv"),
    statewideCsv: path.join(ROOT, "preprocessing", "south_carolina_ei_statewide (1).csv"),
    topologyJson: path.join(ROOT, "src", "data", "precincts_sc.json"),
    samplesCsv: path.join(ROOT, "preprocessing", "south_carolina_ei_samples.csv"),
    overlapCsv: path.join(ROOT, "preprocessing", "output", "south_carolina_prepro15_overlap.csv"),
  },
];

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\"") {
      if (inQuotes && text[i + 1] === "\"") {
        cell += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  rows.push(row);

  const headers = rows[0];
  return rows.slice(1).filter((cells) => cells.some((v) => v !== "")).map((cells) => {
    const parsed = {};
    headers.forEach((header, index) => {
      parsed[header] = cells[index] ?? "";
    });
    return parsed;
  });
}

function readTopology(topologyPath) {
  const topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
  const objectKey = Object.keys(topology.objects)[0];
  const geometries = topology.objects[objectKey].geometries;
  const precincts = new Map();
  for (const geometry of geometries) {
    const props = geometry.properties;
    precincts.set(String(props.precinct_id), {
      total: toNumber(props.total),
      total_votes: toNumber(props.total_votes),
      white: toNumber(props.white),
      black: toNumber(props.black),
      asian: toNumber(props.asian),
      latino: toNumber(props.hispanic),
    });
  }
  return precincts;
}

function toNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Expected numeric value but received ${value}`);
  }
  return numeric;
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function writeJson(relativePath, payload) {
  const fullPath = path.join(OUTPUT_ROOT, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log("wrote", path.relative(ROOT, fullPath));
}

function weightedMean(values, weights) {
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    numerator += values[index] * weights[index];
    denominator += weights[index];
  }
  return denominator > 0 ? numerator / denominator : 0;
}

function weightedQuantile(values, weights, quantile) {
  const rows = values
    .map((value, index) => ({ value, weight: weights[index] }))
    .filter((row) => row.weight > 0)
    .sort((left, right) => left.value - right.value);
  if (rows.length === 0) return 0;
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const target = totalWeight * quantile;
  let cumulative = 0;
  for (const row of rows) {
    cumulative += row.weight;
    if (cumulative >= target) return row.value;
  }
  return rows[rows.length - 1].value;
}

function weightedStd(values, weights) {
  const mean = weightedMean(values, weights);
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const delta = values[index] - mean;
    numerator += weights[index] * delta * delta;
    denominator += weights[index];
  }
  return denominator > 0 ? Math.sqrt(numerator / denominator) : 0;
}

function effectiveSampleSize(weights) {
  const sum = weights.reduce((value, weight) => value + weight, 0);
  const squaredSum = weights.reduce((value, weight) => value + (weight * weight), 0);
  return squaredSum > 0 ? (sum * sum) / squaredSum : 0;
}

function gaussian(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function weightedKde(values, weights, minX, maxX, steps) {
  const filtered = values
    .map((value, index) => ({ value, weight: weights[index] }))
    .filter((row) => row.weight > 0);
  if (filtered.length === 0) return [];

  const filteredValues = filtered.map((row) => row.value);
  const filteredWeights = filtered.map((row) => row.weight);
  const std = weightedStd(filteredValues, filteredWeights);
  const nEff = effectiveSampleSize(filteredWeights);
  const bandwidth = Math.max(
    0.025,
    Number.isFinite(std) && std > 0 ? 1.06 * std * Math.pow(Math.max(nEff, 2), -0.2) : 0.05,
  );
  const totalWeight = filteredWeights.reduce((value, weight) => value + weight, 0);
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const x = minX + ((maxX - minX) * index) / steps;
    let density = 0;
    for (let rowIndex = 0; rowIndex < filtered.length; rowIndex += 1) {
      density += filtered[rowIndex].weight * gaussian((x - filtered[rowIndex].value) / bandwidth);
    }
    density /= totalWeight * bandwidth;
    points.push({ x: round(x, 4), density: round(density, 6) });
  }
  return points;
}

function precinctSupportField(groupKey, partyKey) {
  return `ei_${CSV_GROUP_KEYS[groupKey]}_${PARTIES[partyKey].voteFractionField}_vote_fraction`;
}

function labelForGroup(groupKey) {
  return GROUP_LABELS[groupKey];
}

function comparisonLabel(groupKey) {
  return `Non-${labelForGroup(groupKey)}`;
}

function normalizeStatewideRows(rows) {
  const result = {};
  for (const row of rows) {
    const groupKey = row.racial_group === "hispanic" ? "latino" : row.racial_group;
    result[groupKey] = {
      confidence: toNumber(row.confidence),
      mean_dem_fraction: toNumber(row.mean_dem_fraction),
      mean_rep_fraction: toNumber(row.mean_rep_fraction),
    };
  }
  return result;
}

function parseSamplesCsv(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const rows = parseCsv(filePath);
  const result = {};
  for (const row of rows) {
    const groupKey = row.racial_group === "hispanic" ? "latino" : row.racial_group;
    const parseDraws = (raw, fieldName) => {
      const tokens = (raw || "").split(",");
      const draws = [];
      for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index].trim();
        if (token === "") continue;
        const numeric = Number(token);
        if (!Number.isFinite(numeric)) {
          throw new Error(
            `Invalid ${fieldName} draw for ${row.state} ${groupKey} at token ${index}: "${token}"`,
          );
        }
        draws.push(numeric);
      }
      if (draws.length === 0) {
        throw new Error(`No numeric draws found in ${fieldName} for ${row.state} ${groupKey}`);
      }
      return draws;
    };
    const b1 = parseDraws(row.b1_samples, "b1_samples");
    const b2 = parseDraws(row.b2_samples, "b2_samples");
    if (b1.length !== b2.length) {
      throw new Error(
        `Draw length mismatch for ${row.state} ${groupKey}: b1_samples=${b1.length}, b2_samples=${b2.length}`,
      );
    }
    result[groupKey] = {
      b1,
      b2,
    };
  }
  return result;
}

function parseOverlapCsv(filePath) {
  const rows = parseCsv(filePath);
  const result = {};
  for (const row of rows) {
    const groupKey = row.group === "hispanic" ? "latino" : row.group;
    result[groupKey] = {
      overlapPct: toNumber(row.overlap_pct_of_white),
      polarizationPct: toNumber(row.polarization_pct),
    };
  }
  return result;
}

function buildComparisonSupport(precinctRow, precinctDemo, focalGroup, partyKey) {
  const otherGroups = MODELED_GROUPS.filter((groupKey) => groupKey !== focalGroup);
  let weightedSum = 0;
  let totalWeight = 0;
  for (const groupKey of otherGroups) {
    const groupWeight = precinctDemo[groupKey];
    if (groupWeight <= 0) continue;
    weightedSum += groupWeight * toNumber(precinctRow[precinctSupportField(groupKey, partyKey)]);
    totalWeight += groupWeight;
  }
  if (totalWeight <= 0) return null;
  return { value: weightedSum / totalWeight, weight: totalWeight };
}

function buildSupportPayload(stateConfig, focalGroup, partyKey, precinctRows, precinctDemographics, statewideRows, statewideGroupTotals, mcmcSamples, overlapData) {
  const comparisonGroups = MODELED_GROUPS.filter((groupKey) => groupKey !== focalGroup);
  const comparisonConfidenceWeights = comparisonGroups.map((groupKey) => statewideGroupTotals[groupKey] ?? 0);
  const comparisonConfidences = comparisonGroups.map((groupKey) => statewideRows[groupKey].confidence);

  let focalValues, compValues, uniformWeights;

  if (mcmcSamples && mcmcSamples[focalGroup]) {
    // Use MCMC posterior samples for narrow, accurate bell curves
    const groupSamples = mcmcSamples[focalGroup];
    const focalDraws = groupSamples.b1;
    const compDraws = groupSamples.b2;
    uniformWeights = new Array(focalDraws.length).fill(1);
    // Posterior draws are always DEM support — invert for REP
    focalValues = partyKey === "REP" ? focalDraws.map((v) => 1 - v) : focalDraws;
    compValues  = partyKey === "REP" ? compDraws.map((v) => 1 - v) : compDraws;
  } else {
    // Fallback: per-precinct estimates (wide curves — run finalprepro_9.py on Colab for proper curves)
    console.warn(`  [warn] MCMC samples not found for ${stateConfig.stateId} ${focalGroup} — using per-precinct estimates`);
    const focalPrecinct = [];
    const focalPrecWeights = [];
    const compPrecinct = [];
    const compPrecWeights = [];
    for (const precinctRow of precinctRows) {
      const precinctId = String(precinctRow.precinct_id);
      const precinctDemo = precinctDemographics.get(precinctId);
      if (!precinctDemo) continue;
      const fw = precinctDemo[focalGroup];
      if (fw > 0) {
        focalPrecinct.push(toNumber(precinctRow[precinctSupportField(focalGroup, partyKey)]));
        focalPrecWeights.push(fw);
      }
      const comparison = buildComparisonSupport(precinctRow, precinctDemo, focalGroup, partyKey);
      if (comparison && comparison.weight > 0) {
        compPrecinct.push(comparison.value);
        compPrecWeights.push(comparison.weight);
      }
    }
    focalValues = focalPrecinct;
    compValues  = compPrecinct;
    uniformWeights = null; // signals use of precinctWeights below
    // Rebuild using weighted KDE directly and return early
    const overlapEntry2 = overlapData[focalGroup] ?? null;
    return {
      schemaVersion: "v1",
      chartType: "ei-support",
      state: stateConfig.stateId,
      totalDistricts: stateConfig.totalDistricts,
      election: "2024 Presidential",
      selectedCandidate: PARTIES[partyKey].candidate,
      selectedGroup: labelForGroup(focalGroup),
      units: { share: "decimal_0_to_1" },
      overlapPct: overlapEntry2 !== null ? round(overlapEntry2.overlapPct, 4) : null,
      polarizationPct: overlapEntry2 !== null ? round(overlapEntry2.polarizationPct, 4) : null,
      series: [
        {
          key: focalGroup,
          label: labelForGroup(focalGroup),
          confidenceScore: round(statewideRows[focalGroup].confidence, 4),
          points: weightedKde(focalPrecinct, focalPrecWeights, 0, 1, 80).map((pt) => ({ xSupportShare: pt.x, density: pt.density })),
        },
        {
          key: `non_${focalGroup}`,
          label: comparisonLabel(focalGroup),
          confidenceScore: round(weightedMean(comparisonConfidences, comparisonConfidenceWeights), 4),
          points: weightedKde(compPrecinct, compPrecWeights, 0, 1, 80).map((pt) => ({ xSupportShare: pt.x, density: pt.density })),
        },
      ],
    };
  }

  const overlapEntry = overlapData[focalGroup] ?? null;

  return {
    schemaVersion: "v1",
    chartType: "ei-support",
    state: stateConfig.stateId,
    totalDistricts: stateConfig.totalDistricts,
    election: "2024 Presidential",
    selectedCandidate: PARTIES[partyKey].candidate,
    selectedGroup: labelForGroup(focalGroup),
    units: { share: "decimal_0_to_1" },
    overlapPct: overlapEntry !== null ? round(overlapEntry.overlapPct, 4) : null,
    polarizationPct: overlapEntry !== null ? round(overlapEntry.polarizationPct, 4) : null,
    series: [
      {
        key: focalGroup,
        label: labelForGroup(focalGroup),
        confidenceScore: round(statewideRows[focalGroup].confidence, 4),
        points: weightedKde(focalValues, uniformWeights, 0, 1, 80).map((point) => ({
          xSupportShare: point.x,
          density: point.density,
        })),
      },
      {
        key: `non_${focalGroup}`,
        label: comparisonLabel(focalGroup),
        confidenceScore: round(weightedMean(comparisonConfidences, comparisonConfidenceWeights), 4),
        points: weightedKde(compValues, uniformWeights, 0, 1, 80).map((point) => ({
          xSupportShare: point.x,
          density: point.density,
        })),
      },
    ],
  };
}

function buildBarPayload(stateConfig, focalGroup, partyKey, precinctRows, precinctDemographics, statewideRows, mcmcSamples) {
  const categories = MODELED_GROUPS.map((groupKey) => {
    const samplesForGroup = mcmcSamples?.[groupKey]?.b1 ?? null;
    const hasSamples = Array.isArray(samplesForGroup) && samplesForGroup.length > 0;
    const values = [];
    const weights = [];
    let ciLow;
    let ciHigh;

    if (hasSamples) {
      const sampleValues = partyKey === "REP" ? samplesForGroup.map((v) => 1 - v) : samplesForGroup.slice();
      ciLow = weightedQuantile(sampleValues, new Array(sampleValues.length).fill(1), 0.025);
      ciHigh = weightedQuantile(sampleValues, new Array(sampleValues.length).fill(1), 0.975);
    } else {
      for (const precinctRow of precinctRows) {
        const precinctDemo = precinctDemographics.get(String(precinctRow.precinct_id));
        if (!precinctDemo) continue;
        const groupWeight = precinctDemo[groupKey];
        if (groupWeight <= 0) continue;
        values.push(toNumber(precinctRow[precinctSupportField(groupKey, partyKey)]));
        weights.push(groupWeight);
      }
      ciLow = weightedQuantile(values, weights, 0.025);
      ciHigh = weightedQuantile(values, weights, 0.975);
    }

    const peak = statewideRows[groupKey][`mean_${PARTIES[partyKey].voteFractionField}_fraction`];
    return {
      category: labelForGroup(groupKey),
      peak: round(peak),
      ciLow: round(Math.min(ciLow, peak)),
      ciHigh: round(Math.max(ciHigh, peak)),
    };
  });

  return {
    schemaVersion: "v1",
    chartType: "ei-precinct-bar-ci",
    state: stateConfig.stateId,
    totalDistricts: stateConfig.totalDistricts,
    election: "2024 Presidential",
    selectedCandidate: PARTIES[partyKey].candidate,
    categories,
  };
}

function buildKdePayload(stateConfig, focalGroup, partyKey, precinctRows, precinctDemographics) {
  const gaps = [];
  const gapWeights = [];
  for (const precinctRow of precinctRows) {
    const precinctDemo = precinctDemographics.get(String(precinctRow.precinct_id));
    if (!precinctDemo) continue;
    const focalWeight = precinctDemo[focalGroup];
    if (focalWeight <= 0) continue;
    const comparison = buildComparisonSupport(precinctRow, precinctDemo, focalGroup, partyKey);
    if (!comparison) continue;
    const focalSupport = toNumber(precinctRow[precinctSupportField(focalGroup, partyKey)]);
    gaps.push(focalSupport - comparison.value);
    gapWeights.push(focalWeight);
  }

  const points = weightedKde(gaps, gapWeights, -1, 1, 160);
  return {
    schemaVersion: "v1",
    chartType: "ei-kde",
    state: stateConfig.stateId,
    totalDistricts: stateConfig.totalDistricts,
    selectedGroup: labelForGroup(focalGroup),
    metricLabel: `${labelForGroup(focalGroup)} - ${comparisonLabel(focalGroup)} ${PARTIES[partyKey].label} support gap (2024 Presidential)`,
    domain: [-1, 1],
    thresholdX: null,
    thresholdLabel: "",
    thresholdProbability: null,
    series: [
      {
        key: "support_gap",
        label: `${labelForGroup(focalGroup)} support gap`,
        points,
      },
    ],
  };
}

function validateSupportPayload(payload) {
  for (const series of payload.series) {
    let previousX = -Infinity;
    for (const point of series.points) {
      if (point.xSupportShare < 0 || point.xSupportShare > 1) {
        throw new Error(`Support share out of range for ${payload.state} ${payload.selectedGroup}`);
      }
      if (point.density < 0) {
        throw new Error(`Negative support density for ${payload.state} ${payload.selectedGroup}`);
      }
      if (point.xSupportShare < previousX) {
        throw new Error(`Support points not monotonic for ${payload.state} ${payload.selectedGroup}`);
      }
      previousX = point.xSupportShare;
    }
  }
}

function validateBarPayload(payload) {
  for (const category of payload.categories) {
    if (category.peak < 0 || category.peak > 1 || category.ciLow < 0 || category.ciHigh > 1) {
      throw new Error(`Bar category out of range for ${payload.state} ${category.category}`);
    }
    if (category.ciLow > category.peak || category.peak > category.ciHigh) {
      throw new Error(`CI ordering invalid for ${payload.state} ${category.category}`);
    }
  }
}

function validateKdePayload(payload) {
  let previousX = -Infinity;
  for (const point of payload.series[0].points) {
    if (point.x < -1 || point.x > 1) {
      throw new Error(`KDE x out of range for ${payload.state} ${payload.selectedGroup}`);
    }
    if (point.density < 0) {
      throw new Error(`Negative KDE density for ${payload.state} ${payload.selectedGroup}`);
    }
    if (point.x < previousX) {
      throw new Error(`KDE points not monotonic for ${payload.state} ${payload.selectedGroup}`);
    }
    previousX = point.x;
  }
}

function generateForState(stateConfig) {
  const precinctRows = parseCsv(stateConfig.precinctCsv);
  const statewideRows = normalizeStatewideRows(parseCsv(stateConfig.statewideCsv));
  const precinctDemographics = readTopology(stateConfig.topologyJson);
  const mcmcSamples = parseSamplesCsv(stateConfig.samplesCsv);
  const overlapData = parseOverlapCsv(stateConfig.overlapCsv);

  const statewideGroupTotals = {};
  for (const groupKey of MODELED_GROUPS) {
    statewideGroupTotals[groupKey] = 0;
  }
  for (const precinctDemo of precinctDemographics.values()) {
    for (const groupKey of MODELED_GROUPS) {
      statewideGroupTotals[groupKey] += precinctDemo[groupKey];
    }
  }

  for (const precinctRow of precinctRows) {
    if (!precinctDemographics.has(String(precinctRow.precinct_id))) {
      throw new Error(`Missing precinct topology row for precinct_id=${precinctRow.precinct_id} in ${stateConfig.stateId}`);
    }
  }

  for (const focalGroup of stateConfig.supportedGroups) {
    for (const partyKey of Object.keys(PARTIES)) {
      const supportPayload = buildSupportPayload(
        stateConfig,
        focalGroup,
        partyKey,
        precinctRows,
        precinctDemographics,
        statewideRows,
        statewideGroupTotals,
        mcmcSamples,
        overlapData,
      );
      const barPayload = buildBarPayload(
        stateConfig,
        focalGroup,
        partyKey,
        precinctRows,
        precinctDemographics,
        statewideRows,
        mcmcSamples,
      );
      const kdePayload = buildKdePayload(
        stateConfig,
        focalGroup,
        partyKey,
        precinctRows,
        precinctDemographics,
      );

      validateSupportPayload(supportPayload);
      validateBarPayload(barPayload);
      validateKdePayload(kdePayload);

      writeJson(
        path.join("ei-support", `${stateConfig.stateId}_${focalGroup}_2024_president_${partyKey}.json`),
        supportPayload,
      );
      writeJson(
        path.join("ei-precinct-bar-ci", `${stateConfig.stateId}_${focalGroup}_2024_pres_${partyKey}.json`),
        barPayload,
      );
      writeJson(
        path.join("ei-kde", `${stateConfig.stateId}_${focalGroup}_2024_pres_support_gap_${partyKey}.json`),
        kdePayload,
      );
    }
  }
}

function main() {
  for (const stateConfig of STATES) {
    generateForState(stateConfig);
  }
}

main();
