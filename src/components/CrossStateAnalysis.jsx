import React, { useEffect, useMemo, useRef, useState } from 'react';
import "../../styles/cross-state-analysis.css";
import GinglesScatterChart from '../charts/GinglesScatterChart.jsx';
import { getGinglesPayload } from '../data/chartPayloads.js';
import { num, pct } from '../utils/chartFormat.js';

function StateSection({ title, stateKey, stateData }) {
  const payload = getGinglesPayload(stateKey);
  const options = useMemo(() => [payload.selectedGroup], [payload.selectedGroup]);
  // const options = stateData.minorityData.minorityList;
  const tableWrapperRef = useRef(null);
  const tableRef = useRef(null);
  const [currentGroup, changeGroup] = useState(options[0]);
  const [pageSize, setPageSize] = useState(4);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(payload.points.length / pageSize));
  const start = (page - 1) * pageSize;
  const rows = payload.points.slice(start, start + pageSize);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const table = tableRef.current;
    if (!wrapper || !table) return undefined;

    function updatePageSize() {
      const headerRow = table.querySelector('tr');
      const bodyRow = table.querySelector('tbody tr:nth-child(2)');

      if (!headerRow || !bodyRow) return;

      const wrapperHeight = wrapper.clientHeight;
      const headerHeight = headerRow.getBoundingClientRect().height;
      const rowHeight = bodyRow.getBoundingClientRect().height;
      const availableBodyHeight = Math.max(0, wrapperHeight - headerHeight);
      const fullRowsThatFit = Math.floor(availableBodyHeight / rowHeight);

      setPageSize(Math.max(1, Math.min(payload.points.length, fullRowsThatFit)));
    }

    updatePageSize();
    const observer = new ResizeObserver(updatePageSize);
    observer.observe(wrapper);
    observer.observe(table);
    return () => observer.disconnect();
  }, [payload.points.length]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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
        <div ref={tableWrapperRef} className="crossStateTableWrapper">
          <table ref={tableRef} className="crossStateTable">
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

export default function CrossStateAnalysis(props) {
  const minorityData = props.minorityData;
  let SCData = null;
  let ORData = null;
    for(let d of minorityData)
    {
        if(d.stateName === "South Carolina")
        {
            SCData=d;
        }
        else if(d.stateName === "Oregon")
        {
            ORData=d;
        }
    }
    if(SCData === null || ORData === null)
    {
        console.error("StateCustomAnalysis: Could not find minority data linking to the current state");
    }

  return (
    <span id="crossStateMain">
      <StateSection title="Oregon" stateKey="OR" stateData= {ORData}/>
      <StateSection title="South Carolina" stateKey="SC" stateData={SCData}/>
    </span>
  );
}
