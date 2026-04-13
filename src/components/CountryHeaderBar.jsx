import React from 'react'
import "../../styles/country-header.css";
import { useNavigate, useParams } from 'react-router-dom';


// Props: currPage, switchPage, siteName {VRA Repeal Analysis}
export function CountryHeaderBar(props)
{
  const siteName= props.siteName
  const navigate = useNavigate();
  const switchPage = props.switchPage;
  const { stateName } = useParams();

  // Highlight the site name if on splash page
  let classNameSite = ""
  if (props.currPage === 'Country') {
    classNameSite = "headerBarCountry_siteName chosenPage";
  }
  else {
    classNameSite = "headerBarCountry_siteName";
  }

  return (
  <nav className="headerBarCountry">
    <span className={classNameSite} onClick={()=>{switchPage('Country'); navigate('/');}}>{siteName}</span>
    {stateName && <span className="headerBarCountry_stateName chosenPage">{stateName}</span>}
  </nav>)
;}
