import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import * as topojson from "topojson-client"
import ORPrecincts from "../data/OR-precincts-with-results.json"
import SCPrecincts from "../data/SC-precincts-with-results.json"

function TopoJSON(props) {
  const layerRef = useRef(null)
  const { data } = props

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
  }, []);

  return <GeoJSON ref={layerRef} />
}

export default function MinorityHeatMap(group) {
	const { stateName } = useParams()
	const data = stateName === "Oregon" ? ORPrecincts : stateName.replaceAll(' ', '') === "SouthCarolina" ? SCPrecincts : null

	if (!data) {
		return <div style={{fontWeight: "bolder", margin: "1rem"}}>Error: State not found</div>
	}

	return (
		<MapContainer center={stateName === 'Oregon' ? [44.1, -120.6] : [33.6, -80.9]}
			zoom={7} style={{ height: "90vh", width: "70vw" }}>
			<TileLayer
				attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
			/>
				<TopoJSON
				data={data}
			/>
		</MapContainer>
	)
}