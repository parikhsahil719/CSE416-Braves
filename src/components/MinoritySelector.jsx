import React from "react";
import "../../styles/minority-selector.css";
import { groupOptionsForState } from "../utils/stateUtils";

export default function MinoritySelector({ stateName, currMinority, switchMinority }) {

  const bubbles = groupOptionsForState(stateName)
    .map(group => <span key={group} className={currMinority === group ? "minority-selector-bubble minority-selector-active" : "minority-selector-bubble"} onClick={() => switchMinority(group)}>{group}</span>);

  return (
    <div className="minority-selector-container">
      <span style={{ fontWeight: "bolder" }}>Select a racial group: </span>
      {bubbles}
    </div>
  );
}