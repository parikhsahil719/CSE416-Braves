import React, { useEffect } from "react";
import '../../styles/splash-page.css'
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUsStatesTopology } from '../queries/stateQueries.js';
import { keys } from '../lib/queryKeys.js';
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode } from '../utils/stateUtils.js';
import axios from 'axios';

function buildMapStyle(feature) {
  return {
    fillColor: feature.properties.isActive ? "rgb(0, 150, 0)" : "rgb(80, 80, 80)",
    weight: 2, opacity: 1, color: "white", dashArray: "3", fillOpacity: 0.7,
  };
}

function buildLegend() {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    [[true, "Active"], [false, "Inactive"]].forEach(([active, label]) => {
      div.innerHTML += `<i style="background:${active ? "rgb(0,150,0)" : "rgb(80,80,80)"}"></i>${label}<br>`;
    });
    return div;
  };
  return legend;
}

function buildInfoControl() {
  const info = L.control();
  info.onAdd = function () {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
  };
  info.update = function (props) {
    this._div.innerHTML = "<h4>US State</h4>" + (props ? `<b>${props.name}</b><br />` : "Click on an active state");
  };
  return info;
}

function Map({ switchPage }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: topoData } = useUsStatesTopology();
  const statesData = topoData ? topologyToFeatureCollection(topoData, "states") : null;

  useEffect(() => {
    if (!statesData) return undefined;

    const map = L.map("countrymap", {
      center: [38.3, -96], zoom: 4.8, zoomSnap: 0.1, zoomControl: false,
      minZoom: 4, maxZoom: 5, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, keyboard: false,
      maxBounds: [[50, -125.88], [24.84, -66.2]],
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const info = buildInfoControl();
    info.addTo(map);
    buildLegend().addTo(map);

    async function openStatePage(e) {
      const stateName = e.target.feature.properties.name;
      const stateCode = toStateCode(stateName);
      if (!stateCode) return;
      switchPage("State");
      await queryClient.prefetchQuery({
        queryKey: keys.stateSummary(stateCode),
        queryFn: () => axios.get(`/api/states/${stateCode}/state-summary`).then(r => r.data),
      });
      navigate(`/state/${stateName}`);
    }

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: e => { e.target.setStyle({ weight: 5, color: "#fff", dashArray: "", fillOpacity: 0.7 }); e.target.bringToFront(); info.update(e.target.feature.properties); },
        mouseout:  e => { geojson.resetStyle(e.target); info.update(); },
        click:     openStatePage,
      });
    }

    const geojson = L.geoJson(statesData, { style: buildMapStyle, onEachFeature }).addTo(map);

    return () => map.remove();
  }, [navigate, statesData, switchPage, queryClient]);

  return (
    <div id="mapContainer">
      <div id="countrymap" />
    </div>
  );
}

export default function SplashPage({ switchPage }) {
  return (
    <div className="splashPage">
      <div className="splashPage_body">
        <div className="splashPage_mapHeader">Country Map</div>
        <Map switchPage={switchPage} />
      </div>
    </div>
  );
}
