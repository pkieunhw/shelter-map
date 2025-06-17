import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapContainer from './components/MapContainer';
import ShelterDetail from "./ShelterDetail";
import "./index.css";  // ✅ 이 줄이 반드시 있어야 해요


function App() {
  return (
    <Router>
      <div className="App" style={{ height: "100%" }}>
        <h2>🐕 우리 동네 보호소 찾기</h2>
        <Routes>
          <Route path="/" element={<MapContainer />} />
          <Route path="/shelter-detail/:id" element={<ShelterDetail />} />



        </Routes>
      </div>
    </Router>
  );
}


export default App;

