import React, { useEffect } from "react";
import '../../styles/state-page.css'
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Oregon from "../data/oregon.js";
import SouthCarolina from "../data/sc.js";
import OregonDistrictData from "../data/oregonCongressionalDistricts.js"
import SCDistrictData from "../data/scCongressionalDistricts.js"

const dataMap = { Oregon, SouthCarolina }

export default function StatePage() {
	const { stateName } = useParams()
	const data = dataMap[stateName?.replaceAll(' ', '')]
	const districtData = data === Oregon ? OregonDistrictData : SCDistrictData

	if (!data) {
		return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
	}

	useEffect(() => {
		const map = L.map("statePagemap", {
			center: stateName === 'Oregon' ? [44.1, -120.6] : [33.6, -80.9],
			zoomControl: false,
			zoom: stateName === 'Oregon' ? 6.5 : 7.3,
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

		function getColor(district_number) {
			return district_number === 1 ? '#1b9e77' :
				district_number === 2 ? '#d95f02' :
					district_number === 3 ? '#7570b3' :
						district_number === 4 ? '#e7298a' :
							district_number === 5 ? '#66a61e' :
								district_number === 6 ? '#e6ab02' :
									district_number === 7 ? '#a6761d' :
										'#666666';
		}

		function style(feature) {
			return {
				fillColor: getColor(feature.properties.district_number),
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7
			};
		}

		function highlightFeature(e) {
			var layer = e.target;

			layer.setStyle({
				weight: 5,
				color: '#666',
				dashArray: '',
				fillOpacity: 0.7
			});

			layer.bringToFront();
			info.update(layer.feature.properties.NAMELSAD);
		}

		function resetHighlight(e) {
			geojson.resetStyle(e.target);
			info.update();
		}

		function onEachFeature(feature, layer) {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
			});
		}

		const geojson = L.geoJson(districtData, { style, onEachFeature }).addTo(map);

		const info = L.control();

		info.onAdd = function () {
			this._div = L.DomUtil.create("div", "info");
			this.update();
			return this._div;
		};

		info.update = function (props) {
			this._div.innerHTML =
				`<h4>${stateName}</h4>` +
				(props
					? "<b>" + props + "</b><br />"
					: "Hover over a district");
		};

		info.addTo(map);

		let legend = L.control({ position: 'bottomright' });

		legend.onAdd = function (map) {

			let div = L.DomUtil.create('div', 'info legend'),
				grades = data === Oregon ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7]

			grades.forEach((grade) => {
				div.innerHTML += '<i style="background:' + getColor(grade) + '"></i> ' + grade + "<br>";
			})

			return div;
		};

		legend.addTo(map);

		// Cleanup
		return () => {
			map.remove();
		};
	}, []);

	return (
		<span id="statePageMain">
			<div id="statePageMapContainer">
				<div className="statePageMapLabel">District View of the State</div>
				<div id="statePagemap"></div>
			</div>
			<div id="tableContainer">
				<div className="statePageTableLabel">State Population Data</div>
				<table className="statePageTable">
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
							<th>White Population</th>
							<td>{data.WhitePopulation}</td>
						</tr>
						<tr>
							<th>Black Population</th>
							<td>{data.BlackPopulation}</td>
						</tr>
						<tr>
							<th>American Indian and Alaska Native Population</th>
							<td>{data.IndianPopulation}</td>
						</tr>
						<tr>
							<th>Asian Population</th>
							<td>{data.AsianPopulation}</td>
						</tr>
						<tr>
							<th>Native Hawaiian and Other Pacific Islander Population</th>
							<td>{data.HawaiianPopulation}</td>
						</tr>
						<tr>
							<th>Two or More Races Population</th>
							<td>{data.MultipleRacesPopulation}</td>
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
	);
}
