import React, { useState, useEffect } from 'react'
import SplashPage from './components/SplashPage'
import StatePage from './components/StatePage'
import { CountryHeaderBar } from './components/CountryHeaderBar'
import '../styles/main.css'
import { Routes, Route, useParams } from 'react-router-dom'
import { StateHeaderBar } from './components/StateHeaderBar'
import MinorityAnalysis from './components/MinorityAnalysis'
import CrossStateAnalysis from './components/CrossStateAnalysis'
import VRAAnalysis from './components/VRAAnalysis'
/**
 * Based on the current view (state variable), switch to it. Basically large switch statement
 */
export default function App() {

  const [currPage, switchPage] = useState('Country');

  return (
    <>
    <Routes>
      <Route path='/' element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <SplashPage currPage={currPage} switchPage={switchPage}/>
        </>
      } />
      <Route path='/Cross State Analysis' element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage}  siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <CrossStateAnalysis currPage={currPage} switchPage={switchPage}/>
        </>
      } />
      <Route path={`/state/:stateName`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={['Voting Rights Analysis', 'Minority Analysis', 'Custom State Analysis']} />
          <StatePage currPage={currPage} switchPage={switchPage}/>
        </>
      } />
      <Route path={`/state/:stateName/Voting Rights Analysis`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={['Voting Rights Analysis', 'Minority Analysis', 'Custom State Analysis']} />
          <VRAAnalysis currPage={currPage} switchPage={switchPage} />
        </>
      }
      />
      <Route path={`/state/:stateName/Minority Analysis`} element={
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={['Voting Rights Analysis', 'Minority Analysis', 'Custom State Analysis']} />
          <MinorityAnalysis currPage={currPage} switchPage={switchPage} />
        </>
      }
      />
    </Routes>
    </>
  )
}
