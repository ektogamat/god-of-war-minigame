import './style.css'
import ReactDOM from 'react-dom/client'
import MainCanvas from './MainCanvas'
import Overlay from './Overlay'
import { Leva } from 'leva'
import LoadingScreen from './Components/LoadingScreen/LoadingScreen'
import IntroScreen from './Components/IntroScreen/IntroScreen'
import HowToScreen from './Components/HowToScreen/HowToScreen'
import VictoryScreen from './Components/VictoryScreen/VictoryScreen'
import FailScreen from './Components/FailScreen/FailScreen'
import MusicControls from './Components/MusicControls/MusicControls'
import HelpScreen from './Components/HelpScreen/HelpScreen'
import ThemeSync from './Components/ThemeSync/ThemeSync'
import KonamiCode from './Components/KonamiCode/KonamiCode'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
  <div id='container' className='theme-ember'>
    <ThemeSync />
    <KonamiCode />
    <MainCanvas />
    <Overlay />
    <LoadingScreen />
    <IntroScreen />
    <HowToScreen />
    <VictoryScreen />
    <FailScreen />
    <MusicControls />
    <HelpScreen />
    <Leva hidden />
  </div>
)
