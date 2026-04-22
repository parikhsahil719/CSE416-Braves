import React, { useEffect, useState } from "react";
import "../../styles/compare.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import { topologyToFeatureCollection } from "../utils/topology.js";
import DistrictMap from "./DistrictMap.jsx"
import InterestingMap from "./InterestingMap.jsx";

// const dataMap = { Oregon, SouthCarolina };

function toStateCode(stateName) {
  if (stateName === "Oregon") {
    return "OR";
  }

  if (stateName === "South Carolina") {
    return "SC";
  }

  return null;
}

export default function Compare(props) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const [leftMapLoading, setLeftMapLoading] = useState(false);
  const [leftMapData, setLeftMapData] = useState(null);
  const [leftMapLoadFailed, setLeftMapLoadFailed] = useState(false);
  const [rightMapLoading, setRightMapLoading] = useState(false);
  const [rightMapData, setRightMapData] = useState(null);
  const [rightMapLoadFailed, setRightMapLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    setLeftMapLoading(Boolean(stateCode));
    setLeftMapData(null);
    setLeftMapLoadFailed(false);
    if (!stateCode) {
      setLeftMapLoading(false);
      setLeftMapLoadFailed(true);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/districts/enacted/topology`);
        if (isActive) {
          setLeftMapData(topologyToFeatureCollection(response.data, "districts"));
          setLeftMapLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setLeftMapData(null);
          setLeftMapLoadFailed(true);
        }
      } finally {
        if (isActive) {
          setLeftMapLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [stateCode, stateName]);

  useEffect(() => {
    let isActive = true;

    setRightMapLoading(Boolean(stateCode));
    setRightMapData(null);
    setRightMapLoadFailed(false);
    if (!stateCode) {
      setRightMapLoading(false);
      setRightMapLoadFailed(true);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/districts/enacted/topology`);
        if (isActive) {
          setRightMapData(topologyToFeatureCollection(response.data, "districts"));
          setRightMapLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setRightMapData(null);
          setRightMapLoadFailed(true);
        }
      } finally {
        if (isActive) {
          setRightMapLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [stateCode, stateName]);

  return (
    <span id="compare-page-main">
      <div id="compare-page-left-map-container" className="compare-page-map-container">
        <div className="compare-page-left-map-label">Current Congressional District Plan of {stateName}</div>
        <DistrictMap
          stateName={stateName}
          data={leftMapData}
        />
        {leftMapLoading ? <div className="compare-page-status-message">Loading {stateName}'s current district plan...</div> : null}
        {leftMapLoadFailed ? (
          <div className="compare-page-status-message">Unable to load {stateName}'s current district plan</div>
        ) : null}
      </div>
      <div id="compare-page-right-map-container" className="compare-page-map-container">
        <div className="compare-page-right-map-label">Interesting Plan</div>
        <InterestingMap
          stateName={stateName}
          data={rightMapData}
        />
        {rightMapLoading ? <div className="compare-page-status-message">Loading {stateName}'s interesting plan...</div> : null}
        {rightMapLoadFailed ? (
          <div className="compare-page-status-message">Unable to load {stateName}'s interesting plan</div>
        ) : null}
      </div>
    </span>
  );
}
