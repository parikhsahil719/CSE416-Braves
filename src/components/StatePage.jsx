import React, { useEffect } from "react";
import '../../styles/state-page.css'
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import statesData from "../../data/us-states.js";
import Oregon from "../../data/oregon.js";
import SouthCarolina from "../../data/sc.js";

const dataMap = {Oregon, SouthCarolina}

export default function StatePage() {
  const { stateName } = useParams()
	const data = dataMap[stateName?.replaceAll(' ', '')]

	if (!data) {
    return <div style={{fontWeight: "bolder", margin: "1rem"}}>Error: State not found</div>;
  }

	useEffect(() => {
		const map = L.map("statePagemap", {
			center: stateName === 'Oregon' ? [44.1, -120.5] : [33.6, -80.9],
			zoomControl: false,
			zoom: stateName === 'Oregon' ? 6.6 : 7.3,
			zoomSnap: 0.1,
			minZoom: 5,
			maxZoom: 8,
			dragging: false,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			keyboard: false,
		});

		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		}).addTo(map);

			// Something like this to color each district
			//////////////////////////////////////////////
			// function getColor(d) {
			// 	 return d > 1000 ? '#800026' :
			// 				d > 500  ? '#BD0026' :
			// 				d > 200  ? '#E31A1C' :
			// 				d > 100  ? '#FC4E2A' :
			// 				d > 50   ? '#FD8D3C' :
			// 				d > 20   ? '#FEB24C' :
			// 				d > 10   ? '#FED976' :
			// 										'#FFEDA0';
			// }

			// function style(feature) {
			// 	 return {
			// 			fillColor: getColor(feature.properties.density),
			// 			weight: 2,
			// 			opacity: 1,
			// 			color: 'white',
			// 			dashArray: '3',
			// 			fillOpacity: 0.7
			// 	 };
			// }

			// function highlightFeature(e) {
			// 	var layer = e.target;

			// 	layer.setStyle({
			// 			weight: 5,
			// 			color: '#666',
			// 			dashArray: '',
			// 			fillOpacity: 0.7
			// 	});

			// 	layer.bringToFront();
			// 	info.update(layer.feature.properties);
			// }

			// function resetHighlight(e) {
			// 	geojson.resetStyle(e.target);
			// 	info.update();
			// }

			// function onEachFeature(feature, layer) {
			// 	layer.on({
			// 		mouseover: highlightFeature,
			// 		mouseout: resetHighlight,
			// 	});
			// }

		const geojson = L.geoJson(statesData, {}).addTo(map);

		// Cleanup
    return () => {
      map.remove();
    };
  }, []);

  return (
    <>
			<span id="statePageMain">
				<div id="statePageMapContainer">
					<div id="statePagemap"></div>
				</div>
				<div id="tableContainer">
				<table>
					<tbody>
						<tr>
							<th>State Population</th>
							<td>{data.population}</td>
						</tr>
						<tr>
							<th rowSpan="2">State Voter Distribution</th>
							<td>D: {data.voterDistributionDem}</td>
						</tr>
						<tr>
							<td>R: {data.voterDistributionRep}</td>
						</tr>
						<tr>
							<th>Racial Group 1 Population</th>
							<td>x</td>
						</tr>
						<tr>
							<th>Racial Group 2 Population</th>
							<td>x</td>
						</tr>
						<tr>
							<th>Racial Group 3 Population</th>
							<td>x</td>
						</tr>
						<tr>
							<th>Racial Group 4 Population</th>
							<td>x</td>
						</tr>
						<tr>
							<th>Racial Group 5 Population</th>
							<td>x</td>
						</tr>
						<tr>
							<th>Party Control of Redistricting Process</th>
							<td>{data.partyControl}</td>
						</tr>
						<tr>
							<th>Democratic Congressional Representatives</th>
							<td>{data.democratReps}</td>
						</tr>
						<tr>
							<th>Republican Congressional Representatives</th>
							<td>{data.republicanReps}</td>
						</tr>
						<tr>
							<th>Summary of Ensembles</th>
							<td></td>
						</tr>
					</tbody>
				</table>
				</div>
			</span>
    </>
  );
}