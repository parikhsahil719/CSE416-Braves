import React from "react";
import "../../styles/district-map.css"
import { useEffect, useRef } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";

function getColor(result) {
  return result === "DEMOCRATIC"
    ? "#0011ff"
    : result === "REPUBLICAN"
      ? "#ff0000"
      : "#666666";
}

function getBaseDistrictStyle(feature) {
  return {
    fillColor: getColor(feature?.properties?.RESULT),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.4,
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

function TopoLayer({ data, infoRef, selectedDistrict, onSelectDistrict, onChangeTab }) {
  const layerRef = useRef(null);

  function applySelection(layer) {
    const districtNumber = layer?.feature?.properties?.district_number;

    if (districtNumber === selectedDistrict) {
      layer.setStyle(getSelectedDistrictStyle());
      layer.bringToFront();
      return;
    }

    layer.setStyle(getBaseDistrictStyle(layer.feature));
  }

  function highlightFeature(event) {
    const layer = event.target;
    layer.setStyle(getSelectedDistrictStyle());
    layer.bringToFront();

    if (infoRef.current) {
      infoRef.current.update(layer.feature.properties.NAMELSAD);
    }
  }

  function resetHighlight(event) {
    if (!layerRef.current) {
      return;
    }

    layerRef.current.resetStyle(event.target);
    applySelection(event.target);

    if (infoRef.current) {
      infoRef.current.update();
    }
  }

  function handleMapClick(event) {
    onSelectDistrict(event.target.feature.properties.district_number);
    onChangeTab("District");
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
  }, [selectedDistrict]);

  return <GeoJSON ref={layerRef} data={data} style={getBaseDistrictStyle} onEachFeature={onEachFeature} />;
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
        (props ? `<b>${props}</b><br />` : "Click on a district");
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

function Legend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function onAdd() {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML += `<i style="background:${getColor("DEMOCRATIC")}"></i> Democratic<br>`;
      div.innerHTML += `<i style="background:${getColor("REPUBLICAN")}"></i> Republican<br>`;
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}

export default function DistrictMap({ stateName, data, selectedDistrict, onSelectDistrict, onChangeTab, zoom }) {
  const infoRef = useRef(null);

    if (!data) {
      return <div id="districtmap" className="districtMapPlaceholder" />;
    }

    return (
      <div id="districtmap">
        <MapContainer
          center={stateName === "Oregon" ? [44.1, -120.6] : [33.6, -80.9]}
          zoomControl={false}
          zoom={zoom ? zoom : stateName === "Oregon" ? 6.6 : 7.3}
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
            onChangeTab={onChangeTab}
          />
          <Info infoRef={infoRef} stateName={stateName} />
          <Legend />
        </MapContainer>
      </div>
    );
}