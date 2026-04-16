import React, { Suspense, lazy, useState } from 'react'
import SplashPage from './components/SplashPage'
import StatePage from './components/StatePage'
import { CountryHeaderBar } from './components/CountryHeaderBar'
import { SideBar } from './components/SideBar'
import '../styles/main.css'
import { Routes, Route, useParams } from 'react-router-dom'

const StateMinorityAnalysis = lazy(() => import('./components/StateMinorityAnalysis'))
const StateCustomAnalysis = lazy(() => import('./components/StateCustomAnalysis'))
const StateSimulationMinorityData = lazy(() => import('./components/StateSimulationMinorityData'))
const CrossStateAnalysis = lazy(() => import('./components/Gingles'))
const VRAAnalysis = lazy(() => import('./components/VRAAnalysis'))
const Compare = lazy(() => import('./components/Compare'))
const EI = lazy(() => import('./components/EI'))
const Simulation = lazy(() => import('./components/Simulation'))

export default function App() {

  // State variable for switching between views
  const [currPage, switchPage] = useState('Country');
  // State variable for switching maps
  const [currMap, switchMap] = useState('District Map');
  // State variable for switching minority group
  const [currMinority, switchMinority] = useState('Latino');
  // State variable for switching EI chart
  const [currEI, switchEI] = useState('');
  // State variable for switching simulation data
  const [currSimData, switchSimData] = useState('');
  // Store relevant data that will ALMOST ALWAYS be used here, others can be pulled on demand
  // Minority data
  const minorityData = [
    {
      stateName: 'Oregon',
      minorityData: { minorityList: ['Latino', 'Asian', 'Black'] }
    },
    {
      stateName: 'South Carolina',
      minorityData: { minorityList: ['Black', 'Latino'] }
    }]
  // Probably not ensemble data
  // const stateTabs = ['Voting Rights Analysis', 'Minority Analysis',  'Simulation Minority Data', 'Custom State Analysis',];
  const lazyFallback = <div style={{ minHeight: "1rem" }} />;

  return (
    <>
      <Routes>
        <Route path='/' element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' />
            <SplashPage currPage={currPage} switchPage={switchPage} />
          </>
        } />
        <Route path='/state/:stateName/Gingles' element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' />
            <SideBar currPage={currPage} switchPage={switchPage} currMap={currMap} switchMap={switchMap} precinctMapSelectable={true} currEI={currEI} switchEI={switchEI} currSimData={currSimData} switchSimData={switchSimData} />
            <span className="main-container">
              <Suspense fallback={lazyFallback}>
                <CrossStateAnalysis currPage={currPage} switchPage={switchPage} minorityData={minorityData} />
              </Suspense>
            </span>
          </>
        } />
        <Route path={`/state/:stateName`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' />
            <SideBar currPage={currPage} switchPage={switchPage} currMap={currMap} switchMap={switchMap} precinctMapSelectable={true} currEI={currEI} switchEI={switchEI} currSimData={currSimData} switchSimData={switchSimData} />
            <span className="main-container">
              <StatePage currMap={currMap} currMinority={currMinority} switchMinority={switchMinority} />
            </span>
          </>
        } />
        <Route path={`/state/:stateName/Voting Rights Analysis`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']} />
            {/* <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} /> */}
            <Suspense fallback={lazyFallback}>
              <VRAAnalysis currPage={currPage} switchPage={switchPage} />
            </Suspense>
          </>
        }
        />
        <Route path={`/state/:stateName/Minority Analysis`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']} />
            {/* <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} /> */}
            <Suspense fallback={lazyFallback}>
              <StateMinorityAnalysis currPage={currPage} minorityData={minorityData} switchPage={switchPage} />
            </Suspense>
          </>
        }
        />
        <Route path={`/state/:stateName/Custom State Analysis`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']} />
            {/* <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} /> */}
            <Suspense fallback={lazyFallback}>
              <StateCustomAnalysis currPage={currPage} minorityData={minorityData} switchPage={switchPage} />
            </Suspense>
          </>
        }
        />
        <Route path={`/state/:stateName/Simulation Minority Data`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis']} />
            {/* <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={stateTabs} /> */}
            <Suspense fallback={lazyFallback}>
              <StateSimulationMinorityData currPage={currPage} minorityData={minorityData} switchPage={switchPage} />
            </Suspense>
          </>
        }
        />
        <Route path={`/state/:stateName/Compare`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' />
            <SideBar currPage={currPage} switchPage={switchPage} currMap={currMap} switchMap={switchMap} precinctMapSelectable={false} currEI={currEI} switchEI={switchEI} currSimData={currSimData} switchSimData={switchSimData} />
            <span className="main-container">
              <Compare />
            </span>
          </>
        } />
        <Route path={`/state/:stateName/Ecological Inference`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' />
            <SideBar currPage={currPage} switchPage={switchPage} currMap={currMap} switchMap={switchMap} precinctMapSelectable={true} currMinority={currMinority} switchMinority={switchMinority} currEI={currEI} switchEI={switchEI} currSimData={currSimData} switchSimData={switchSimData} />
            <span className="main-container">
              <EI currMap={currMap} currMinority={currMinority} switchMinority={switchMinority} currEI={currEI} switchEI={switchEI} />
            </span>
          </>
        } />
        <Route path={`/state/:stateName/Simulation Data`} element={
          <>
            <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' />
            <SideBar currPage={currPage} switchPage={switchPage} currMap={currMap} switchMap={switchMap} precinctMapSelectable={true} currMinority={currMinority} switchMinority={switchMinority} currEI={currEI} switchEI={switchEI} currSimData={currSimData} switchSimData={switchSimData} />
            <span className="main-container">
              <Simulation currMap={currMap} currMinority={currMinority} switchMinority={switchMinority} currSimData={currSimData} switchSimData={switchSimData} />
            </span>
          </>
        } />
      </Routes>
    </>
  )
}
