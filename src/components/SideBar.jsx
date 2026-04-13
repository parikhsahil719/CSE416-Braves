import React from 'react'
import "../../styles/sidebar.css";
import { useNavigate, useParams } from 'react-router-dom';
import menuIcon from '/menu.svg';

export function SideBar(props)
{
  const {currPage, switchPage, currMap, switchMap, precinctMapSelectable, currMinority, switchMinority, currEI, switchEI } = props; // (maybe add showMaps boolean)
  const navigate = useNavigate();
  const { stateName } = useParams();
  const OregonGroups = ["Latino", "Asian"];
  const SCGroups = ["Black", "Latino"];
  const minorityOptions = stateName === "Oregon" ?
    OregonGroups.map((minority) =>
    <div
      key={minority}
      value={minority}
      className={currMinority === minority ? "minority-option activeTab" : "minority-option"}
      onClick={() => {switchMap('Precinct Heat Map'); switchMinority(minority)}}>
      - {minority}
    </div>)
  : SCGroups.map((minority) =>
    <div
      key={minority}
      value={minority}
      className={currMinority === minority ? "minority-option activeTab" : "minority-option"}
      onClick={() => {switchMap('Precinct Heat Map'); switchMinority(minority)}}>
      - {minority}
    </div>);

  return (
    <span className="sidebar-wrapper">
      <img id="sidebar-icon" src={menuIcon} width="24px" />
      <nav className="sidebar">
        <span className="sidebar-maps-container">
          <div className="sidebar-header">Maps</div>
          <div className={currMap === "District Map" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => switchMap('District Map')}>District Map</div>
          {precinctMapSelectable ?
            <>
              <div className={currMap === "Precinct Heat Map" ? "sidebar-subheader activeTab" : "sidebar-subheader"}>Precinct Heat Maps</div>
              {minorityOptions}
            </>
          : null}
        </span>
        <span className="sidebar-analysis-container">
          <div className="sidebar-header">Analysis</div>
          <div className={currPage === "State" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('State'); navigate(`/state/${stateName}`)}}>State Data Summary</div>
          <div className={currPage === "Compare" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchMap('District Map'); switchPage('Compare'); navigate(`/state/${stateName}/Compare`)}}>Compare District Plans</div>
          <div className={currPage === "Gingles" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Gingles'); navigate(`/Cross State Analysis`)}}>Gingles Charts</div>
          <div className={currPage === "EI" ? "sidebar-subheader activeTab" : "sidebar-subheader"}>Ecological Inferences</div>
          <div className={currEI === "EI Analysis" ? "ei-option activeTab" : "ei-option"} onClick={() => { switchEI('EI Analysis'); switchPage('EI'); navigate(`/state/${stateName}/Ecological Inference`)}}>EI Analysis</div>
          <div className={currEI === "EI Bar Chart" ? "ei-option activeTab" : "ei-option"} onClick={() => { switchEI('EI Bar Chart'); switchPage('EI'); navigate(`/state/${stateName}/Ecological Inference`)}}>EI Bar Chart</div>
          <div className={currEI === "EI KDE" ? "ei-option activeTab" : "ei-option"} onClick={() => { switchEI('EI KDE'); switchPage('EI'); navigate(`/state/${stateName}/Ecological Inference`)}}>EI KDE</div>
          {/* <div className={currPage === "Simulation" ? "sidebar-subheader activeTab" : "sidebar-subheader"}>Simulation Data</div> */}
          <div className={currPage === "Voting Rights Analysis" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Voting Rights Analysis'); navigate(`/state/${stateName}/Voting Rights Analysis`)}}>(Old) Voting Rights Analysis</div>
          <div className={currPage === "Minority" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Minority'); navigate(`/state/${stateName}/Minority Analysis`)}}>(Old) Minority Analysis</div>
          <div className={currPage === "Custom" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Custom'); navigate(`/state/${stateName}/Custom State Analysis`)}}>(Old) Custom Analysis</div>
          <div className={currPage === "Simulation" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Simulation'); navigate(`/state/${stateName}/Simulation Minority Data`)}}>(Old) Simulation Data</div>
        </span>
      </nav>
    </span>)
;}
