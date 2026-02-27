import React from 'react'
import {CountryHeaderBar} from './CountryHeaderBar.jsx'

// ─────────────────────────────────────────────
// SplashPage
// ─────────────────────────────────────────────
function PlaceHolderMap()
{
  return <div> Map Place Holder </div>
}
export const SplashPage = () => (
  <div className="splashPage">
    <CountryHeaderBar siteName="VRA Repeal Analysis" tabs={['Cross State Analysis', 'Another One']} />
    <div className="splashPage_body">
      {/* <h1 className="splashPage__title">Voting Rights Act Repeal Analysis</h1> */}
      <PlaceHolderMap />
    </div>
  </div>
);
