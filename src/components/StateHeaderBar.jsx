import React from "react";
import '../../styles/state-header.css'
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/**
 * Props:
 * stateName(1, change) 
 * tabs: Voting Rights Analysis:str, Minority Analysis:str, Custom State Analysis:str (may change with use cases, but is likely to remain constant across page views (perhaps just store here))
 *  Path params:
 * {stateName:str}
 * */ 
export function StateHeaderBar(props)
{
  const stateName= useParams().stateName;
  const navigate = useNavigate();
  const switchPage = props.switchPage;
  // Highlight the current page if chosen
  let classNameState = props.currPage=== 'State' ? "headerBarState_stateName chosenPage" : "headerBarState_stateName";

  let tabArr = []
  if(props.hasOwnProperty('tabs'))
  {
    // Make each tab formatted as to tabs
    for(let i = 0; i< props.tabs.length; i++)
    {
      const tabName= props.tabs[i];
      let classNameTab = props.currPage=== tabName ? "headerBarState_tab chosenPage" : "headerBarState_tab";
      tabArr.push(<span key={i} className={classNameTab} onClick={()=> { switchPage(`${tabName}`); navigate(`/state/${stateName}/${tabName}`)}}>{tabName}</span>)
    }
  }
  return (
  <nav className="headerBarState">
                                    {/* May want to add a "if on state page, don't do this, will test to find if needed"  */}
    <span className={classNameState} onClick={()=>{ switchPage('State'); navigate(`/state/${stateName}`)}}>{stateName}</span>
    {tabArr.length == 0 ? null : tabArr}
  </nav>)
;}