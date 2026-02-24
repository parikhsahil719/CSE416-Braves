export default function Controls({ chartKey, setChartKey, chartOrder, chartCatalog, state, setState }) {
  return (
    <div className="controls">
      <label>
        Chart
        <select value={chartKey} onChange={(e) => setChartKey(e.target.value)}>
          {chartOrder.map((key) => (
            <option key={key} value={key}>{chartCatalog[key].label}</option>
          ))}
        </select>
      </label>
      <label>
        State
        <select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="OR">Oregon (6 districts)</option>
          <option value="SC">South Carolina (7 districts)</option>
        </select>
      </label>
    </div>
  );
}
