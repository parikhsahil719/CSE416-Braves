import React from 'react'
import "../../styles/sidebar.css";
import { useNavigate, useParams } from 'react-router-dom';
import menuIcon from '/menu.svg';

export function SideBar(props) {
  const { currPage, switchPage, currMap, switchMap, precinctMapSelectable, currPolarization: currPolarization, switchPolarization, currSimData, switchSimData } = props; // (maybe add showMaps boolean)
  const navigate = useNavigate();
  const { stateName } = useParams();

  return (
    <span className="sidebar-wrapper">
      <img id="sidebar-icon" src={menuIcon} width="24px" />
      <nav className="sidebar">
        <span className="sidebar-maps-container">
          <div className="sidebar-header">Maps</div>
          <div className={currMap === "District Map" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => switchMap('District Map')}>District Map</div>
          {precinctMapSelectable ?
            <>
              <div className={currMap === "Precinct Heat Map" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => switchMap('Precinct Heat Map')}>Precinct Heat Map</div>
            </>
            : null}
        </span>
        <span className="sidebar-analysis-container">
          <div className="sidebar-header">Analysis</div>
          <div className={currPage === "State" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('State'); navigate(`/state/${stateName}`) }}>State Data Summary</div>
          <div className={currPage === "Compare" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchMap('District Map'); switchPage('Compare'); navigate(`/state/${stateName}/Compare`) }}>Interesting District Plans</div>
          <div className={currPage === "Polarization" ? "sidebar-subheader activeTab" : "sidebar-subheader"}>Racial Polarization</div>
          <div className={currPolarization === "Gingles" ? "polarization-option activeTab" : "polarization-option"} onClick={() => { switchPolarization('Gingles'); switchPage('Polarization'); navigate(`/state/${stateName}/Gingles`) }}>Gingles</div>
          <div className={currPolarization === "EI Analysis" ? "polarization-option activeTab" : "polarization-option"} onClick={() => { switchPolarization('EI Analysis'); switchPage('Polarization'); navigate(`/state/${stateName}/Ecological Inference`) }}>EI Analysis</div>
          <div className={currPolarization === "EI Bar Chart" ? "polarization-option activeTab" : "polarization-option"} onClick={() => { switchPolarization('EI Bar Chart'); switchPage('Polarization'); navigate(`/state/${stateName}/Ecological Inference`) }}>EI Bar Chart</div>
          <div className={currPolarization === "Polarization KDE" ? "polarization-option activeTab" : "polarization-option"} onClick={() => { switchPolarization('Polarization KDE'); switchPage('Polarization'); navigate(`/state/${stateName}/Ecological Inference`) }}>EI KDE</div>
          <div className={currPage === "Simulation Data" ? "sidebar-subheader activeTab" : "sidebar-subheader"}>VRA Impact</div>
          <div className={currSimData === "Ensemble Splits" ? "sim-option activeTab" : "sim-option"} onClick={() => { switchSimData('Ensemble Splits'); switchPage('Simulation Data'); navigate(`/state/${stateName}/Simulation Data`) }}>Ensemble Splits</div>
          <div className={currSimData === "Box Whisker" ? "sim-option activeTab" : "sim-option"} onClick={() => { switchSimData('Box Whisker'); switchPage('Simulation Data'); navigate(`/state/${stateName}/Simulation Data`) }}>Box & Whisker</div>
          <div className={currSimData === "Minority Effectiveness Box Whisker" ? "sim-option activeTab" : "sim-option"} onClick={() => { switchSimData('Minority Effectiveness Box Whisker'); switchPage('Simulation Data'); navigate(`/state/${stateName}/Simulation Data`) }}>Minority Effectiveness Box & Whisker</div>
          <div className={currSimData === "Minority Effectiveness Histogram" ? "sim-option activeTab" : "sim-option"} onClick={() => { switchSimData('Minority Effectiveness Histogram'); switchPage('Simulation Data'); navigate(`/state/${stateName}/Simulation Data`) }}>Minority Effectiveness Histogram</div>
          {/* <div className={currPage === "Voting Rights Analysis" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Voting Rights Analysis'); navigate(`/state/${stateName}/Voting Rights Analysis`)}}>(Old) Voting Rights Analysis</div> */}
          {/* <div className={currPage === "Minority" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Minority'); navigate(`/state/${stateName}/Minority Analysis`)}}>(Old) Minority Analysis</div> */}
          {/* <div className={currPage === "Custom" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Custom'); navigate(`/state/${stateName}/Custom State Analysis`)}}>(Old) Custom Analysis</div> */}
          {/* <div className={currPage === "Simulation" ? "sidebar-tab activeTab" : "sidebar-tab"} onClick={() => { switchPage('Simulation'); navigate(`/state/${stateName}/Simulation Minority Data`)}}>(Old) Simulation Data</div> */}
        </span>
      </nav>
    </span>)
    ;
}
