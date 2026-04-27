import React, { useEffect, useRef } from "react";
import "../../styles/minority-map.css";
import { useParams } from "react-router-dom";
import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode, toGroupKey, defaultGroup, groupOptionsForState } from "../utils/stateUtils.js";
import { useHeatmap, usePrecinctTopology } from "../queries/stateQueries.js";
import MinoritySelector from "./MinoritySelector.jsx";

function percentageColor(pct) {
  if (pct > 50) return "#005a32"; if (pct > 40) return "#238443";
  if (pct > 30) return "#41ab5d"; if (pct > 20) return "#78c679";
  if (pct > 10) return "#addd8e"; if (pct > 5) return "#d9f0a3";
  return "#ffffcc";
}

function featurePercent(feature, currMinority) {
  const map = { Black: feature?.properties?.black, Asian: feature?.properties?.asian, Latino: feature?.properties?.hispanic };
  const raw = map[currMinority] / feature?.properties?.total * 100;
  return Number.isFinite(raw) ? raw : 0;
}

function TopoJSON({ currMinority, data, infoRef }) {
  const layerRef = useRef(null);

  const style = f => ({ fillColor: percentageColor(featurePercent(f, currMinority)), weight: 2, opacity: 1, color: "white", dashArray: "3", fillOpacity: 0.7 });

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: e => { e.target.setStyle({ weight: 2, color: "#666", dashArray: "", fillOpacity: 0.7 }); e.target.bringToFront(); infoRef.current?.update(featurePercent(e.target.feature, currMinority).toFixed(2)); },
      mouseout: e => { layerRef.current?.resetStyle(e.target); infoRef.current?.update(); },
    });
  }

  useEffect(() => { layerRef.current?.clearLayers(); layerRef.current?.addData(topologyToFeatureCollection(data)); }, [data]);

  return <GeoJSON key={currMinority} data={topologyToFeatureCollection(data)} ref={layerRef} style={style} onEachFeature={onEachFeature} />;
}

function InfoControl({ infoRef }) {
  const map = useMap();
  useEffect(() => {
    const info = L.control({ position: "topright" });
    info.onAdd = function () { this._div = L.DomUtil.create("div", "info"); this.update(); return this._div; };
    info.update = function (pct) { this._div.innerHTML = `<h4>Population Percentage</h4>${pct ? `<b>${pct}%</b><br />` : "Hover over a precinct"}`; };
    info.addTo(map);
    infoRef.current = info;
    return () => { info.remove(); infoRef.current = null; };
  }, [map, infoRef]);
  return null;
}

function LegendControl({ bins }) {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML += "<h4>% Population</h4>";

      const grades = [0, 5, 10, 20, 30, 40, 50];
      grades.forEach((g, i) => { div.innerHTML += `<div style="display:flex;align-items:center;margin-bottom:4px"><i style="background:${percentageColor(g + 0.01)};display:inline-block"></i>${g}${grades[i + 1] ? `&ndash;${grades[i + 1]}` : "+"}</div>`; });

      // const grades = Array.isArray(bins) && bins.length > 0 ? null : [0, 5, 10, 20, 30, 40, 50];
      // if (bins?.length) {
      //   bins.forEach(b => { div.innerHTML += `<div style="display:flex;align-items:center;margin-bottom:4px"><i style="background:${b.color};display:inline-block"></i>${b.max >= 100 ? `${b.min}+` : `${b.min}-${b.max}`}</div>`; });
      // } else {
      //   grades.forEach((g, i) => { div.innerHTML += `<div style="display:flex;align-items:center;margin-bottom:4px"><i style="background:${percentageColor(g + 0.01)};display:inline-block"></i>${g}${grades[i + 1] ? `&ndash;${grades[i + 1]}` : "+"}</div>`; });
      // }
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [bins, map]);
  return null;
}

export default function MinorityHeatMap({ currMinority, switchMinority }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);

  useEffect(() => {
    if (!groupOptionsForState(stateName).includes(currMinority))
      switchMinority(defaultGroup(stateCode));
  }, []);

  const group = toGroupKey(currMinority);
  const infoRef = useRef(null);

  const heatmap = useHeatmap(stateCode, group);
  const topo = usePrecinctTopology(stateCode);

  if (!stateName) return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  if (topo.isError) return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Unable to load precinct topology</div>;
  if (!topo.data) return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Loading precinct topology...</div>;

  const center = stateName === "Oregon" ? [44.1, -119.6] : [33.33, -80.5];
  const zoom = stateName === "Oregon" ? 6.3 : 7.1;
  const minZoom = stateName === "Oregon" ? 6.1 : 6.9;
  const bounds = stateName === "Oregon" ? [[47, -125], [41, -114.4]] : [[35.6, -83.3], [31.5, -77.5]];

  return (
    <>
      <MinoritySelector stateName={stateName} currMinority={currMinority} switchMinority={switchMinority} />
      <div id="minoritymap">
        <MapContainer center={center} zoom={zoom} zoomSnap={0.1} minZoom={minZoom} zoomControl={false} doubleClickZoom={false} keyboard={false} maxBounds={bounds} className="minorityLeafletMap">
          <TileLayer attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
          <TopoJSON currMinority={currMinority} data={topo.data} infoRef={infoRef} />
          <InfoControl infoRef={infoRef} />
          <LegendControl bins={heatmap.data?.bins ?? []} />
        </MapContainer>
      </div>
    </>
  );
}
