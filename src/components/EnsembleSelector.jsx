import React, { useState } from "react";
import "../../styles/ensemble-selector.css";
import arrowDropdown from "/white_arrow_drop_down.svg";

export default function EnsembleSelector({ stateName, ensembleType, currEnsemble, switchEnsemble }) {
  const [showList, setShowList] = useState(false);
  const rbEnsembleList = [
    {
      ensembleId: 1,
      ensembleName: "Race-Blind Ensemble 1"
    },
    {
      ensembleId: 2,
      ensembleName: "Race-Blind Ensemble 2"
    },
    {
      ensembleId: 3,
      ensembleName: "Race-Blind Ensemble 3"
    },
    {
      ensembleId: 4,
      ensembleName: "Race-Blind Ensemble 4"
    },
  ]
  const vraEnsembleList = [
    {
      ensembleId: 1,
      ensembleName: "VRA Ensemble 1"
    },
    {
      ensembleId: 2,
      ensembleName: "VRA Ensemble 2"
    },
    {
      ensembleId: 3,
      ensembleName: "VRA Ensemble 3"
    },
    {
      ensembleId: 4,
      ensembleName: "VRA Ensemble 4"
    },
  ]

  const ensembleList = (ensembleType === "rb" ? rbEnsembleList : vraEnsembleList);

  function toggleList() {
    setShowList(!showList);
  }

  return (
    <div className="ensemble-selector-container">
      <span className="ensemble-selector-selected" onClick={() => toggleList()}>
        {currEnsemble}
        <img id="dropdown-icon" src={arrowDropdown} width="20px"/>
      </span>
      {showList && (
      <div className="ensemble-selector-dropdown-container">
        {ensembleList.map((ensemble) => (
          <span key={ensemble.ensembleId} className={currEnsemble === ensemble.ensembleName ? "ensemble-selector-selected" : "ensemble-selector-option"}
          onClick={() => {switchEnsemble(ensemble.ensembleName, ensemble.ensembleId); toggleList();}}>
            {ensemble.ensembleName}
          </span>
        ))}
      </div>
      )}
    </div>
  );
}