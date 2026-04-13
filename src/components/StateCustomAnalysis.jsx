import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/custom-analysis.css";
import EiSupportChart from "../charts/EiSupportChart.jsx";
import SingleEnsembleSplitsChart from "../charts/SingleEnsembleSplitsChart.jsx";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";

const DEFAULT_DROPDOWN_VALUE = "--";
const LANGUAGE_OPTIONS = ["English", "Spanish", "French"];
const duplicateAllowedUseCases = new Set(["GUI-12", "GUI-16", "GUI-17"]);

const dataDescriptionList = [
  { id: "GUI-8", label: "GUI-8", needsMinority: false, extraDropdowns: 0, implemented: false },
  { id: "GUI-12", label: "GUI-12", needsMinority: true, extraDropdowns: 2, implemented: true },
  { id: "GUI-16", label: "GUI-16", needsMinority: false, extraDropdowns: 1, implemented: true },
  { id: "GUI-17", label: "GUI-17", needsMinority: true, extraDropdowns: 1, implemented: true },
];

const useCaseById = Object.fromEntries(dataDescriptionList.map((item) => [item.id, item]));

function toStateCode(stateName) {
  return stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;
}

function toGroupKey(group) {
  return group?.trim().toLowerCase().replace(/\s+/g, "_");
}

export function displayData(label = <div>this is label</div>, data = <div>this is data</div>, containerClassName = "", widthOfData = null, heightOfData = null) {
  const style = {};
  if (widthOfData) {
    style.width = `${widthOfData}rem`;
  }
  if (heightOfData) {
    style.height = `${heightOfData}rem`;
  }

  return (
    <div className={containerClassName}>
      {label}
      <div style={Object.keys(style).length === 0 ? undefined : style}>
        {data}
      </div>
    </div>
  );
}

function renderPlaceholderCard(title, descriptionLines = []) {
  return (
    <div className="customAnalysis_placeholderCard">
      <div className="customAnalysis_placeholderTitle">{title}</div>
      {descriptionLines.map((line) => (
        <div key={line} className="customAnalysis_placeholderLine">{line}</div>
      ))}
    </div>
  );
}

// function PartyDot({ party }) {
//   const cls =
//     party === "Democrat"
//       ? "congTable_partyDot congTable_partyDot--dem"
//       : party === "Republican"
//         ? "congTable_partyDot congTable_partyDot--rep"
//         : "congTable_partyDot congTable_partyDot--ind";
//   return <span className={cls} title={party} />;
// }

