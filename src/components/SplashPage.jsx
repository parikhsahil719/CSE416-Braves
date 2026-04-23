import React, { useEffect } from "react";
import '../../styles/splash-page.css'
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";
import { toStateCode } from "../lib/stateMetadata.js";
import { prefetchStateLandingData, useUsStatesTopologyQuery } from "../queries/stateQueries.js";
// ─────────────────────────────────────────────
// SplashPage
// ─────────────────────────────────────────────
function Map({switchPage})
{
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: statesData } = useUsStatesTopologyQuery();

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
      return isActive ? "rgb(0, 150, 0)" : "rgb(80, 80, 80)";
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
      info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
      geojson.resetStyle(e.target);
      info.update();
    }

    async function openStatePage(e) {
      const stateName = e.target.feature.properties.name;
      const stateCode = toStateCode(stateName);

      if (stateCode) {
        switchPage("State");

        try {
          await prefetchStateLandingData(queryClient, stateCode);
        } catch {
          // Navigation still proceeds on prefetch failure.
        }

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

    const geojson = L.geoJson(statesData, {
      style,
      onEachFeature,
    }).addTo(map);

    const info = L.control();

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
          : "Click on an active state");
    };

    info.addTo(map);

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const grades = [true, false];

      grades.forEach((grade) => {
        div.innerHTML +=
          '<i style="background:' +
          getColor(grade) +
          '"></i>' +
          (grade ? "Active" + "<br>": "Inactive")
      });

      return div;
    };

    legend.addTo(map);

    // Cleanup
    return () => {
      map.remove();
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
    <>
      <div id="mapContainer">
        <div id="countrymap"></div>
      </div>
    </>
  );
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
