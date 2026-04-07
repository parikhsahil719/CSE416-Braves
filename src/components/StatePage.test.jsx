import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import StatePage from "./StatePage.jsx";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("leaflet", () => ({
  default: {
    control: vi.fn(() => {
      const control = {
        onAdd: null,
        addTo: vi.fn(() => {
          if (typeof control.onAdd === "function") {
            control._div = control.onAdd();
          }
          return control;
        }),
        remove: vi.fn(),
      };
      return control;
    }),
    DomUtil: {
      create: (tagName, className) => {
        const element = document.createElement(tagName);
        element.className = className;
        return element;
      },
    },
  },
}));

vi.mock("react-leaflet", async () => {
  const ReactModule = await import("react");

  function createLayer(feature) {
    const handlers = {};

    return {
      feature,
      handlers,
      on(nextHandlers) {
        Object.assign(handlers, nextHandlers);
      },
      setStyle: vi.fn(),
      bringToFront: vi.fn(),
    };
  }

  const GeoJSON = ReactModule.forwardRef(function MockGeoJSON({ data, onEachFeature }, ref) {
    const layers = ReactModule.useMemo(
      () => (data?.features ?? []).map((feature) => createLayer(feature)),
      [data]
    );

    ReactModule.useEffect(() => {
      layers.forEach((layer) => onEachFeature?.(layer.feature, layer));
    }, [layers, onEachFeature]);

    ReactModule.useImperativeHandle(ref, () => ({
      eachLayer(callback) {
        layers.forEach(callback);
      },
      resetStyle: vi.fn(),
    }), [layers]);

    return (
      <div data-testid="mock-geojson">
        {layers.map((layer) => {
          const districtNumber = layer.feature.properties.district_number;

          return (
            <button
              key={districtNumber}
              type="button"
              data-testid={`map-district-${districtNumber}`}
              onClick={() => layer.handlers.click?.({ target: layer })}
            >
              Map district {districtNumber}
            </button>
          );
        })}
      </div>
    );
  });

  return {
    GeoJSON,
    MapContainer: ({ children, className }) => <div data-testid="map-container" className={className}>{children}</div>,
    TileLayer: () => null,
    useMap: () => ({}),
  };
});

function TestNavigator() {
  const navigate = useNavigate();

  return (
    <div>
      <button type="button" onClick={() => navigate("/state/Oregon")}>Go Oregon</button>
      <button type="button" onClick={() => navigate("/state/South Carolina")}>Go South Carolina</button>
    </div>
  );
}

function renderStatePage({ initialPath = "/state/Oregon", initialState = null } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state: initialState }]}>
      <Routes>
        <Route
          path="/state/:stateName"
          element={(
            <>
              <TestNavigator />
              <StatePage />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>
  );
}

function mockBackendResponses({
  summary = {
    population: "9,999",
    voterDistributionDem: "60%",
    voterDistributionRep: "40%",
    partyControl: "Democrat",
    democratReps: "Backend Dem",
    republicanReps: "Backend Rep",
  },
  ensembleSummary = {
    schemaVersion: "v1",
    state: "OR",
    finalPlanCount: 5000,
    populationEqualityThreshold: "0.50%",
  },
  topology = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          district_number: 4,
          NAMELSAD: "Congressional District 4",
          RESULT: "DEMOCRATIC",
        },
        geometry: null,
      },
    ],
  },
  table = {
    districts: [
      {
        districtNumber: 4,
        representative: "Backend Rep",
        party: "Democrat",
        racialEthnicGroup: "Latino",
        voteMargin2024: 12.3,
      },
    ],
  },
  summaryError = false,
  ensembleError = false,
  tableError = false,
  topologyError = false,
} = {}) {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/ensembles-summary")) {
      return ensembleError ? Promise.reject(new Error("ensemble failed")) : Promise.resolve({ data: ensembleSummary });
    }

    if (url.endsWith("/state-summary")) {
      return summaryError ? Promise.reject(new Error("summary failed")) : Promise.resolve({ data: summary });
    }

    if (url.endsWith("/districts/enacted/topology")) {
      return topologyError ? Promise.reject(new Error("topology failed")) : Promise.resolve({ data: topology });
    }

    if (url.endsWith("/districts/enacted/table")) {
      return tableError ? Promise.reject(new Error("table failed")) : Promise.resolve({ data: table });
    }

    return Promise.reject(new Error(`Unhandled url: ${url}`));
  });
}

