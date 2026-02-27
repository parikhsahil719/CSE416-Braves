import React from 'react'
import { SplashPage } from './components/SplashPage'
import '../styles/main.css'

/**
 * Based on the current view (state variable), switch to it. Basically large switch statement
 */
function view()
{
  let view = 'Splash'
  switch (view) 
  {
    case 'Splash':
      {

        break;
      }
      
  
    default:
      break;
  }
}
export default function App() {
  return (
    <div className="app-root">
      {/* <header className="app-header">Figma React Prototypes</header> */}
      <SplashPage />
    </div>
  )
}
