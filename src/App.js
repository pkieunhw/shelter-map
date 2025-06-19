// [src/App.js]
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import MapContainer from "./components/MapContainer";
import ShelterDetail from "./components/ShelterDetail";
import "./App.css";

// ⭐️ location을 사용하려면, 별도 컴포넌트에서 useLocation() 호출 필요!
function AppLayout() {
  const location = useLocation();
  // 상세페이지는 "/shelter-detail/..."로 시작하므로, 이때만 헤더 숨김
  const showHeader = !location.pathname.startsWith("/shelter-detail");

  return (
    <div className="App">
      {showHeader && <h2>🐕 우리 동네 보호소 찾기</h2>}
      <Routes>
        <Route path="/" element={<MapContainer />} />
        <Route path="/shelter-detail/:id" element={<ShelterDetail />} />
      </Routes>
    </div>
  );
}

// ⭐️ Router는 App.js에서만! 내부에서 AppLayout 분리!
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
