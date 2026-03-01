import React, { useState, useEffect } from 'react'
import SplashPage from './components/SplashPage'
import StatePage from './components/StatePage'
import { CountryHeaderBar } from './components/CountryHeaderBar'
import '../styles/main.css'
import { Routes, Route, useParams } from 'react-router-dom'
import { StateHeaderBar } from './components/StateHeaderBar'
import MinorityAnalysis from './components/MinorityAnalysis'
/**
 * Based on the current view (state variable), switch to it. Basically large switch statement
 */
// function view()
// {
//   let view = 'Splash'
//   let returnedView = []
//   let countryPage = false;
//   let statePage = false;
//   let keyIndex = 0 // Since rendering arr directly in React execution, need a key for each element
//   // Will add items FIFO, render directly in main
//   switch (view)
//   {
//     case 'Splash':
//       {
//         returnedView.push(<SplashPage key={keyIndex} />)
//         keyIndex++;
//         // Should mark view in some state variable and send to splash page
//         countryPage = true;
//         break;
//       }
//     default:
//       break;
//   }
//   if(statePage)
//   {
//     // Add state header... sigh, simulating FIFO with FILO. I think these are just shallow pointers so its fine
//     // Will only do "rearranging" 0-4 times / re-render (when adding new, common elements i.e. headers)
//     let temp = returnedView;
//     returnedView = [<div key={keyIndex}></div>];
//     keyIndex++;

//     returnedView.push(...temp)
//     // returnedView.push(<div></div>);
//   }
//   if(countryPage)
//   {
//     // Add country header
//     let temp = returnedView;
//     returnedView = [<CountryHeaderBar key={keyIndex} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'tab2']}/>];
//     keyIndex++;

//     returnedView.push(...temp)
//     // returnedView.push()
//   }
//   // returnedView will contain the highest(heightwise) elements first, lowest element last
//   return returnedView;
// }
export default function App() {

  const [currPage, switchPage] = useState('Country');

  return (
    <>
    <Routes>
      <Route path='/' element={ //useState: Country
        <>
          <CountryHeaderBar currPage={currPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <SplashPage switchPage={switchPage}/>
        </>
      } />
      <Route path={`/state/:stateName`} element={ //useState: State
        <>
          <CountryHeaderBar currPage={currPage} switchPage={switchPage} siteName='VRA Repeal Analysis' tabs={['Cross State Analysis', 'Tab2']}/>
          <StateHeaderBar currPage={currPage} switchPage={switchPage} tabs={['Voting Rights Analysis', 'Minority Analysis', 'Custom State Analysis']} />
          <StatePage switchPage={switchPage}/>
        </>
      } />
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