describe("StatePage", () => {
  let getEntriesByTypeSpy;

  beforeEach(() => {
    axios.get.mockReset();
    getEntriesByTypeSpy = vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { type: "navigate" },
    ]);
  });

  afterEach(() => {
    getEntriesByTypeSpy.mockRestore();
    cleanup();
  });

  it("loads map topology and state summary on initial direct render", async () => {
    mockBackendResponses();
    renderStatePage();

    await screen.findByTestId("map-district-4");
    await screen.findByText("9,999");

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, "/api/states/OR/districts/enacted/topology");
    expect(axios.get).toHaveBeenNthCalledWith(2, "/api/states/OR/state-summary");
  });

  it("uses splash-prefetched summary without issuing a duplicate summary request", async () => {
    mockBackendResponses({
      summary: {
        population: "8,888",
        voterDistributionDem: "58%",
        voterDistributionRep: "42%",
        partyControl: "Democrat",
        democratReps: "Prefetched Dem",
        republicanReps: "Prefetched Rep",
      },
    });

    renderStatePage({
      initialState: {
        prefetchedStateId: "OR",
        prefetchedStateSummary: {
          population: "8,888",
          voterDistributionDem: "58%",
          voterDistributionRep: "42%",
          partyControl: "Democrat",
          democratReps: "Prefetched Dem",
          republicanReps: "Prefetched Rep",
        },
      },
    });

    await screen.findByTestId("map-district-4");

    expect(screen.getByText("8,888")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("State"));
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("calls state-summary on refresh even if route state still contains a prefetched summary", async () => {
    getEntriesByTypeSpy.mockReturnValue([{ type: "reload" }]);

    mockBackendResponses({
      summary: {
        population: "7,777",
        voterDistributionDem: "54%",
        voterDistributionRep: "46%",
        partyControl: "Democrat",
        democratReps: "Reloaded Dem",
        republicanReps: "Reloaded Rep",
      },
    });

    renderStatePage({
      initialState: {
        prefetchedStateId: "OR",
        prefetchedStateSummary: {
          population: "8,888",
          voterDistributionDem: "58%",
          voterDistributionRep: "42%",
          partyControl: "Democrat",
          democratReps: "Prefetched Dem",
          republicanReps: "Prefetched Rep",
        },
      },
    });

    await screen.findByTestId("map-district-4");
    expect(await screen.findByText("7,777")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(2, "/api/states/OR/state-summary");
  });

  it("reuses the state summary cache after direct entry refresh loading", async () => {
    mockBackendResponses();
    renderStatePage();

    await screen.findByTestId("map-district-4");
    await screen.findByText("9,999");

    fireEvent.click(screen.getByText("State"));

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("loads ensembles from the dedicated endpoint and reuses the cache", async () => {
    mockBackendResponses();
    renderStatePage();
    await screen.findByTestId("map-district-4");

    fireEvent.click(screen.getByText("Ensembles"));

    expect(await screen.findByText("5000")).toBeInTheDocument();
    expect(screen.getByText("0.50%")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenNthCalledWith(3, "/api/states/OR/ensembles-summary");

    fireEvent.click(screen.getByText("State"));
    await screen.findByText("9,999");

    fireEvent.click(screen.getByText("Ensembles"));
    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  it("loads district data from a map click and keeps the selected row highlighted", async () => {
    mockBackendResponses({
      topology: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              district_number: 4,
              NAMELSAD: "Congressional District 4",
              RESULT: "DEMOCRATIC",
            },
            geometry: null,
          },
          {
            type: "Feature",
            properties: {
              district_number: 5,
              NAMELSAD: "Congressional District 5",
              RESULT: "REPUBLICAN",
            },
            geometry: null,
          },
        ],
      },
      table: {
        districts: [
          {
            districtNumber: 4,
            representative: "Backend Rep 4",
            party: "Democrat",
            racialEthnicGroup: "Latino",
            voteMargin2024: 12.3,
          },
          {
            districtNumber: 5,
            representative: "Backend Rep 5",
            party: "Republican",
            racialEthnicGroup: "White",
            voteMargin2024: -4.6,
          },
        ],
      },
    });

    renderStatePage();

    fireEvent.click(await screen.findByTestId("map-district-5"));

    expect(await screen.findByText("Backend Rep 5")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(screen.getByText("District Data")).toBeInTheDocument();

    const selectedRow = screen.getByText("5").closest("tr");
    expect(selectedRow).toHaveClass("districts-table-row--selected");
  });

  it("clears district and ensemble caches when the state route changes", async () => {
    mockBackendResponses();
    renderStatePage();

    await screen.findByTestId("map-district-4");
    await screen.findByText("9,999");

    fireEvent.click(screen.getByText("Ensembles"));
    await screen.findByText("5000");
    fireEvent.click(document.getElementById("statePageDistrictTab"));
    await screen.findByText("Backend Rep");

    expect(axios.get).toHaveBeenCalledTimes(4);

    fireEvent.click(screen.getByText("Go South Carolina"));

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/states/SC/districts/enacted/topology"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/states/SC/state-summary"));
    expect(screen.getByText("9,999")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ensembles"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/states/SC/ensembles-summary"));

    fireEvent.click(document.getElementById("statePageDistrictTab"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/states/SC/districts/enacted/table", {
      params: { election: "2024_pres" },
    }));
  });

  it("keeps errors scoped to the failing panel or map surface", async () => {
    mockBackendResponses({
      topologyError: true,
      tableError: true,
      ensembleError: true,
    });

    renderStatePage({ initialPath: "/state/South Carolina" });

    expect(await screen.findByText("Unable to load district map")).toBeInTheDocument();
    expect(await screen.findByText("9,999")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(2);

    fireEvent.click(document.getElementById("statePageDistrictTab"));
    expect(await screen.findByText("Congressional representation data is not available for this state.")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByText("Ensembles"));
    expect(await screen.findByText("Ensemble summary is not available for this state.")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(4);
  });
});
