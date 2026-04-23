import React, { useEffect, useMemo, useRef } from "react";
import "../../styles/minority-map.css";
import { useParams } from "react-router-dom";
import L from "leaflet";
import { toStateCode } from "../lib/stateMetadata.js";
import { useHeatmapQuery, usePrecinctTopologyQuery } from "../queries/stateQueries.js";
import { defaultGetColor, getFeaturePercentage, getHeatmapColor, normalizeMinorityGroup } from "../utils/minorityHeatMap.js";

function createLegendControl(bins) {
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function onAdd() {
    const div = L.DomUtil.create("div", "info legend");
    const fallbackGrades = [0, 10, 20, 30, 40, 50, 60, 70, 80];

    div.innerHTML += "<h4>% Population</h4>";

    if (Array.isArray(bins) && bins.length > 0) {
      bins.forEach((bin) => {
        const label = bin.max >= 100 ? `${bin.min}+` : `${bin.min}-${bin.max}`;
        div.innerHTML += `
          <div style="display:flex; align-items:center; margin-bottom:4px;">
            <i style="background:${bin.color}; display:inline-block;"></i>
            ${label}
          </div>`;
      });
      return div;
    }

    for (let index = 0; index < fallbackGrades.length; index += 1) {
      div.innerHTML += `
        <div style="display:flex; align-items:center; margin-bottom:4px;">
          <i style="background:${defaultGetColor(fallbackGrades[index] + 0.01)}; display:inline-block;"></i>
          ${fallbackGrades[index]}${fallbackGrades[index + 1] ? `&ndash;${fallbackGrades[index + 1]}` : "+"}
        </div>`;
    }

    return div;
  };

  return legend;
}

function shareLookup(payload) {
  const rows = payload?.precinctGroupShares;
  if (Array.isArray(rows)) {
    return Object.fromEntries(
      rows
        .filter((row) => row?.geoid != null && Number.isFinite(row?.share))
        .map((row) => [String(row.geoid), Number(row.share)]),
    );
  }
  return payload?.precinctGroupShareByGeoid ?? {};
}

export default function MinorityHeatMap({ currMinority, switchMinority }) {
  const { stateName } = useParams();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapLayerRef = useRef(null);
  const legendRef = useRef(null);

  const stateCode = toStateCode(stateName);
  const group = normalizeMinorityGroup(currMinority);

  const topologyQuery = usePrecinctTopologyQuery(stateCode);
  const heatmapQuery = useHeatmapQuery(stateCode, group);

  const bins = heatmapQuery.data?.bins ?? [];
  const precinctGroupShareByGeoid = useMemo(() => shareLookup(heatmapQuery.data), [heatmapQuery.data]);

  const oregonGroups = ["Latino", "Asian"];
  const scGroups = ["Black", "Latino"];

  function styleFeature(feature) {
    return {
      fillColor: getHeatmapColor(getFeaturePercentage(feature, precinctGroupShareByGeoid), bins),
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  }

  function createMapInstance(target) {
    delete target._leaflet_id;
    target.innerHTML = "";

    const map = L.map(target, {
      zoomControl: false,
      doubleClickZoom: false,
      keyboard: false,
      zoomSnap: 0.1,
      minZoom: stateName === "Oregon" ? 6.1 : 6.9,
      maxBounds: stateName === "Oregon" ? [[47, -125], [41, -114.4]] : [[35.6, -83.3], [31.5, -77.5]],
    }).setView(stateName === "Oregon" ? [44.1, -119.6] : [33.33, -80.5], stateName === "Oregon" ? 6.3 : 7.1);

    L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    return map;
  }

  const minorityOptions = stateName === "Oregon"
    ? oregonGroups.map((minority) => (
      <option key={minority} value={minority}>
        {minority}
      </option>
    ))
    : scGroups.map((minority) => (
      <option key={minority} value={minority}>
        {minority}
      </option>
    ));

  useEffect(() => {
    const target = mapContainerRef.current;

    if (!target || !topologyQuery.data?.features?.length) {
      return undefined;
    }

    const map = createMapInstance(target);
    mapRef.current = map;

    return () => {
      mapLayerRef.current = null;
      legendRef.current = null;
      map.remove();
      if (mapRef.current === map) {
        mapRef.current = null;
      }
      delete target._leaflet_id;
      target.innerHTML = "";
    };
  }, [stateName, topologyQuery.data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !topologyQuery.data?.features?.length || Object.keys(precinctGroupShareByGeoid).length === 0) {
      return undefined;
    }

    if (mapLayerRef.current) {
      map.removeLayer(mapLayerRef.current);
      mapLayerRef.current = null;
    }

    if (legendRef.current) {
      map.removeControl(legendRef.current);
      legendRef.current = null;
    }

    const legend = createLegendControl(bins);
    legend.addTo(map);
    legendRef.current = legend;

    const layer = L.geoJSON(topologyQuery.data, {
      style: styleFeature,
      onEachFeature(_feature, featureLayer) {
        featureLayer.on({
          mouseover(event) {
            event.target.setStyle({
              weight: 2,
              color: "#666",
              dashArray: "",
              fillOpacity: 0.7,
            });
            event.target.bringToFront();
          },
          mouseout(event) {
            layer.resetStyle(event.target);
          },
        });
      },
    }).addTo(map);
    mapLayerRef.current = layer;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        animate: false,
        padding: [12, 12],
      });
    }

    return () => {
      if (mapLayerRef.current === layer) {
        map.removeLayer(layer);
        mapLayerRef.current = null;
      }

      if (legendRef.current === legend) {
        map.removeControl(legend);
        legendRef.current = null;
      }
    };
  }, [bins, precinctGroupShareByGeoid, topologyQuery.data]);

  if (!stateName) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }

  if (!topologyQuery.data) {
    if (topologyQuery.isError) {
      return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Unable to load precinct topology</div>;
    }
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Loading precinct topology...</div>;
  }

  return (
    <>
      <div className="minority-selector-container">
        <label htmlFor="minoritySelector" style={{ fontWeight: "bolder" }}>Select a racial group: </label>
        <select name="minoritySelector" value={currMinority} onChange={(event) => { switchMinority(event.target.value); }}>
          {minorityOptions}
        </select>
      </div>
      <div id="minoritymap">
        <div ref={mapContainerRef} className="minorityLeafletMap" />
      </div>
    </>
  );
}
