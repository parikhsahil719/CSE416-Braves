import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/VRA-Analysis.css";
import SingleEnsembleSplitsChart from "../charts/SingleEnsembleSplitsChart.jsx";

export default function VRAAnalysis() {
  const { stateName } = useParams();
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let isActive = true;
    const stateCode = stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;

    if (!stateCode) {
      setPayload(null);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/ensembles/splits`, {
          params: {
            ensembleSize: "final",
            election: "2024_pres",
          },
        });
        if (isActive) {
          setPayload(response.data);
        }
      } catch {
        if (isActive) {
          setPayload(null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [stateName]);

  if (!payload) {
    return (
      <span>
        <div className="VRAAnalysisLabel">
          Simulated District Voting Distribution
        </div>
      </span>
    );
  }

  return (
    <span>
      <div className="VRAAnalysisLabel">
        Simulated District Voting Distribution
      </div>
      <div id="VRAAnalysisMain" className="VRAAnalysisCharts">
        <div className="VRAAnalysisContainers">
          <SingleEnsembleSplitsChart
            eyebrow="GUI-16"
            title="VRA-Constrained Ensemble"
            buckets={payload.series.vraConstrained}
            totalDistricts={payload.totalDistricts}
            ensembleSize={payload.ensembleSize}
          />
        </div>
        <div className="VRAAnalysisContainers">
          <SingleEnsembleSplitsChart
            eyebrow="GUI-16"
            title="Race-Blind Ensemble"
            buckets={payload.series.raceBlind}
            totalDistricts={payload.totalDistricts}
            ensembleSize={payload.ensembleSize}
          />
        </div>
      </div>
    </span>
  );
}
