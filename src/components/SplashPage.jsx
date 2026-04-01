import React, {useEffect, useRef} from 'react'
import '../../styles/splash-page.css'
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import * as topojson from "topojson-client"
import data from '../data/us-states.json'

// ─────────────────────────────────────────────
// SplashPage
// ─────────────────────────────────────────────

function getColor(isActive) {
  return isActive ? "rgb(0, 150, 0)" : "rgb(80, 80, 80)";
}

function TopoJSON(props) {
  const navigate = useNavigate()
  const layerRef = useRef(null)
  const { data, infoRef, switchPage } = props

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.isActive),
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  }

  function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
      weight: 5,
      color: "#ffffffff",
      dashArray: "",
      fillOpacity: 0.7,
    });

    layer.bringToFront();
    infoRef.current.update(layer.feature.properties);
  }

  function resetHighlight(e) {
    layerRef.current.resetStyle(e.target);
    infoRef.current.update();
  }

  function openStatePage(e) {
    const stateName = e.target.feature.properties.name;
    if (stateName === 'Oregon' || stateName === 'South Carolina') {
      switchPage('State')
      navigate(`/state/${stateName}`);
    }
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: openStatePage,
    });
  }

  function addData(layer, jsonData) {
    if (jsonData.type === "Topology") {
      for (let key in jsonData.objects) {
        let geojson = topojson.feature(jsonData, jsonData.objects[key])
        layer.addData(geojson)
      }
    } else {
      layer.addData(jsonData)
    }
  }

  useEffect(() => {
    const layer = layerRef.current
    layer.clearLayers()
    addData(layer, data)
  }, [data]);

  return <GeoJSON ref={layerRef} style={style} onEachFeature={onEachFeature} />
}

function Info({infoRef}) {
  const map = useMap();

  useEffect(() => {
    const info = L.control({ position: "topright" });

    info.onAdd = function () {
      this._div = L.DomUtil.create("div", "info");
      this.update();
      return this._div;
    };

    info.update = function (props) {
      this._div.innerHTML =
        "<h4>US State</h4>" +
        (props
          ? "<b>" + props.name + "</b><br />"
          : "Click on a state");
    };

    info.addTo(map);

    infoRef.current = info;

    return () => {
      info.remove();
    };
  }, [map, infoRef]);
}

function Legend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");

      const grades = [true, false];

      grades.forEach((grade) => {
        div.innerHTML +=
          '<i style="background:' +
          getColor(grade) +
          '"></i>' +
          (grade ? "Active" + "<br><br>" : "Inactive")
      });

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}

function Map({switchPage}) {
  const infoRef = useRef(null);

  if (!data) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: Country data not found</div>
  }

  return (
    <MapContainer center={[38.3, -96]}
      zoomControl={false}
      zoom={4.8}
      zoomSnap={0.1}
      dragging={false}
      scrollWheelZoom={false}
      style={{ width: "85rem", height: "85vh" }}
      doubleClickZoom={false}
      keyboard={false}
      maxBounds={[[50, -125.88], [24.84, -66.2]]}>
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
      />
      <TopoJSON
        data={data}
        infoRef={infoRef}
        switchPage={switchPage}
      />
      <Info infoRef={infoRef}/>
      <Legend />
    </MapContainer >
  )
}

export default function SplashPage({switchPage}) {
  return (
  <div className="splashPage">
    <div className="splashPage_body">
      {/* <h1 className="splashPage__title">Voting Rights Act Repeal Analysis</h1> */}
      <div className='splashPage_mapHeader'>Country Map</div>
      <Map switchPage={switchPage}/>
    </div>
  </div>
  )
};