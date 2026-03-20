import React, { useEffect, useMemo, useState } from "react";
import '../../styles/state-page.css'
import { useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Oregon from "../data/oregon.js";
import SouthCarolina from "../data/sc.js";
import OregonDistrictData from "../data/oregonCongressionalDistricts.js"
import SCDistrictData from "../data/scCongressionalDistricts.js"

const dataMap = { Oregon, SouthCarolina }

function StateData(props) {

	const { stateName } = useParams();
	const data = props.stateData;

	return (
		<>
			<div id="statePageDataContainer">
				<span className="statePagePopulationDataContainer">
					<span className="statePageDataBubble">
						<p className="statePageDataBubbleLabel">Population:</p>
						<p className="statePageData statePageDataNum">{data.population}</p>
					</span>
					<span className="statePageDataBubble">
						<p className="statePageDataBubbleLabel">White Population:</p>
						<p className="statePageData statePageDataNum">{data.WhitePopulation}</p>
					</span>
					<span className="statePageDataBubble">
						<p className="statePageDataBubbleLabel">{stateName === 'Oregon' ? 'Asian' : 'Black'} Population:</p>
						<p className="statePageData statePageDataNum">{stateName === 'Oregon' ? data.AsianPopulation : data.BlackPopulation}</p>
					</span>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Party Control of Redistricting:</p>
					<p className="statePageData">{data.partyControl}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">State Voter Distribution (Democratic / Republican):</p>
					<p className="statePageData statePageDataNum">{data.voterDistributionDem} / {data.voterDistributionRep}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Democratic Representatives:</p>
					<p className="statePageData">{data.democratReps}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Republican Representatives:</p>
					<p className="statePageData">{data.republicanReps}</p>
				</span>
			</div>
			<p id="statePageDataFooter">Omitted racial group populations do not meet the threshold of 200,000.</p>
		</>
	)
}

function DistrictData(props) {
	const { stateName } = useParams();
	const districtNum = props.districtNum;

	// population data at https://www.census.gov/mycd/?st=41
	const CONGRESSIONAL_DATA = {
		Oregon: {
			districts: [
				{ districtNumber: 1, population: '716,626', representative: 'Suzanne Bonamici', party: 'Democrat', racialEthnicGroup: 'White', voteMargin2024: 24.1 },
				{ districtNumber: 2, population: '704,768', representative: 'Cliff Bentz', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -33.7 },
				{ districtNumber: 3, population: '700,007', representative: 'Maxine Dexter', party: 'Democrat', racialEthnicGroup: 'White', voteMargin2024: 46.2 },
				{ districtNumber: 4, population: '712,690', representative: 'Val Hoyle', party: 'Democrat', racialEthnicGroup: 'White', voteMargin2024: 8.9 },
				{ districtNumber: 5, population: '717,312', representative: 'Janelle Bynum', party: 'Democrat', racialEthnicGroup: 'Black', voteMargin2024: 3.2 },
				{ districtNumber: 6, population: '720,968', representative: 'Andrea Salinas', party: 'Democrat', racialEthnicGroup: 'Latino', voteMargin2024: 5.4 },
			],
		},
		SouthCarolina: {
			districts: [
				{ districtNumber: 1, population: '797,468', representative: 'Nancy Mace', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -13.8 },
				{ districtNumber: 2, population: '764,414', representative: 'Joe Wilson', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -22.4 },
				{ districtNumber: 3, population: '766,747', representative: 'Sheri Biggs', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -31.5 },
				{ districtNumber: 4, population: '810,387', representative: 'William Timmons', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -28.6 },
				{ districtNumber: 5, population: '782,718', representative: 'Ralph Norman', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -26.1 },
				{ districtNumber: 6, population: '762,934', representative: 'James Clyburn', party: 'Democrat', racialEthnicGroup: 'Black', voteMargin2024: 15.3 },
				{ districtNumber: 7, population: '794,163', representative: 'Russell Fry', party: 'Republican', racialEthnicGroup: 'White', voteMargin2024: -24.9 },
			],
		},
	};

	const stateData = CONGRESSIONAL_DATA[stateName?.replaceAll(' ', '')];

	if (!stateData) {
		return (
			<div className="congTable_unavailable">
				Congressional representation data is not available for <strong>{stateName}</strong>.
			</div>
		);
	}

	const { districts } = stateData;

	function VoteMarginBadge({ margin }) {
		const isDem = margin >= 0;
		const absMargin = Math.abs(margin).toFixed(1);
		const label = isDem ? `D+${absMargin}%` : `R+${absMargin}%`;
		return (
			<span>
				{label}
			</span>
		);
	}

	return (
		<>
			<div id="statePageDataContainer">
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Population:</p>
					<p className="statePageData statePageDataNum">{districts[districtNum - 1].population}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Representative:</p>
					<p className="statePageData">{districts[districtNum - 1].representative}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Representative's Party:</p>
					<p className="statePageData">{districts[districtNum - 1].party}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">Representative's Racial Group:</p>
					<p className="statePageData">{districts[districtNum - 1].racialEthnicGroup}</p>
				</span>
				<span className="statePageDataBubble">
					<p className="statePageDataBubbleLabel">2024 Presidential Election Vote Margin:</p>
					<p className="statePageData statePageDataNum"><VoteMarginBadge margin={districts[districtNum - 1].voteMargin2024} /></p>
				</span>
			</div>
		</>
	)
}

function EnsembleData() {
	return (
		<div id="statePageDataContainer">
			<span className="statePageDataBubble">
				<p className="statePageDataBubbleLabel">Number of District Plans in Ensemble:</p>
			</span>
			<span className="statePageDataBubble">
				<p className="statePageDataBubbleLabel">Population Equality Threshold:</p>
			</span>
		</div>
	)
}

export default function StatePage() {
	const { stateName } = useParams()
	const data = dataMap[stateName?.replaceAll(' ', '')]
	const fallbackDistrictData = useMemo(
		() => (data === Oregon ? OregonDistrictData : SCDistrictData),
		[data]
	);
	const [districtData, setDistrictData] = useState(null);
	const [tab, setTab] = useState("State");
	const [clickedDistrict, setDistrict] = useState(1);

	if (!data) {
		return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
	}

	useEffect(() => {
		let isActive = true;
		const stateCode = stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;

		if (!stateCode) {
			setDistrictData(fallbackDistrictData);
			return undefined;
		}

		(async () => {
			try {
				const response = await fetch(`/api/states/${stateCode}/districts/enacted/geojson`);
				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}
				const payload = await response.json();
				if (isActive) {
					setDistrictData(payload);
				}
			} catch (error) {
				if (isActive) {
					setDistrictData(fallbackDistrictData);
				}
			}
		})();

		return () => {
			isActive = false;
		};
	}, [stateName, fallbackDistrictData]);

	useEffect(() => {
		if (!districtData) {
			return undefined;
		}

		const map = L.map("statePagemap", {
			center: stateName === 'Oregon' ? [44.1, -120.6] : [33.6, -80.9],
			zoomControl: false,
			zoom: stateName === 'Oregon' ? 6.5 : 7.3,
			zoomSnap: 0.1,
			minZoom: 6.5,
			maxZoom: 10,
			maxBounds: stateName === 'Oregon' ? [[47, -125], [41, -116.4]] : [[35.6, -84], [31.5, -77.5]],
		});

		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		}).addTo(map);

		function getColor(result) {
			return result === "DEMOCRATIC" ? '#0011ff' :
				result === "REPUBLICAN" ? '#ff0000' :
					'#666666';
		}

		function style(feature) {
			return {
				fillColor: getColor(feature.properties.RESULT),
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.4
			};
		}

		function highlightFeature(e) {
			var layer = e.target;

			layer.setStyle({
				weight: 3,
				color: '#666',
				dashArray: '',
				fillOpacity: 0.5
			});

			layer.bringToFront();
			info.update(layer.feature.properties.NAMELSAD);
		}

		function resetHighlight(e) {
			geojson.resetStyle(e.target);
			info.update();
		}

		function handleMapClick(e) {
			setDistrict(e.target.feature.properties.district_number);

			document.querySelectorAll('.statePageDataTab').forEach((tab) => {
				tab.classList.remove('statePageActiveTab');
			});

			document.getElementById('statePageDistrictTab').classList.add('statePageActiveTab');

			setTab('District');
		}

		function onEachFeature(feature, layer) {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: handleMapClick,
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
					: "Click on a district");
		};

		info.addTo(map);

		let legend = L.control({ position: 'bottomright' });

		legend.onAdd = function (map) {

			let div = L.DomUtil.create('div', 'info legend');

			div.innerHTML += '<i style="background:' + getColor('DEMOCRATIC') + '"></i> ' + 'Democratic' + '<br>';
			div.innerHTML += '<i style="background:' + getColor('REPUBLICAN') + '"></i> ' + 'Republican' + '<br>';

			return div;
		};

		legend.addTo(map);

		// Cleanup
		return () => {
			map.remove();
		};
	}, [districtData, stateName, data]);

	function handleTabClick(e, tab) {
		document.querySelectorAll('.statePageDataTab').forEach((tab) => {
			tab.classList.remove('statePageActiveTab');
		});

		const clickedElement = e.target;
		clickedElement.classList.add('statePageActiveTab');
		setTab(tab);
	}

	return (
		<span id="statePageMain">
			<div id="statePageMapContainer">
				<div className="statePageMapLabel">District View of the State</div>
				<div id="statePagemap"></div>
			</div>
			<div id="statePageDataMainContainer">
				<div className="statePageDataLabel">{tab + (tab === 'District' ? ' ' + clickedDistrict + ' ' : ' ')}Data</div>
				<span className="statePageLabelsContainer">
					<div className="statePageDataTab statePageLeftDataLabel statePageActiveTab" onClick={(e) => handleTabClick(e, 'State')}>State</div>
					<div id="statePageDistrictTab" className="statePageDataTab" onClick={(e) => handleTabClick(e, 'District')}>District</div>
					<div className="statePageDataTab" onClick={(e) => handleTabClick(e, 'Ensembles')}>Ensembles</div>
				</span>
				{tab === 'State' ? <StateData stateData={data} /> : tab === 'District' ? <DistrictData districtNum={clickedDistrict} /> : <EnsembleData />}
				{/* <table className="statePageTable">
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
				</table> */}
			</div>
		</span>
	);
}
