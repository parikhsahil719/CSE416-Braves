import React, { useEffect, useState } from "react";
import '../../styles/splash-page.css'
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from 'react-router-dom';
import { topologyToFeatureCollection } from "../utils/topology.js";

function toStateCode(stateName) {
  if (stateName === "Oregon") {
    return "OR";
  }

  if (stateName === "South Carolina") {
    return "SC";
  }

  return null;
}
// ─────────────────────────────────────────────
// SplashPage
// ─────────────────────────────────────────────
function Map({switchPage})
{
  const navigate = useNavigate();
  const [statesData, setStatesData] = useState(null);

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const response = await axios.get("/api/maps/us-states/topology");
        if (isActive) {
          setStatesData(topologyToFeatureCollection(response.data, "states"));
        }
      } catch {
        if (isActive) {
          setStatesData(null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!statesData) {
      return undefined;
    }

    const map = L.map("countrymap", {
      center: [38.3, -96],
      zoomControl: false,
      zoom: 4.8,
      zoomSnap: 0.1,
      minZoom: 4,
      maxZoom: 5,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      maxBounds: [[50, -125.88], [24.84, -66.2]],
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    function getColor(isActive) {
      return isActive ? "#008000ff" : "#0a0a0aff";
    }

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

    async function openStatePage(e) {
      const stateName = e.target.feature.properties.name;
      const stateCode = toStateCode(stateName);

      if (stateCode) {
        switchPage("State");

        try {
          const response = await axios.get(`/api/states/${stateCode}/state-summary`);
          navigate(`/state/${stateName}`, {
            state: {
              prefetchedStateId: stateCode,
              prefetchedStateSummary: response.data,
            },
          });
        } catch {
          navigate(`/state/${stateName}`);
        }
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
  }, [navigate, statesData, switchPage]);

  if (!statesData) {
    return (
      <>
        <div id="mapContainer">
          <div id="countrymap"></div>
        </div>
      </>
    );
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