function updateData(currentData, minoritySelection, secondData, thirdData, payloads) {
  switch (currentData) {
    case "GUI-4":
      return displayData(
        <div className="customAnalysis_dataLabel">Heatmap of Minority by Precinct</div>,
        renderPlaceholderCard("Heatmap by Minority", [
          "Demographic heat map by precinct",
          `Selected group: ${minoritySelection}`,
          "Map rendering is not yet connected in custom analysis.",
        ]),
        "customAnalysis_dataContainer"
      );
    case "GUI-8":
      return displayData(
        <div className="customAnalysis_dataLabel">GUI-8</div>,
        renderPlaceholderCard("GUI-8", [
          "District plan comparison",
          "Reserved for enacted versus comparison plan display.",
        ]),
        "customAnalysis_dataContainer"
      );
    case "GUI-12": {
      const payload = payloads.eiSupport;
      if (secondData === DEFAULT_DROPDOWN_VALUE) {
        return displayData(
          <div className="customAnalysis_dataLabel">Ecological Inference by Race/ Ethnicity or Language</div>,
          renderPlaceholderCard("Ecological Inference by Race/ Ethnicity or Language", ["Select Race / Ethnicity or Language to continue."]),
          "customAnalysis_dataContainer"
        );
      }
      if (secondData === "Language") {
        if (thirdData === DEFAULT_DROPDOWN_VALUE) {
          return displayData(
            <div className="customAnalysis_dataLabel">Ecological Inference by Language</div>,
            renderPlaceholderCard("Ecological Inference by Language", ["Select a language to continue."]),
            "customAnalysis_dataContainer"
          );
        }
        return displayData(
          <div className="customAnalysis_dataLabel">Ecological Inference by Language</div>,
          renderPlaceholderCard("Ecological Inference by Language", [
            "Language-based ecological inference support is not yet wired.",
            `Selected language: ${thirdData}`,
          ]),
          "customAnalysis_dataContainer"
        );
      }
      if (minoritySelection === DEFAULT_DROPDOWN_VALUE) {
        return displayData(
          <div className="customAnalysis_dataLabel">Ecological Inference by Race/ Ethnicity or Language</div>,
          renderPlaceholderCard("Ecological Inference by Race/ Ethnicity or Language", ["Select a race / ethnicity group to continue."]),
          "customAnalysis_dataContainer"
        );
      }
      if (!payload || minoritySelection !== payload.selectedGroup) {
        return displayData(
          <div className="customAnalysis_dataLabel">Ecological Inference by Race/ Ethnicity</div>,
          renderPlaceholderCard("Ecological Inference by Race/ Ethnicity", [
            `No backend GUI-12 payload is available for ${minoritySelection}.`,
            payload?.selectedGroup ? `Available race / ethnicity group: ${payload.selectedGroup}` : "No backend payload was returned.",
          ]),
          "customAnalysis_dataContainer"
        );
      }
      return displayData(
        <div className="customAnalysis_dataLabel">Ecological Inference by Race/ Ethnicity</div>,
        <div className="customAnalysis_chartWrapper">
          <div className="customAnalysis_chartTitle">Support for {payload.selectedCandidate}</div>
          <div className="customAnalysis_chartSubtitle">Estimated support distribution by group</div>
          <EiSupportChart payload={payload} showHeader={false} />
        </div>,
        "customAnalysis_dataContainer"
      );
    }
    case "GUI-16": {
      const payload = payloads.ensembleSplits;
      if (!payload) {
        return displayData(
          <div className="customAnalysis_dataLabel">Simulated District Voting Distribution</div>,
          renderPlaceholderCard("GUI-16", ["Ensemble split payload is not available for this state."]),
          "customAnalysis_dataContainer"
        );
      }
      if (secondData === DEFAULT_DROPDOWN_VALUE) {
        return displayData(
          <div className="customAnalysis_dataLabel">Simulated District Voting Distribution</div>,
          renderPlaceholderCard("GUI-16", ["Select Voting Rights Act or Race Blind to continue."]),
          "customAnalysis_dataContainer"
        );
      }
      const isVra = secondData === "Voting Rights Act";
      return displayData(
        <div className="customAnalysis_dataLabel">Simulated District Voting Distribution</div>,
        <div className="customAnalysis_chartWrapper">
          <div className="customAnalysis_chartTitle">{isVra ? "VRA-Constrained Ensemble" : "Race-Blind Ensemble"}</div>
          <SingleEnsembleSplitsChart
            showHeader={false}
            title={isVra ? "VRA-Constrained Ensemble" : "Race-Blind Ensemble"}
            buckets={isVra ? payload.series.vraConstrained : payload.series.raceBlind}
            totalDistricts={payload.totalDistricts}
            ensembleSize={payload.ensembleSize}
          />
        </div>,
        "customAnalysis_dataContainer"
      );
    }
    case "GUI-17": {
      const payloadSet = payloads.boxWhiskers;
      if (!payloadSet) {
        return displayData(
          <div className="customAnalysis_dataLabel">GUI-17</div>,
          renderPlaceholderCard("GUI-17", ["Box-and-whisker payload is not available for this state."]),
          "customAnalysis_dataContainer"
        );
      }
      if (secondData === DEFAULT_DROPDOWN_VALUE) {
        return displayData(
          <div className="customAnalysis_dataLabel">GUI-17</div>,
          renderPlaceholderCard("GUI-17", ["Select an ensemble type to continue."]),
          "customAnalysis_dataContainer"
        );
      }
      if (minoritySelection === DEFAULT_DROPDOWN_VALUE) {
        return displayData(
          <div className="customAnalysis_dataLabel">GUI-17</div>,
          renderPlaceholderCard("GUI-17", ["Select a minority to continue."]),
          "customAnalysis_dataContainer"
        );
      }
      const isVra = secondData === "Voting Rights Act";
      const payload = isVra ? payloadSet.vraConstrained : payloadSet.raceBlind;
      if (!payload || minoritySelection !== payload.selectedGroup) {
        return displayData(
          <div className="customAnalysis_dataLabel">GUI-17</div>,
          renderPlaceholderCard("GUI-17", [
            `No backend GUI-17 payload is available for ${minoritySelection}.`,
            payload?.selectedGroup ? `Available race / ethnicity group: ${payload.selectedGroup}` : "No backend payload was returned.",
          ]),
          "customAnalysis_dataContainer"
        );
      }
      return displayData(
        <div className="customAnalysis_dataLabel">GUI-17</div>,
        <div className="customAnalysis_chartWrapper">
          <div className="customAnalysis_chartTitle">{payload.metricLabel}</div>
          <div className="customAnalysis_chartSubtitle">{isVra ? "VRA-Constrained" : "Race-Blind"} ensemble • {payload.selectedGroup}</div>
          <BoxWhiskerChart payload={payload} showHeader={false} />
        </div>,
        "customAnalysis_dataContainer"
      );
    }
    default:
      return displayData(
        <div className="customAnalysis_dataLabel">Unknown</div>,
        renderPlaceholderCard("Unknown Use Case", ["Selection could not be resolved."]),
        "customAnalysis_dataContainer"
      );
  }
}

