export function toStateCode(stateName) {
  if (stateName === "Oregon") {
    return "OR";
  }

  if (stateName === "South Carolina") {
    return "SC";
  }

  return null;
}

export function toGroupKey(minority) {
  const map = {
    Latino: "latino",
    Asian: "asian",
    White: "white",
    Black: "black",
  };

  return map[minority] ?? (minority ? minority.toLowerCase() : null);
}

export function defaultGroup(stateCode) {
  return stateCode === "OR" ? "latino" : "black";
}
