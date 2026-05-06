import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/gingles.css";
import GinglesScatterChart from "../charts/GinglesScatterChart.jsx";
import DistrictMap from "./DistrictMap.jsx";
import MinorityHeatMap from "./MinorityHeatMap.jsx";
import { num } from "../utils/chartFormat.js";
import { useGingles, useGinglesTable, useDistrictTopology } from "../queries/stateQueries.js";
import { defaultGroup, groupOptionsForState, toStateCode } from "../utils/stateUtils.js";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { useParams } from "react-router-dom";

function GroupSelector({ stateKey, currMinority, options, switchMinority }) {
  return (
    <div className="crossStateHeaderControls">
      <label htmlFor={`${stateKey}-racialGroupSelector`} className="crossStateControlLabel">Group:</label>
      <select id={`${stateKey}-racialGroupSelector`} className="racialGroupSelector" value={currMinority} onChange={e => switchMinority(e.target.value)}>
        {options.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>
  );
}

function PrecinctTable({ rows }) {
  const tableWrapperRef = useRef(null);
  const tableRef = useRef(null);
  const [pageSize, setPageSize] = useState(4);
  const [page, setPage] = useState(1);
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.precinctId ?? "").localeCompare(String(b.precinctId ?? ""), undefined, { numeric: true })),
    [rows]
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const table = tableRef.current;
    if (!wrapper || !table || sortedRows.length === 0) return undefined;

    function updatePageSize() {
      const headerRow = table.querySelector("tr");
      const bodyRow = table.querySelector("tbody tr:nth-child(2)");
      if (!headerRow || !bodyRow) return;
      const available = Math.max(0, wrapper.clientHeight - headerRow.getBoundingClientRect().height);
      const rowHeight = bodyRow.getBoundingClientRect().height;
      if (rowHeight <= 0) return;
      setPageSize(Math.max(1, Math.min(sortedRows.length, Math.floor(available / rowHeight))));
    }

    updatePageSize();
    const observer = new ResizeObserver(updatePageSize);
    observer.observe(wrapper);
    observer.observe(table);
    return () => observer.disconnect();
  }, [sortedRows.length]);

  useEffect(() => { setPage(p => Math.min(p, totalPages)); }, [totalPages]);

  return (
    <div className="crossStateTableSection">
      <h3 className="crossStateTableHeading">Precinct Data</h3>
      <div ref={tableWrapperRef} className="crossStateTableWrapper">
        <table ref={tableRef} className="crossStateTable">
          <tbody>
            <tr>
              {["Precinct", "Total Pop.", "Minority Pop.", "Rep Votes", "Dem Votes"].map(h => <th key={h} className="crossStateTableCell">{h}</th>)}
            </tr>
            {visibleRows.map(row => (
              <tr key={row.precinctId}>
                <td className="crossStateTableCell">{row.precinctId}</td>
                <td className="crossStateTableCell">{num(row.totalPopulation)}</td>
                <td className="crossStateTableCell">{num(row.minorityPopulation)}</td>
                <td className="crossStateTableCell">{num(row.republicanVotes)}</td>
                <td className="crossStateTableCell">{num(row.democraticVotes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tablePageContainer">
        <p className="tablePageArrow tablePageText" onClick={() => setPage(p => Math.max(1, p - 1))}>&lt;</p>
        <p className="tablePageText">Table {page}/{totalPages}</p>
        <p className="tablePageArrow tablePageText" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&gt;</p>
      </div>
    </div>
  );
}

function StateSection({ stateName, stateCode, currMinority, switchMinority }) {
  const group = currMinority.trim().toLowerCase().replace(/\s+/g, "_");
  const options = groupOptionsForState(stateName)
  const gingles = useGingles(stateCode, group);
  const ginglesTable = useGinglesTable(stateCode, group);
  const rows = ginglesTable.data?.rows ?? gingles.data?.points ?? [];
  const isPolarized = (stateCode === "SC" ? true : false)

  return (
    <section className="crossStateCard">
      <div className="crossStateHeader">
        <h2 className="crossStateHeaderTitle">Gingles</h2>
        <h4 className="crossState-isPolarized-header">Racially polarized? {isPolarized ? "✓" : "✗"}</h4>
        <GroupSelector stateKey={stateCode} currMinority={currMinority} options={options} switchMinority={switchMinority} />
      </div>
      <div className="crossStateChartContainer">
        {gingles.data ? <GinglesScatterChart payload={gingles.data} compact /> : null}
      </div>
      <PrecinctTable rows={rows} />
    </section>
  );
}

export default function Gingles({ currMap, currMinority, switchMinority, switchPolarization }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const topo = useDistrictTopology(stateCode);
  const mapData = topo.data ? topologyToFeatureCollection(topo.data, "districts") : null;

  useEffect(() => {
    if (!groupOptionsForState(stateName).includes(currMinority))
      switchMinority(defaultGroup(stateCode));
  }, []);

  return (
    <span id="ginglesMain">
      <div id="gingles-page-map-container">
        <div className="gingles-page-map-label">
          {currMap === 'Precinct Heat Map' ? `${currMap} of ${currMinority} Population in ${stateName}` : `Current Congressional Districts of ${stateName}`}
        </div>
        {currMap === "District Map" ? <DistrictMap stateName={stateName} data={mapData} /> : <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />}
        {topo.isLoading && <div className="gingles-page-status-message">Loading {stateName} {currMap}...</div>}
        {topo.isError && <div className="gingles-page-status-message">Unable to load {stateName} {currMap}</div>}
      </div>
      <StateSection stateName={stateName} stateCode={stateCode} currMinority={currMinority} switchMinority={switchMinority} />
    </span>
  );
}
