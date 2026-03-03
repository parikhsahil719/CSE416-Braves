import React from "react";
import { useParams } from "react-router-dom";
import '../../styles/VRA-Analysis.css'
import SingleEnsembleSplitsChart from "../charts/SingleEnsembleSplitsChart.jsx";
import { getEnsembleSplitsPayload } from "../data/chartPayloads.js";

export default function VRAAnalysis() {
  const { stateName } = useParams();
  const payload = getEnsembleSplitsPayload(stateName);

  return (
    <span id="VRAAnalysisMain">
      <div className="VRAAnalysisContainers">
        <SingleEnsembleSplitsChart
          title="GUI 16 VRA"
          buckets={payload.series.vraConstrained}
          totalDistricts={payload.totalDistricts}
          ensembleSize={payload.ensembleSize}
        />
      </div>
      <div className="VRAAnalysisContainers">
        <SingleEnsembleSplitsChart
          title="Race Blind"
          buckets={payload.series.raceBlind}
          totalDistricts={payload.totalDistricts}
          ensembleSize={payload.ensembleSize}
        />
      </div>
    </span>
  );
}