function excludeDataFromDropdown(original, comparison1, comparison2) {
  if (original === comparison1 || original === comparison2) {
    return duplicateAllowedUseCases.has(original);
  }
  return true;
}

function isMinorityDropdownDisabled(selection1, selection2, selection3) {
  return ![selection1, selection2, selection3].some((selection) => useCaseById[selection]?.needsMinority);
}

function returnExtraDropdownsWithLabels(dataIndex, dataSelection, secondData, changeSecondData, thirdData, changeThirdData, languageList) {
  switch (dataSelection) {
    case "GUI-12": {
      const languageOptions = [DEFAULT_DROPDOWN_VALUE, ...languageList].map((language) => (
        <option key={`gui12-language-${dataIndex}-${language}`} value={language}>{language}</option>
      ));

      return (
        <span className="customAnalysis_extraCheckboxContainer">
          <div className="customAnalysis_extraCheckboxSubContainer">
            <label htmlFor={`minorityOrLanguage-${dataIndex}`} className="customAnalysis_extraDropdown1_Label">Race / Ethnicity or Language?</label>
            <select
              className="customAnalysis_extraDropdown1"
              name={`minorityOrLanguage-${dataIndex}`}
              id={`minorityOrLanguage-${dataIndex}`}
              value={secondData}
              onChange={(event) => {
                changeSecondData(event.target.value);
                changeThirdData(DEFAULT_DROPDOWN_VALUE);
              }}
            >
              <option value={DEFAULT_DROPDOWN_VALUE}>{DEFAULT_DROPDOWN_VALUE}</option>
              <option value="Race / Ethnicity">Race / Ethnicity</option>
              <option value="Language">Language</option>
            </select>
          </div>
          {secondData === "Language" ? (
            <div className="customAnalysis_extraCheckboxSubContainer">
              <label htmlFor={`languageOptions-${dataIndex}`} className="customAnalysis_extraDropdown1_Label">Language Options</label>
              <select
                name={`languageOptions-${dataIndex}`}
                id={`languageOptions-${dataIndex}`}
                value={thirdData}
                onChange={(event) => changeThirdData(event.target.value)}
                className="customAnalysis_extraDropdown2"
              >
                {languageOptions}
              </select>
            </div>
          ) : null}
        </span>
      );
    }
    case "GUI-16":
    case "GUI-17": {
      const options = [DEFAULT_DROPDOWN_VALUE, "Voting Rights Act", "Race Blind"];
      const label = dataSelection === "GUI-17" ? "Ensemble Type" : "Voting Rights Act or Race Blind?";
      return (
        <span className="customAnalysis_extraCheckboxContainer">
          <div className="customAnalysis_extraCheckboxSubContainer">
            <label htmlFor={`vraOrRaceBlind-${dataIndex}`} className="customAnalysis_extraDropdown1_Label">{label}</label>
            <select
              name={`vraOrRaceBlind-${dataIndex}`}
              id={`vraOrRaceBlind-${dataIndex}`}
              value={secondData}
              onChange={(event) => changeSecondData(event.target.value)}
              className="customAnalysis_extraDropdown1"
            >
              {options.map((value) => (
                <option key={`ensemble-${dataIndex}-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </span>
      );
    }
    default:
      return null;
  }
}

function updateBody(minority, payloads, slots) {
  return (
    <div className="customAnalysis_dataBodyContainer">
      {slots.map((slot) => {
        const dataOptions = dataDescriptionList.map((data) => (
          <option key={`Data-Descriptions-${slot.index}-${data.id}`} value={data.id}>{data.label}</option>
        ));

        return (
          <div key={slot.index} className="customAnalysis_dataWithCheckbox">
            <div className="customAnalysis_dataCheckbox">
              <select
                name={`dataSelector${slot.index}`}
                id={`dataSelector${slot.index}`}
                value={slot.currentData}
                onChange={(event) => {
                  slot.changeData(event.target.value);
                  slot.changeSecondData(DEFAULT_DROPDOWN_VALUE);
                  slot.changeThirdData(DEFAULT_DROPDOWN_VALUE);
                }}
              >
                {dataOptions.filter((option) => excludeDataFromDropdown(option.props.value, slot.otherSelections[0], slot.otherSelections[1]))}
              </select>
              {returnExtraDropdownsWithLabels(
                slot.index,
                slot.currentData,
                slot.secondData,
                slot.changeSecondData,
                slot.thirdData,
                slot.changeThirdData,
                LANGUAGE_OPTIONS,
              )}
            </div>
            {updateData(slot.currentData, minority, slot.secondData, slot.thirdData, payloads)}
          </div>
        );
      })}
    </div>
  );
}

export default function StateCustomAnalysis(props) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);

  const configuredMinorityList = useMemo(() => {
    const stateEntry = props.minorityData.find((entry) => entry.stateName === stateName);
    return stateEntry?.minorityData?.minorityList ?? [];
  }, [props.minorityData, stateName]);

  const [districtTable, setDistrictTable] = useState(null);
  const [ensembleSplits, setEnsembleSplits] = useState(null);
  const [eiSupport, setEiSupport] = useState(null);
  const [boxWhiskers, setBoxWhiskers] = useState(null);
  const [currentMinority, changeMinority] = useState(configuredMinorityList[0] ?? DEFAULT_DROPDOWN_VALUE);
  const [currentData1, changeData1] = useState(dataDescriptionList[0].id);
  const [currentData2, changeData2] = useState(dataDescriptionList[1].id);
  const [currentData3, changeData3] = useState(dataDescriptionList[2].id);
  const [secondData1, changeSecondData1] = useState(DEFAULT_DROPDOWN_VALUE);
  const [secondData2, changeSecondData2] = useState(DEFAULT_DROPDOWN_VALUE);
  const [secondData3, changeSecondData3] = useState(DEFAULT_DROPDOWN_VALUE);
  const [thirdData1, changeThirdData1] = useState(DEFAULT_DROPDOWN_VALUE);
  const [thirdData2, changeThirdData2] = useState(DEFAULT_DROPDOWN_VALUE);
  const [thirdData3, changeThirdData3] = useState(DEFAULT_DROPDOWN_VALUE);

  useEffect(() => {
    let isActive = true;

    if (!stateCode) {
      setDistrictTable(null);
      setEnsembleSplits(null);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/districts/enacted/table`, {
          params: { election: "2024_pres" },
        });
        if (isActive) {
          setDistrictTable(response.data);
        }
      } catch {
        if (isActive) {
          setDistrictTable(null);
        }
      }
    })();

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/ensembles/splits`, {
          params: {
            ensembleSize: "final",
            election: "2024_pres",
          },
        });
        if (isActive) {
          setEnsembleSplits(response.data);
        }
      } catch {
        if (isActive) {
          setEnsembleSplits(null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [stateCode]);

  useEffect(() => {
    let isActive = true;
    const group = toGroupKey(currentMinority);

    if (!stateCode || !group || currentMinority === DEFAULT_DROPDOWN_VALUE) {
      setEiSupport(null);
      setBoxWhiskers(null);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/analysis/ei-support`, {
          params: {
            groups: group,
            election: "2024_pres",
            party: "DEM",
          },
        });
        if (isActive) {
          setEiSupport(response.data);
        }
      } catch {
        if (isActive) {
          setEiSupport(null);
        }
      }
    })();

    (async () => {
      try {
        const [vraConstrained, raceBlind] = await Promise.all([
          axios.get(`/api/states/${stateCode}/ensembles/box-whisker`, {
            params: { group, ensembleType: "vra_constrained", metric: "minority_share" },
          }),
          axios.get(`/api/states/${stateCode}/ensembles/box-whisker`, {
            params: { group, ensembleType: "race_blind", metric: "minority_share" },
          }),
        ]);
        if (isActive) {
          setBoxWhiskers({
            vraConstrained: vraConstrained.data,
            raceBlind: raceBlind.data,
          });
        }
      } catch {
        if (isActive) {
          setBoxWhiskers(null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currentMinority, stateCode]);

  const minorityList = useMemo(() => {
    const list = new Set(configuredMinorityList);
    if (eiSupport?.selectedGroup) list.add(eiSupport.selectedGroup);
    if (boxWhiskers?.vraConstrained?.selectedGroup) list.add(boxWhiskers.vraConstrained.selectedGroup);
    if (boxWhiskers?.raceBlind?.selectedGroup) list.add(boxWhiskers.raceBlind.selectedGroup);
    return list.size > 0 ? [...list] : [DEFAULT_DROPDOWN_VALUE];
  }, [boxWhiskers, configuredMinorityList, eiSupport]);

  useEffect(() => {
    if (!minorityList.includes(currentMinority)) {
      changeMinority(minorityList[0]);
    }
  }, [currentMinority, minorityList]);

  const payloads = {
    districtTable,
    ensembleSplits,
    eiSupport,
    boxWhiskers,
  };

  const slots = [
    {
      index: 1,
      currentData: currentData1,
      secondData: secondData1,
      thirdData: thirdData1,
      changeData: changeData1,
      changeSecondData: changeSecondData1,
      changeThirdData: changeThirdData1,
      otherSelections: [currentData2, currentData3],
    },
    {
      index: 2,
      currentData: currentData2,
      secondData: secondData2,
      thirdData: thirdData2,
      changeData: changeData2,
      changeSecondData: changeSecondData2,
      changeThirdData: changeThirdData2,
      otherSelections: [currentData1, currentData3],
    },
    {
      index: 3,
      currentData: currentData3,
      secondData: secondData3,
      thirdData: thirdData3,
      changeData: changeData3,
      changeSecondData: changeSecondData3,
      changeThirdData: changeThirdData3,
      otherSelections: [currentData1, currentData2],
    },
  ];

  return (
    <div className="customAnalysis_bodyContainer">
      <div className="customAnalysis_minorityCheckboxContainer">
        <label htmlFor="minoritySelector">Choose the Minority to analyze <span style={{ color: "gray", fontStyle: "italic" }}>(if applicable)</span>: </label>
        <select
          name="minoritySelector"
          id="minoritySelector"
          disabled={isMinorityDropdownDisabled(currentData1, currentData2, currentData3)}
          value={currentMinority}
          onChange={(event) => changeMinority(event.target.value)}
        >
          {minorityList.map((minority) => (
            <option key={`Minority-Options-${minority}`} value={minority}>{minority}</option>
          ))}
        </select>
      </div>
      {updateBody(currentMinority, payloads, slots)}
    </div>
  );
}
