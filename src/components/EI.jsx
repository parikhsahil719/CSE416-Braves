import React, { useEffect, useState } from "react";
import "../../styles/ei.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import { topologyToFeatureCollection } from "../utils/topology.js";
import DistrictMap from "./DistrictMap"
import MinorityHeatMap from "./MinorityHeatMap";
import EiSupportChart from "../charts/EiSupportChart.jsx";

function toStateCode(stateName) {
  if (stateName === "Oregon") {
    return "OR";
  }

  if (stateName === "South Carolina") {
    return "SC";
  }

  return null;
}

function displayData(data = <div>this is data</div>, containerClassName = "", widthOfData = null, heightOfData = null) {
  const style = {};
  if (widthOfData) {
    style.width = `${widthOfData}rem`;
  }
  if (heightOfData) {
    style.height = `${heightOfData}rem`;
  }

  return (
    <div className={containerClassName}>
      <div style={Object.keys(style).length === 0 ? undefined : style}>
        {data}
      </div>
    </div>
  );
}

function renderEiSection(eiPayload, eiLoading, eiLoadFailed, minority) {
  if (eiLoading) {
    return <div className="ei_placeholder">Loading ecological inference payload...</div>;
  }

  if (eiLoadFailed || !eiPayload) {
    return <div className="ei_placeholder">No backend payload is available for {minority}.</div>;
  }

  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">Support for {eiPayload.selectedCandidate}</div>
      <div className="ei-chartSubtitle">Estimated support distribution by group</div>
      <EiSupportChart payload={eiPayload} showHeader={false} />
    </div>
  );
}

function Analysis(eiPayload, eiLoading, eiLoadFailed, minority) {  // GUI 12
  const candidateEIWithLabel = displayData(
    renderEiSection(eiPayload, eiLoading, eiLoadFailed, minority),
    "ei-page-dataContainer ei-page-rightColumn"
  );
  return (
    <div id="ei-page-chart-container">
      {candidateEIWithLabel}
    </div>
  );
}

function Bar() {   // GUI 13
  return (
    <div id="ei-page-chart-container"></div>
  );
}

function KDE() {   // GUI 15
  return (
    <div id="ei-page-chart-container"></div>
  );
}

export default function EI(props) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const { currMap, currMinority, currEI, switchEI } = props;
  const [mapLoading, setMapLoading] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [eiPayload, setEiPayload] = useState(null);
  const [eiLoading, setEiLoading] = useState(false);
  const [eiLoadFailed, setEiLoadFailed] = useState(false);
  const groups = stateCode === "OR" ? ["Asian", "Hispanic"] : ["Black", "Hispanic"];

  useEffect(() => {
    let isActive = true;

    setMapLoading(Boolean(stateCode));
    setMapData(null);
    setMapLoadFailed(false);

    if (!stateCode) {
      setMapLoading(false);
      setMapLoadFailed(true);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/districts/enacted/topology`);
        if (isActive) {
          setMapData(topologyToFeatureCollection(response.data, "districts"));
          setMapLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setMapData(null);
          setMapLoadFailed(true);
        }
      } finally {
        if (isActive) {
          setMapLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [stateCode, stateName]);

  useEffect(() => {
    let isActive = true;
    const stateCode = toStateCode(stateName);

    if (!stateCode) {
      setEiPayload(null);
      setEiLoading(false);
      setEiLoadFailed(true);
      return undefined;
    }

    setEiLoading(true);
    setEiLoadFailed(false);

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/analysis/ei-support`, {
          params: {
            groups,
            election: "2024_pres",
            party: "DEM",
          },
        });
        if (isActive) {
          setEiPayload(response.data);
          setEiLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setEiPayload(null);
          setEiLoadFailed(true);
        }
      } finally {
        if (isActive) {
          setEiLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
      switchEI('');
    };
  }, [currMinority, stateName]);

  if (!stateCode) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }


  function renderActivePanel(eiPayload, eiLoading, eiLoadFailed, minority) {
    if (currEI === "EI Analysis") {
      return (
        <Analysis eiPayload={eiPayload} eiLoading={eiLoading} eiLoadFailed={eiLoadFailed} minority={minority} />
      );
    }

    if (currEI === "EI Bar Chart") {
      return (
        <Bar />
      );
    }

    if (currEI === "EI KDE") {
      return (
        <KDE />
      );
    }
  }

  return (
    <span id="ei-page-main">
      <div id="ei-page-map-container">
        <div className="ei-page-map-label">{currMinority ? `${currMap} of ${currMinority} Population` : currMap}</div>
        {currMap === "District Map" ?
        <DistrictMap
          stateName={stateName}
          data={mapData}
        /> :
        <MinorityHeatMap
          minority={currMinority}
          switchMinority={props.switchMinority}
        />}
        {mapLoading ? <div className="ei-page-status-message">Loading {stateName} {currMap}...</div> : null}
        {mapLoadFailed ? (
          <div className="ei-page-status-message">Unable to load {stateName} {currMap}</div>
        ) : null}
      </div>
      <div id="ei-page-chart-main-container">
        <div className="ei-page-chart-label">{currEI}</div>
        {renderActivePanel(eiPayload, eiLoading, eiLoadFailed, currMinority)}
      </div>
    </span>
  );
}
