import React from "react";
import "../../styles/district-map.css"
import "../../styles/interesting-map.css"
import { useEffect, useRef } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";

function getColor(property) {
  if (property > 300000) return "#005a32"; if (property > 200000) return "#238443";
  if (property > 100000) return "#41ab5d"; if (property > 50000) return "#78c679";
  if (property > 25000) return "#addd8e"; if (property > 0) return "#d9f0a3";
  return "#ffffcc";
}

function getMinorityPop(feature, stateName) {
  return stateName === "Oregon"
    ? feature?.properties?.hispanic
    : feature?.properties?.black;
}

function getBaseDistrictStyle(feature, stateName) {
  return {
    fillColor: getColor(getMinorityPop(feature, stateName)),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.6,
  };
}

function getSelectedDistrictStyle() {
  return {
    weight: 3,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.5,
  };
}

function TopoLayer({ data, infoRef, selectedDistrict, onSelectDistrict, stateName }) {
  const layerRef = useRef(null);

  function style(layer) {
    layer.setStyle(getBaseDistrictStyle(layer.feature, stateName));
  }

  function highlightFeature(event) {
    const layer = event.target;
    layer.setStyle(getSelectedDistrictStyle());
    layer.bringToFront();

    if (infoRef.current) {
      infoRef.current.update(`District ${layer.feature.properties.district_id}`);
    }
  }

  function resetHighlight(event) {
    if (!layerRef.current) {
      return;
    }

    layerRef.current.resetStyle(event.target);
    style(event.target);

    if (infoRef.current) {
      infoRef.current.update();
    }
  }

  function applySelection(layer) {
    const districtNumber = layer?.feature?.properties?.district_id;

    if (districtNumber === selectedDistrict) {
      layer.setStyle(getSelectedDistrictStyle());
      layer.bringToFront();
      return;
    }

    layer.setStyle(getBaseDistrictStyle(layer.feature, stateName));
  }

  function handleMapClick(event) {
    onSelectDistrict(event.target.feature.properties.district_id);
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: handleMapClick,
    });
  }

  useEffect(() => {
    if (!layerRef.current) {
      return;
    }

    layerRef.current.eachLayer((layer) => {
      applySelection(layer);
    });
  }, [selectedDistrict, stateName]);

  useEffect(() => {
    if (!layerRef.current || !data) return;

    layerRef.current.clearLayers();
    layerRef.current.addData(data);
  }, [data]);

  return <GeoJSON ref={layerRef} style={(feature) => getBaseDistrictStyle(feature, stateName)} onEachFeature={onEachFeature} />;
}

function Info({ infoRef, stateName }) {
  const map = useMap();

  useEffect(() => {
    const info = L.control({ position: "topright" });

    info.onAdd = function onAdd() {
      this._div = L.DomUtil.create("div", "info");
      this.update();
      return this._div;
    };

    info.update = function update(props) {
      this._div.innerHTML =
        `<h4>${stateName}</h4>` +
        (props ? `<b>${props}</b><br />` : "Hover over a district");
    };

    info.addTo(map);
    infoRef.current = info;

    return () => {
      info.remove();
      infoRef.current = null;
    };
  }, [map, infoRef, stateName]);

  return null;
}

function Legend({ stateName }) {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function onAdd() {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML += `<h4>${stateName === "Oregon" ? "Hispanic" : "Black"} Population</h4>`;

      const grades = [0, 25000, 50000, 100000, 200000, 300000];
      grades.forEach((g, i) => { div.innerHTML += `<div style="display:flex;align-items:center;margin-bottom:4px"><i style="background:${getColor(g + 0.1)};display:inline-block"></i>${g.toLocaleString()}${grades[i + 1] ? `&ndash;${grades[i + 1].toLocaleString()}` : "+"}</div>`; });
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map, stateName]);

  return null;
}

export default function InterestingMap({ stateName, data, selectedDistrict, onSelectDistrict }) {
  const infoRef = useRef(null);

    if (!data) {
      return <div id="interestingmap" className="interestingMapPlaceholder" />;
    }

    return (
      <div id="interestingmap">
        <MapContainer
          center={stateName === "Oregon" ? [44.1, -120.6] : [33.6, -80.9]}
          zoomControl={false}
          zoom={stateName === "Oregon" ? 6.1 : 6.7}
          zoomSnap={0.1}
          minZoom={6}
          maxZoom={10}
          maxBounds={stateName === "Oregon" ? [[47, -125], [41, -116.4]] : [[35.6, -84], [31.5, -77.5]]}
          className="districtLeafletMap"
        >
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
          <TopoLayer
            data={data}
            infoRef={infoRef}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={onSelectDistrict}
            stateName={stateName}
          />
          <Info infoRef={infoRef} stateName={stateName} />
          <Legend stateName={stateName} />
        </MapContainer>
      </div>
    );
}
