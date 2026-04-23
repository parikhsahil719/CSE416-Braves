import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/cross-state-analysis.css";
import GinglesScatterChart from "../charts/GinglesScatterChart.jsx";
import { num, pct } from "../utils/chartFormat.js";
import { useGingles, useGinglesTable } from "../queries/stateQueries.js";

function GroupSelector({ stateKey, currentGroup, options, onChange }) {
  return (
    <div className="crossStateHeaderControls">
      <label htmlFor={`${stateKey}-racialGroupSelector`} className="crossStateControlLabel">Group:</label>
      <select id={`${stateKey}-racialGroupSelector`} className="racialGroupSelector" value={currentGroup} onChange={e => onChange(e.target.value)}>
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
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const table   = tableRef.current;
    if (!wrapper || !table || rows.length === 0) return undefined;

    function updatePageSize() {
      const headerRow = table.querySelector("tr");
      const bodyRow   = table.querySelector("tbody tr:nth-child(2)");
      if (!headerRow || !bodyRow) return;
      const available = Math.max(0, wrapper.clientHeight - headerRow.getBoundingClientRect().height);
      setPageSize(Math.max(1, Math.min(rows.length, Math.floor(available / bodyRow.getBoundingClientRect().height))));
    }

    updatePageSize();
    const observer = new ResizeObserver(updatePageSize);
    observer.observe(wrapper);
    observer.observe(table);
    return () => observer.disconnect();
  }, [rows.length]);

  useEffect(() => { setPage(p => Math.min(p, totalPages)); }, [totalPages]);

  return (
    <div className="crossStateTableSection">
      <h3 className="crossStateTableHeading">Precinct Data</h3>
      <div ref={tableWrapperRef} className="crossStateTableWrapper">
        <table ref={tableRef} className="crossStateTable">
          <tbody>
            <tr>
              {["Precinct", "Total Pop.", "Minority Pop.", "Rep %", "Dem %"].map(h => <th key={h} className="crossStateTableCell">{h}</th>)}
            </tr>
            {visibleRows.map(row => (
              <tr key={row.precinctId}>
                <td className="crossStateTableCell">{row.precinctName ?? row.precinctId}</td>
                <td className="crossStateTableCell">{num(row.totalPopulation)}</td>
                <td className="crossStateTableCell">{num(row.minorityPopulation)}</td>
                <td className="crossStateTableCell">{pct(row.repVoteShare)}</td>
                <td className="crossStateTableCell">{pct(row.demVoteShare)}</td>
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

function StateSection({ title, stateKey, stateData }) {
  const [currentGroup, changeGroup] = useState(stateData?.minorityData?.minorityList?.[0] ?? "");
  const group   = currentGroup?.trim().toLowerCase().replace(/\s+/g, "_");

  const gingles      = useGingles(stateKey, group);
  const ginglesTable = useGinglesTable(stateKey, group);

  const options = useMemo(() => {
    const fromPayload = gingles.data?.selectedGroup;
    return fromPayload ? [fromPayload] : (currentGroup ? [currentGroup] : []);
  }, [currentGroup, gingles.data?.selectedGroup]);

  const rows = ginglesTable.data?.rows ?? gingles.data?.points ?? [];

  return (
    <section className="crossStateCard">
      <div className="crossStateHeader">
        <h2 className="crossStateHeaderTitle">{title}</h2>
        <GroupSelector stateKey={stateKey} currentGroup={currentGroup} options={options} onChange={changeGroup} />
      </div>
      <div className="crossStateChartContainer">
        {gingles.data ? <GinglesScatterChart payload={gingles.data} compact /> : null}
      </div>
      <PrecinctTable rows={rows} />
    </section>
  );
}

export default function CrossStateAnalysis({ minorityData }) {
  const SCData = minorityData.find(e => e.stateName === "South Carolina") ?? null;
  const ORData = minorityData.find(e => e.stateName === "Oregon") ?? null;

  return (
    <span id="crossStateMain">
      <StateSection title="Oregon" stateKey="OR" stateData={ORData} />
      <StateSection title="South Carolina" stateKey="SC" stateData={SCData} />
    </span>
  );
}
