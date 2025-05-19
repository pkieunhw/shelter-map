// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapContainer from "./MapContainer";
import ShelterDetail from "./ShelterDetail"; // 상세 페이지 컴포넌트

function App() {
  return (
    <Router>
      <div className="App">
        {/* 상단 공통 헤더 */}
        <h2 className="text-2xl font-bold p-4 bg-blue-100 text-center">
          📍 우리 동네 보호소 찾기
        </h2>

        {/* 라우트 정의 */}
        <Routes>
          <Route path="/" element={<MapContainer />} />
          <Route path="/shelter/:name" element={<ShelterDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
