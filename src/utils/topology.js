import * as topojson from "topojson-client";

export function topologyToFeatureCollection(topology, preferredObjectKey = null) {
  if (!topology) {
    return null;
  }

  if (topology.type !== "Topology") {
    return topology;
  }

  const objects = topology.objects ?? {};
  const keys = preferredObjectKey && objects[preferredObjectKey]
    ? [preferredObjectKey]
    : Object.keys(objects);

  const features = [];

  keys.forEach((key) => {
    const converted = topojson.feature(topology, objects[key]);
    if (converted?.type === "FeatureCollection") {
      features.push(...(converted.features ?? []));
      return;
    }

    if (converted) {
      features.push(converted);
    }
  });

  return {
    type: "FeatureCollection",
    features,
  };
}
