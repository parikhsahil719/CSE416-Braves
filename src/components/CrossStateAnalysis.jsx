import React, { useMemo, useState } from 'react';
import "../../styles/cross-state-analysis.css";
import GinglesScatterChart from '../charts/GinglesScatterChart.jsx';
import { getGinglesPayload } from '../data/chartPayloads.js';
import { num, pct } from '../utils/chartFormat.js';

const PAGE_SIZE = 6;

function StateSection({ title, stateKey }) {
  const payload = getGinglesPayload(stateKey);
  const options = useMemo(() => [payload.selectedGroup], [payload.selectedGroup]);
  const [currentGroup, changeGroup] = useState(options[0]);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(payload.points.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const rows = payload.points.slice(start, start + PAGE_SIZE);

  const prevPage = () => setPage((current) => Math.max(1, current - 1));
  const nextPage = () => setPage((current) => Math.min(totalPages, current + 1));

  return (
    <section className="crossStateCard">
      <div className="crossStateHeader">
        <h2 className="crossStateHeaderTitle">{title}</h2>
        <div className="crossStateHeaderControls">
          <label htmlFor={`${stateKey}-racialGroupSelector`} className="crossStateControlLabel">
            Group:
          </label>
          <select
            name={`${stateKey}-racialGroupSelector`}
            id={`${stateKey}-racialGroupSelector`}
            className="racialGroupSelector"
            value={currentGroup}
            onChange={(event) => changeGroup(event.target.value)}
          >
            {options.map((minority) => (
              <option key={minority} value={minority}>{minority}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="crossStateChartContainer">
        <GinglesScatterChart payload={payload} compact />
      </div>

      <div className="crossStateTableSection">
        <h3 className="crossStateTableHeading">Precinct Data</h3>
        <div className="crossStateTableWrapper">
          <table className="crossStateTable">
            <tbody>
              <tr>
                <th className="crossStateTableCell">Precinct</th>
                <th className="crossStateTableCell">Total Pop.</th>
                <th className="crossStateTableCell">Minority Pop.</th>
                <th className="crossStateTableCell">Rep %</th>
                <th className="crossStateTableCell">Dem %</th>
              </tr>
              {rows.map((row) => (
                <tr key={row.precinctId}>
                  <td className="crossStateTableCell">{row.precinctId}</td>
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
          <p className="tablePageArrow tablePageText" onClick={prevPage}>&lt;</p>
          <p className="tablePageText">Table {page}/{totalPages}</p>
          <p className="tablePageArrow tablePageText" onClick={nextPage}>&gt;</p>
        </div>
      </div>
    </section>
  );
}

export default function CrossStateAnalysis() {
  return (
    <div id="crossStateMain">
      <StateSection title="Oregon" stateKey="OR" />
      <StateSection title="South Carolina" stateKey="SC" />
    </div>
  );
}
