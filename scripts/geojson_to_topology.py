#!/usr/bin/env python3
"""Convert local GeoJSON-style sources into simple TopoJSON artifacts.

This converter intentionally keeps the topology representation minimal:
- no quantization
- no simplification
- one arc per polygon ring / line string

That is sufficient for frontend delivery via topojson-client while keeping the
artifacts deterministic and dependency-free inside this repository.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable


def load_input(path: Path) -> dict[str, Any]:
    text = path.read_text()
    if path.suffix == ".js":
        start = text.find("{")
        end = text.rfind("};")
        if start == -1 or end == -1:
            raise ValueError(f"Could not extract JSON object from {path}")
        text = text[start:end + 1]
    return json.loads(text)


def iter_positions(value: Any) -> Iterable[list[float]]:
    if isinstance(value, list):
        if len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
            yield value
            return
        for item in value:
            yield from iter_positions(item)


def bbox_for_geojson(document: dict[str, Any]) -> list[float] | None:
    positions = list(iter_positions(document))
    if not positions:
        return None
    xs = [position[0] for position in positions]
    ys = [position[1] for position in positions]
    return [min(xs), min(ys), max(xs), max(ys)]


def add_arc(arcs: list[list[list[float]]], coordinates: list[list[float]]) -> int:
    arcs.append(coordinates)
    return len(arcs) - 1


def convert_geometry(geometry: dict[str, Any], arcs: list[list[list[float]]]) -> dict[str, Any]:
    geometry_type = geometry["type"]
    coordinates = geometry.get("coordinates")

    if geometry_type == "Polygon":
        return {
            "type": "Polygon",
            "arcs": [[add_arc(arcs, ring)] for ring in coordinates],
        }

    if geometry_type == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "arcs": [
                [[add_arc(arcs, ring)] for ring in polygon]
                for polygon in coordinates
            ],
        }

    if geometry_type == "LineString":
        return {
            "type": "LineString",
            "arcs": [add_arc(arcs, coordinates)],
        }

    if geometry_type == "MultiLineString":
        return {
            "type": "MultiLineString",
            "arcs": [add_arc(arcs, line) for line in coordinates],
        }

    if geometry_type == "Point":
        return {
            "type": "Point",
            "coordinates": coordinates,
        }

    if geometry_type == "MultiPoint":
        return {
            "type": "MultiPoint",
            "coordinates": coordinates,
        }

    raise ValueError(f"Unsupported geometry type: {geometry_type}")


def feature_to_geometry(feature: dict[str, Any], arcs: list[list[list[float]]]) -> dict[str, Any]:
    converted = convert_geometry(feature["geometry"], arcs)
    if "id" in feature:
        converted["id"] = feature["id"]
    if "properties" in feature:
        converted["properties"] = feature["properties"]
    return converted


def convert_feature_collection(document: dict[str, Any], object_name: str) -> dict[str, Any]:
    if document.get("type") != "FeatureCollection":
        raise ValueError("Expected a GeoJSON FeatureCollection input")

    arcs: list[list[list[float]]] = []
    geometries = [feature_to_geometry(feature, arcs) for feature in document["features"]]

    topology = {
        "type": "Topology",
        "objects": {
            object_name: {
                "type": "GeometryCollection",
                "geometries": geometries,
            }
        },
        "arcs": arcs,
    }

    bbox = bbox_for_geojson(document)
    if bbox is not None:
        topology["bbox"] = bbox

    return topology


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--object-name", required=True)
    args = parser.parse_args()

    source = Path(args.source)
    output = Path(args.output)
    topology = convert_feature_collection(load_input(source), args.object_name)
    output.write_text(json.dumps(topology, separators=(",", ":")))


if __name__ == "__main__":
    main()
