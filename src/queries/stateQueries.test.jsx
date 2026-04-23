import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createAppQueryClient } from "../lib/queryClient.js";
import { queryKeys } from "../lib/queryKeys.js";
import {
  prefetchStateLandingData,
  useEiSupportQuery,
  useStateSummaryQuery,
} from "./stateQueries.js";

const getJsonMock = vi.fn();

vi.mock("../lib/apiClient.js", () => ({
  getJson: (...args) => getJsonMock(...args),
}));

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderWithClient(ui, client) {
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>,
  );
}

function SummaryValue({ stateCode = "OR" }) {
  const query = useStateSummaryQuery(stateCode);

  if (query.isError && !query.data) {
    return <div>error</div>;
  }

  if (!query.data) {
    return <div>loading</div>;
  }

  return <div>{query.data.population}</div>;
}

function EiValue({ stateCode = "OR", group = "latino" }) {
  const query = useEiSupportQuery(stateCode, group, true);

  if (!query.data) {
    return <div>loading</div>;
  }

  return <div>{query.data.selectedCandidate}</div>;
}

describe("stateQueries", () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    cleanup();
  });

  it("dedupes identical state summary requests across components", async () => {
    const deferred = createDeferred();
    const client = createAppQueryClient();
    getJsonMock.mockReturnValueOnce(deferred.promise);

    renderWithClient(
      <>
        <SummaryValue />
        <SummaryValue />
      </>,
      client,
    );

    expect(getJsonMock).toHaveBeenCalledTimes(1);

    deferred.resolve({ population: "4.2M" });

    await waitFor(() => {
      expect(screen.getAllByText("4.2M")).toHaveLength(2);
    });
  });

  it("reuses cached state summary data across remounts without a second request", async () => {
    const client = createAppQueryClient();
    getJsonMock.mockResolvedValueOnce({ population: "5.1M" });

    const firstRender = renderWithClient(<SummaryValue />, client);

    await screen.findByText("5.1M");
    firstRender.unmount();

    renderWithClient(<SummaryValue />, client);

    await screen.findByText("5.1M");
    expect(getJsonMock).toHaveBeenCalledTimes(1);
  });

  it("keeps previous EI data visible while a new group request is in flight", async () => {
    const client = createAppQueryClient();
    const secondDeferred = createDeferred();

    getJsonMock
      .mockResolvedValueOnce({ selectedCandidate: "Latino Candidate" })
      .mockReturnValueOnce(secondDeferred.promise);

    const view = renderWithClient(<EiValue group="latino" />, client);

    await screen.findByText("Latino Candidate");

    view.rerender(
      <QueryClientProvider client={client}>
        <EiValue group="asian" />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Latino Candidate")).toBeInTheDocument();

    secondDeferred.resolve({ selectedCandidate: "Asian Candidate" });

    await screen.findByText("Asian Candidate");
  });

  it("surfaces error state when a shared query fails without cached data", async () => {
    const client = createAppQueryClient();
    client.setDefaultOptions({
      queries: {
        ...client.getDefaultOptions().queries,
        retry: false,
      },
    });
    getJsonMock.mockRejectedValueOnce(new Error("boom"));

    renderWithClient(<SummaryValue />, client);

    await screen.findByText("error");
  });

  it("prefetches state landing data into the query cache before navigation", async () => {
    const client = createAppQueryClient();
    getJsonMock
      .mockResolvedValueOnce({ population: "4.3M" })
      .mockResolvedValueOnce({ type: "FeatureCollection", features: [] });

    await prefetchStateLandingData(client, "OR");

    expect(client.getQueryData(queryKeys.stateSummary("OR"))).toEqual({ population: "4.3M" });
    expect(client.getQueryData(queryKeys.districtTopology("OR"))).toEqual({ type: "FeatureCollection", features: [] });
    expect(getJsonMock).toHaveBeenCalledTimes(2);
  });
});
