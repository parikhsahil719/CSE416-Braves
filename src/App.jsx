import React, { useState, useEffect } from 'react'
import SplashPage from './components/SplashPage'
import StatePage from './components/StatePage'
import { CountryHeaderBar } from './components/CountryHeaderBar'
import '../styles/main.css'
import { Routes, Route, useParams } from 'react-router-dom'
import { StateHeaderBar } from './components/StateHeaderBar'
import StateMinorityAnalysis from './components/StateMinorityAnalysis'
import StateCustomAnalysis from './components/StateCustomAnalysis'
import StateSimulationMinorityData from './components/StateSimulationMinorityData'
import CrossStateAnalysis from './components/CrossStateAnalysis'
import VRAAnalysis from './components/VRAAnalysis'
/**
 * Based on the current view (state variable), switch to it. Basically large switch statement
 */
export default function App() {

  // State variable for switching between views
  const [currPage, switchPage] = useState('Country');
  // Store relevant data that will ALMOST ALWAYS be used here, others can be pulled on demand
  // Minority data
  const minorityData = [
    {stateName: 'Oregon',
     minorityData: {minorityList: ['Latino', 'Asian', 'Black']}},
    {stateName: 'South Carolina',
    minorityData: {minorityList: ['Black', 'Latino']}}]
  // Probably not ensemble data
  const stateTabs = ['Voting Rights Analysis', 'Minority Analysis', 'Custom State Analysis', 'Simulation Minority Data'];

  return (
    <>
    <Routes>
      <Route path='/' element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <SplashPage currPage={currPage} switchPage={switchPage}/>
        </>
      } />
      <Route path='/Cross State Analysis' element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage}  siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <CrossStateAnalysis currPage={currPage} switchPage={switchPage} minorityData={minorityData}/>
        </>
      } />
      <Route path={`/state/:stateName`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} />
          <StatePage currPage={currPage} switchPage={switchPage}/>
        </>
      } />
      <Route path={`/state/:stateName/Voting Rights Analysis`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} />
          <VRAAnalysis currPage={currPage} switchPage={switchPage} />
        </>
      }
      />
      <Route path={`/state/:stateName/Minority Analysis`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} />
          <StateMinorityAnalysis currPage={currPage} minorityData={minorityData} switchPage={switchPage} />
        </>
      }
      />
      <Route path={`/state/:stateName/Custom State Analysis`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} />
          <StateCustomAnalysis currPage={currPage} minorityData={minorityData} switchPage={switchPage} />
        </>
      }
      />
      <Route path={`/state/:stateName/Simulation Minority Data`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} />
          <StateSimulationMinorityData currPage={currPage} minorityData={minorityData} switchPage={switchPage} />
        </>
      }
      />
    </Routes>
    </>
  )
}
