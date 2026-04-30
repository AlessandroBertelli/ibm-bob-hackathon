import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HostSetup from './components/HostSetup';
import MenuReview from './components/MenuReview';
import GuestVoting from './components/GuestVoting';
import WinnerScreen from './components/WinnerScreen';
import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route path="/" element={<HostSetup />} />
                    <Route path="/party/:partyId" element={<MenuReview />} />
                    <Route path="/vote/:partyId" element={<GuestVoting />} />
                    <Route path="/winner/:partyId" element={<WinnerScreen />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
