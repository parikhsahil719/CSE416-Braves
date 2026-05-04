import React from "react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StatePage from "./StatePage.jsx";

const queryState = {
  summary: { data: null, isLoading: false, isError: false },
  ensemble: { data: { finalPlanCount: "5,000", populationEqualityThreshold: "0.50%" }, isLoading: false, isError: false },
  districts: { data: { districts: [] }, isLoading: false, isError: false },
  topology: { data: null, isLoading: false, isError: false },
};

vi.mock("../queries/stateQueries.js", () => ({
  useStateSummary: () => queryState.summary,
  useEnsemblesSummary: () => queryState.ensemble,
  useDistrictTable: () => queryState.districts,
  useDistrictTopology: () => queryState.topology,
}));

vi.mock("./DistrictMap", () => ({
  default: () => <div data-testid="district-map" />,
}));

vi.mock("./MinorityHeatMap", () => ({
  default: () => <div data-testid="minority-heat-map" />,
}));

describe("StatePage", () => {
  beforeEach(() => {
    queryState.summary = { data: null, isLoading: false, isError: false };
    queryState.ensemble = { data: { finalPlanCount: "5,000", populationEqualityThreshold: "0.50%" }, isLoading: false, isError: false };
    queryState.districts = { data: { districts: [] }, isLoading: false, isError: false };
    queryState.topology = { data: null, isLoading: false, isError: false };
  });

  afterEach(() => {
    cleanup();
  });

  function renderStatePage(path) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/states/:stateName"
            element={<StatePage currMap="Precinct Heat Map" currMinority="Latino" switchMinority={vi.fn()} />}
          />
        </Routes>
      </MemoryRouter>
    );
  }

  it("renders Oregon state summary from the backend query response", () => {
    queryState.summary = {
      data: {
        population: "3,370,625",
        WhitePopulation: "2,526,251",
        BlackPopulation: "60,012",
        AsianPopulation: "194,538",
        HispanicPopulation: "389,384",
        voterDistributionDem: "1,240,600 (55.27%)",
        voterDistributionRep: "919,480 (40.97%)",
        partyControl: "Democratic",
        democratReps: "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas",
        republicanReps: "Cliff Bentz",
      },
      isLoading: false,
      isError: false,
    };

    renderStatePage("/states/Oregon");

    expect(screen.getByText("Population:")).toBeInTheDocument();
    expect(screen.getByText("3,370,625")).toBeInTheDocument();
    expect(screen.getByText("White Population:")).toBeInTheDocument();
    expect(screen.getByText("2,526,251")).toBeInTheDocument();
    expect(screen.getByText("Latino Population:")).toBeInTheDocument();
    expect(screen.getByText("389,384")).toBeInTheDocument();
    expect(screen.getByText("1,240,600 (55.27%) / 919,480 (40.97%)")).toBeInTheDocument();
    expect(screen.getByText("Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas")).toBeInTheDocument();
    expect(screen.getByText("Cliff Bentz")).toBeInTheDocument();
  });

  it("shows an error state instead of local fallback summary data when the backend request fails", () => {
    queryState.summary = {
      data: null,
      isLoading: false,
      isError: true,
    };

    renderStatePage("/states/Oregon");

    expect(screen.getByText("Unable to load backend state summary.")).toBeInTheDocument();
    expect(screen.queryByText("3,370,625")).not.toBeInTheDocument();
    expect(screen.queryByText("Cliff Bentz")).not.toBeInTheDocument();
  });
});
