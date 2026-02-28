import React from 'react'
import "../../styles/country-header.css";
import { useNavigate } from 'react-router-dom';


// Props: siteName(1) {VRA Repeal Analysis}, tabs(many) (likely will not change given our format)
export function CountryHeaderBar(props)
{
  const siteName= props.siteName
  const navigate = useNavigate();
  const switchPage = props.switchPage;

  // Highlight the current page if chosen
  let classNameSite = props.currPage=== 'Country' ? "headerBarCountry_siteName chosenPage" : "headerBarCountry_siteName";

  let tabArr = []
  if(props.hasOwnProperty('tabs'))
  {
    // Make each tab formatted as to tabs
    for(let i = 0; i< props.tabs.length; i++)
    {
      const tabName= props.tabs[i];
      // Highlight the current page if chosen
      let classNameTab = props.currPage=== tabName ? "headerBarCountry_tab chosenPage" : "headerBarCountry_tab";
      tabArr.push(<span key={i} className={classNameTab}>{tabName}</span>)
    }
  }
  return (
  <nav className="headerBarCountry">
    <span className={classNameSite} onClick={()=>{switchPage('Country'); navigate('/');}}>{siteName}</span>
    {tabArr}
  </nav>)
;}
