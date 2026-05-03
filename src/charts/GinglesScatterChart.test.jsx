import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GinglesScatterChart from "./GinglesScatterChart.jsx";

vi.mock("recharts", () => {
  const passthrough = ({ children }) => <div>{children}</div>;
  const Legend = () => <div data-testid="legend" />;
  const Scatter = ({ name }) => <div>{name}</div>;
  const Line = ({ name }) => <div>{name}</div>;
  return {
    ResponsiveContainer: passthrough,
    ComposedChart: passthrough,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend,
    Scatter,
    Line,
  };
});

describe("GinglesScatterChart", () => {
  it("renders sampled points and regression labels from the locked payload shape", () => {
    const payload = {
      schemaVersion: "v1",
      chartType: "gingles-scatter",
      state: "OR",
      totalDistricts: 6,
      electionKey: "2024_pres",
      electionLabel: "2024 Presidential",
      selectedGroup: "Latino",
      units: { share: "decimal_0_to_1" },
      sampling: {
        isSampled: true,
        samplingAuthority: "preprocessing",
        samplingMethod: "minority_share_binned_random_seed_42_40_bins",
        displayedPointCount: 2,
        fullPrecinctCount: 1298,
        targetPointCount: 500,
      },
      points: [
        {
          precinctId: "1",
          minorityShare: 0.1,
          demVoteShare: 0.4,
          repVoteShare: 0.55,
          totalPopulation: 1000,
          minorityPopulation: 100,
        },
        {
          precinctId: "2",
          minorityShare: 0.2,
          demVoteShare: 0.5,
          repVoteShare: 0.45,
          totalPopulation: 900,
          minorityPopulation: 180,
        },
      ],
      regressionCurves: [
        {
          key: "dem_nlr",
          label: "Democratic best-fit regression",
          party: "DEM",
          curveType: "nonlinear_regression",
          points: [{ x: 0.0, y: 0.3 }, { x: 1.0, y: 0.6 }],
        },
        {
          key: "rep_nlr",
          label: "Republican best-fit regression",
          party: "REP",
          curveType: "nonlinear_regression",
          points: [{ x: 0.0, y: 0.65 }, { x: 1.0, y: 0.35 }],
        },
      ],
    };

    render(<GinglesScatterChart payload={payload} compact />);

    expect(screen.getByText("Democratic precinct points")).toBeInTheDocument();
    expect(screen.getByText("Republican precinct points")).toBeInTheDocument();
    expect(screen.getByText("Democratic best-fit regression")).toBeInTheDocument();
    expect(screen.getByText("Republican best-fit regression")).toBeInTheDocument();
  });
});
