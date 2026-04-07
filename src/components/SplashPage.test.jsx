import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import SplashPage from "./SplashPage.jsx";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("leaflet", () => {
  function createFeatureLayer(feature) {
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

  return {
    default: {
      map: vi.fn(() => ({
        remove: vi.fn(),
      })),
      tileLayer: vi.fn(() => ({
        addTo: vi.fn(),
      })),
      geoJson: vi.fn((data, options = {}) => {
        const geoJsonLayer = {
          addTo: vi.fn(() => {
            const container = document.getElementById("countrymap");

            (data?.features ?? []).forEach((feature) => {
              const layer = createFeatureLayer(feature);
              options.onEachFeature?.(feature, layer);

              const button = document.createElement("button");
              button.type = "button";
              button.textContent = feature.properties.name;
              button.onclick = () => layer.handlers.click?.({ target: layer });
              container?.appendChild(button);
            });

            return geoJsonLayer;
          }),
          resetStyle: vi.fn(),
        };

        return geoJsonLayer;
      }),
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
  };
});

function LocationProbe() {
  const location = useLocation();

  return (
    <div>
      <div data-testid="pathname">{location.pathname}</div>
      <pre data-testid="route-state">{JSON.stringify(location.state ?? null)}</pre>
    </div>
  );
}

function renderSplashPage(switchPage = vi.fn()) {
  return {
    switchPage,
    ...render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<SplashPage switchPage={switchPage} />} />
          <Route path="/state/:stateName" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    ),
  };
}

function mockBackendResponses({ summaryError = false } = {}) {
  axios.get.mockImplementation((url) => {
    if (url === "/api/maps/us-states/topology") {
      return Promise.resolve({
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "Oregon",
                isActive: true,
              },
              geometry: null,
            },
            {
              type: "Feature",
              properties: {
                name: "South Carolina",
                isActive: true,
              },
              geometry: null,
            },
          ],
        },
      });
    }

    if (url === "/api/states/OR/state-summary") {
      return summaryError
        ? Promise.reject(new Error("summary failed"))
        : Promise.resolve({
          data: {
            state: "OR",
            population: "4,272,371",
          },
        });
    }

    return Promise.reject(new Error(`Unhandled url: ${url}`));
  });
}

describe("SplashPage", () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("prefetches the state summary before navigating to the state page", async () => {
    mockBackendResponses();
    const { switchPage } = renderSplashPage();

    fireEvent.click(await screen.findByText("Oregon"));

    await waitFor(() => expect(screen.getByTestId("pathname")).toHaveTextContent("/state/Oregon"));

    expect(axios.get).toHaveBeenNthCalledWith(1, "/api/maps/us-states/topology");
    expect(axios.get).toHaveBeenNthCalledWith(2, "/api/states/OR/state-summary");
    expect(screen.getByTestId("route-state")).toHaveTextContent("\"prefetchedStateId\":\"OR\"");
    expect(screen.getByTestId("route-state")).toHaveTextContent("\"population\":\"4,272,371\"");
    expect(switchPage).toHaveBeenCalledWith("State");
  });

  it("still navigates when the summary prefetch fails", async () => {
    mockBackendResponses({ summaryError: true });
    renderSplashPage();

    fireEvent.click(await screen.findByText("Oregon"));

    await waitFor(() => expect(screen.getByTestId("pathname")).toHaveTextContent("/state/Oregon"));

    expect(axios.get).toHaveBeenNthCalledWith(2, "/api/states/OR/state-summary");
    expect(screen.getByTestId("route-state")).toHaveTextContent("null");
  });

  it("renders splash navigation from renamed JSON topology payloads", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/maps/us-states/topology") {
        return Promise.resolve({
          data: {
            type: "Topology",
            objects: {
              "us-states": {
                type: "GeometryCollection",
                geometries: [
                  {
                    type: "Polygon",
                    arcs: [[0]],
                    properties: {
                      name: "Oregon",
                      isActive: true,
                    },
                  },
                ],
              },
            },
            arcs: [[]],
          },
        });
      }

      if (url === "/api/states/OR/state-summary") {
        return Promise.resolve({
          data: {
            state: "OR",
            population: "4,272,371",
          },
        });
      }

      return Promise.reject(new Error(`Unhandled url: ${url}`));
    });

    renderSplashPage();

    fireEvent.click(await screen.findByText("Oregon"));

    await waitFor(() => expect(screen.getByTestId("pathname")).toHaveTextContent("/state/Oregon"));
    expect(screen.getByTestId("route-state")).toHaveTextContent("\"prefetchedStateId\":\"OR\"");
  });
});
