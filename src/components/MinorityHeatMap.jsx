import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { topologyToFeatureCollection } from "../utils/topology.js";

function defaultGetColor(percentage) {
  return percentage > 80 ? "#004529" :
    percentage > 70 ? "#006837" :
      percentage > 60 ? "#238443" :
        percentage > 50 ? "#41ab5d" :
          percentage > 40 ? "#78c679" :
            percentage > 30 ? "#addd8e" :
              percentage > 20 ? "#d9f0a3" :
                percentage > 10 ? "#f7fcb9" :
                  "#ffffe5";
}

function getColor(percentage, bins) {
  if (Array.isArray(bins) && bins.length > 0) {
    const match = bins.find((bin) => percentage >= bin.min && percentage < bin.max) ?? bins[bins.length - 1];
    return match?.color ?? defaultGetColor(percentage);
  }
  return defaultGetColor(percentage);
}

function fallbackFeaturePercent(feature) {
  const geoid = String(feature?.properties?.GEOID ?? feature?.id ?? "");
  let hash = 0;
  for (let index = 0; index < geoid.length; index += 1) {
    hash = (hash * 31 + geoid.charCodeAt(index)) % 101;
  }
  return hash;
}

function TopoJSON(props) {
  const layerRef = useRef(null);
  const { data, bins } = props;

  function style(feature) {
    return {
      fillColor: getColor(fallbackFeaturePercent(feature), bins),
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  }

  function highlightFeature(event) {
    const layer = event.target;

    layer.setStyle({
      weight: 5,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
    });

    layer.bringToFront();
  }

  function resetHighlight(event) {
    layerRef.current.resetStyle(event.target);
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }

  useEffect(() => {
    const layer = layerRef.current;
    layer.clearLayers();
    layer.addData(topologyToFeatureCollection(data));
  }, [data]);

  return <GeoJSON ref={layerRef} style={style} onEachFeature={onEachFeature} />;
}

function Legend({ bins }) {
  const map = useMap();

  useEffect(() => {
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

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [bins, map]);

  return null;
}

export default function MinorityHeatMap({ minority }) {
  const { stateName } = useParams();
  const [bins, setBins] = useState([]);
  const [topologyData, setTopologyData] = useState(null);
  const [geometryLoadFailed, setGeometryLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;
    const stateCode = stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;
    const group = minority?.trim().toLowerCase().replace(/\s+/g, "_");

    if (!stateCode || !group) {
      setBins([]);
      setTopologyData(null);
      setGeometryLoadFailed(true);
      return undefined;
    }

    setGeometryLoadFailed(false);

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/heatmap/precincts`, { params: { group } });
        if (isActive) {
          setBins(response.data?.bins ?? []);
        }
      } catch {
        if (isActive) {
          setBins([]);
        }
      }
    })();

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/precincts/topology`);
        if (isActive) {
          setTopologyData(response.data);
          setGeometryLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setTopologyData(null);
          setGeometryLoadFailed(true);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [minority, stateName]);

  if (!stateName) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }

  if (!topologyData) {
    if (geometryLoadFailed) {
      return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Unable to load precinct topology</div>;
    }
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Loading precinct topology...</div>;
  }

  return (
    <MapContainer center={stateName === "Oregon" ? [44.1, -119.6] : [33.33, -80.5]}
      zoom={stateName === "Oregon" ? 6.3 : 7.1}
      zoomSnap={0.1}
      minZoom={stateName === "Oregon" ? 6.1 : 6.9}
      style={{ width: "100%", height: "50vh" }}
      zoomControl={false}
      doubleClickZoom={false}
      keyboard={false}
      maxBounds={stateName === "Oregon" ? [[47, -125], [41, -114.4]] : [[35.6, -83.3], [31.5, -77.5]]}>
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
      />
      <TopoJSON data={topologyData} bins={bins} />
      <Legend bins={bins} />
    </MapContainer>
  );
}
