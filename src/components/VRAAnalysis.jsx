import React from "react";
import { useParams } from "react-router-dom";
import "../../styles/VRA-Analysis.css";
import { toStateCode } from "../utils/stateUtils.js";
import { useEnsembleSplits } from "../queries/stateQueries.js";
import SingleEnsembleSplitsChart from "../charts/SingleEnsembleSplitsChart.jsx";

export default function VRAAnalysis() {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const { data: payload } = useEnsembleSplits(stateCode, 'final');

  return (
    <span>
      <div className="VRAAnalysisLabel">Simulated District Voting Distribution</div>
      {payload && (
        <div id="VRAAnalysisMain" className="VRAAnalysisCharts">
          <div className="VRAAnalysisContainers">
            <SingleEnsembleSplitsChart eyebrow="GUI-16" title="VRA-Constrained Ensemble" buckets={payload.series.vraConstrained} totalDistricts={payload.totalDistricts} ensembleSize={payload.ensembleSize} />
          </div>
          <div className="VRAAnalysisContainers">
            <SingleEnsembleSplitsChart eyebrow="GUI-16" title="Race-Blind Ensemble" buckets={payload.series.raceBlind} totalDistricts={payload.totalDistricts} ensembleSize={payload.ensembleSize} />
          </div>
        </div>
      )}
    </span>
  );
}
