import { useMemo, useState } from 'react';
import Controls from './components/Controls.jsx';
import { chartCatalog, chartOrder } from './data/payloads.js';
import EnsembleSplitsChart from './charts/EnsembleSplitsChart.jsx';
import GinglesScatterChart from './charts/GinglesScatterChart.jsx';
import EiSupportChart from './charts/EiSupportChart.jsx';
import BoxWhiskerChart from './charts/BoxWhiskerChart.jsx';
import EiPrecinctBarCIChart from './charts/EiPrecinctBarCIChart.jsx';
import EiKdeChart from './charts/EiKdeChart.jsx';
import VoteShareSeatShareChart from './charts/VoteShareSeatShareChart.jsx';

const chartComponents = {
  'GUI-16': EnsembleSplitsChart,
  'GUI-9': GinglesScatterChart,
  'GUI-12': EiSupportChart,
  'GUI-17': BoxWhiskerChart,
  'GUI-13': EiPrecinctBarCIChart,
  'GUI-15': EiKdeChart,
  'GUI-18': VoteShareSeatShareChart,
};

export default function App() {
  const [chartKey, setChartKey] = useState('GUI-16');
  const [state, setState] = useState('OR');
  const chartMeta = chartCatalog[chartKey];
  const payload = chartMeta.states[state] ?? Object.values(chartMeta.states)[0];
  const ChartView = chartComponents[chartKey];

  const summary = useMemo(() => {
    if (!payload) return [];
    return [
      ['Schema', payload.schemaVersion],
      ['Chart Type', payload.chartType],
      ['State', payload.state],
      ['Districts', payload.totalDistricts],
      ['Election', payload.election || 'N/A'],
      ['Units', payload.units?.share || 'decimal 0..1'],
    ];
  }, [payload]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>CSE416 Braves GUI Review Chart Demo</h1>
          <p>{chartMeta.description}</p>
        </div>
      </header>

      <Controls
        chartKey={chartKey}
        setChartKey={setChartKey}
        chartOrder={chartOrder}
        chartCatalog={chartCatalog}
        state={state}
        setState={setState}
      />

      <section className="layout-grid">
        <section className="card chart-card">
          <h2>{chartMeta.label}</h2>
          <ChartView payload={payload} />
        </section>

        <aside className="card side-card">
          <h3>Payload Summary</h3>
          <table className="meta-table">
            <tbody>
              {summary.map(([k, v]) => (
                <tr key={k}><th>{k}</th><td>{String(v)}</td></tr>
              ))}
            </tbody>
          </table>
          <h3>Prototype Notes</h3>
          <ul>
            <li>Mock data is schema-accurate and state-shaped for OR (6) and SC (7).</li>
            <li>Shares are stored as decimals (0..1) and formatted as percentages in UI.</li>
            <li>Preferred charts are included as stretch/demo-ready components.</li>
            <li>GUI-14 choropleth is intentionally out of scope for this Recharts-only prototype.</li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
