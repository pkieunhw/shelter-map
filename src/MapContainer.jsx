// 🔍 검색창에 돋보기 아이콘 추가 + 검색창 폭 고정 + 정렬/지역/내위치 버튼 유지
import React, { useState, useEffect } from "react";


function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function MapContainer() {
  const [shelters, setShelters] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // 내 위치 상태
  const [userOverlay, setUserOverlay] = useState(null);   // 반짝이 오버레이 상태
  const [mapRef, setMapRef] = useState(null);
  const [polyline, setPolyline] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [closestName, setClosestName] = useState("");
  const [selectedShelter, setSelectedShelter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("거리순");
  const [regionOption, setRegionOption] = useState("전체");
  const itemsPerPage = 7;
  const markerMap = {};
  const infoMap = {};

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false";
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 10,
        });
        setMapRef(map);

        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const userPos = new window.kakao.maps.LatLng(lat, lng);
          setUserLocation(userPos);
          new window.kakao.maps.Marker({ map, position: userPos });

              // 🔽 여기 ↓ 추가
              const pulse = document.createElement("div");
              pulse.className = "pulse-marker";
              const overlay = new kakao.maps.CustomOverlay({
                content: pulse,
                position: userPos,
                xAnchor: 0.5,
                yAnchor: 0.5,
              });
              overlay.setMap(map);
            

          fetch("/shelters.json")
            .then((res) => res.json())
            .then((data) => {
              const withDistance = data.map((shelter) => ({
                ...shelter,
                distance: getDistance(lat, lng, shelter.lat, shelter.lng),
              }));
              setShelters(withDistance);
              setFiltered(withDistance);
              setClosestName(withDistance[0]?.name || "");

              withDistance.forEach((shelter) => {
                const marker = new window.kakao.maps.Marker({
                  map,
                  position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                  image: new window.kakao.maps.MarkerImage(
                    shelter.name === withDistance[0].name ? "/dog-icon1.png" : "/dog-icon.png",
                    new window.kakao.maps.Size(40, 40),
                    { offset: new window.kakao.maps.Point(20, 40) }
                  ),
                });
                markerMap[shelter.name] = marker;

                const iw = new window.kakao.maps.InfoWindow();
                const content = document.createElement("div");
                content.style.cssText = "padding:10px;font-size:14px;max-width:300px;line-height:1.6;";
                content.innerHTML = `
                  <strong>${shelter.name}</strong><br/>
                  ${shelter.addr}<br/>
                  ${shelter.tel}<br/>
                  <img src="${shelter.img}" width="100" style="margin-top:8px;" /><br/>
                  <a href="https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.lat},${shelter.lng}" target="_blank" style="color:blue;">📍 길찾기</a>`;
                iw.setContent(content);
                infoMap[shelter.name] = iw;

                window.kakao.maps.event.addListener(marker, "click", () => {
                  if (infoWindow) infoWindow.close();
                  if (polyline) polyline.setMap(null);

                  iw.open(map, marker);
                  setInfoWindow(iw);
                  setSelectedShelter(shelter.name);

                  if (shelter.name === closestName && userLocation) {
                    const line = new window.kakao.maps.Polyline({
                      path: [userLocation, marker.getPosition()],
                      strokeWeight: 4,
                      strokeColor: "#f00",
                      strokeOpacity: 0.7,
                      strokeStyle: "solid",
                    });
                    line.setMap(map);
                    setPolyline(line);
                  }

                  map.panTo(marker.getPosition());
                });
              });
            });
        });
      });
    };
    document.head.appendChild(script);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setShowSuggestions(true);
  };

  const handleSearchIconClick = () => {
    applyFilter(searchText, sortOption, regionOption);
  };

  const applyFilter = (text, sort, region) => {
    let data = [...shelters];
    if (text) data = data.filter((s) => s.name.includes(text));
    if (region !== "전체") data = data.filter((s) => s.region === region);
    if (sort === "거리순") data.sort((a, b) => a.distance - b.distance);
    if (sort === "이름순") data.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "등록순") data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "업데이트순") data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setFiltered(data);
    setCurrentPage(1);
  };

  const handleSearchClick = (shelter) => {
    const pos = new window.kakao.maps.LatLng(shelter.lat, shelter.lng);
    const marker = markerMap[shelter.name];
    const iw = infoMap[shelter.name];
    if (!marker || !iw || !mapRef) return;
    if (infoWindow) infoWindow.close();
    if (polyline) polyline.setMap(null);
    mapRef.setLevel(4);
    mapRef.panTo(pos);
    iw.open(mapRef, marker);
    setInfoWindow(iw);
    setSelectedShelter(shelter.name);
    setShowSuggestions(false);
  };

  const paginatedList = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            const controlStyle = {
                flex: 1,
                backgroundColor: "#fff",   // 배경색 흰색
                border: "1px solid #ccc",  // 회색 테두리
                borderRadius: "6px",       // 모서리 둥글게
                padding: "6px",            // 안쪽 여백
                fontSize: "14px",          // 글자 크기
                appearance: ""         // 💡 select 기본 화살표 제거 (브라우저 차이 대응)
              };


  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ width: "400px", padding: "20px", background: "#fff" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>📍 보호소 검색</h2>

               {/* 🔽 필터 바 복원 */}
               <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                <select onChange={(e) => setSortOption(e.target.value)} value={sortOption} style={controlStyle}>
                  <option value="거리순">거리순</option>
                  <option value="등록순">등록순</option>
                  <option value="이름순">이름순</option>
                  <option value="업데이트순">업데이트순</option>
                </select>

                <select onChange={(e) => setRegionOption(e.target.value)} value={regionOption} style={controlStyle}>
                  <option value="전체">전체</option>
                  <option value="서울/인천">서울/인천</option>
                  <option value="경기">경기</option>
                  <option value="충청/강원">충청/강원</option>
                  <option value="부산/경남/전라">부산/경남/전라</option>
                </select>

                <button style={controlStyle}>내 위치</button>
              </div>


        {/* 검색창 + 돋보기 */}
        <div style={{ position: "relative", width: "97%", marginBottom: "10px" }}>
          <input
            value={searchText}
            onChange={handleSearchChange}
            placeholder="데려가시개 입양케어센터 24"
            style={{ width: "100%", padding: "6px 0px 6px 10px", fontSize: "17px", border: "1px solid #ccc", borderRadius: "6px" }}
          />
          <span
            onClick={handleSearchIconClick}
            style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "16px" }}
          >🔍</span>
        </div>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {paginatedList.map((shelter) => (
            <li key={shelter.name} onClick={() => handleSearchClick(shelter)} style={{ padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", background: selectedShelter === shelter.name ? "#ffe4b5" : "#f9f9f9" }}>
              <strong>{shelter.name}</strong>
              <div style={{ fontSize: "13px", color: "#555" }}>{shelter.addr}</div>
              <div style={{ fontSize: "12px", color: "#777" }}>{shelter.tel}</div>
              {shelter.distance && (<div style={{ fontSize: "11px", color: "#999" }}>거리: {shelter.distance.toFixed(1)} km</div>)}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flexGrow: 1, position: "relative" }}>
        <div id="map" style={{ width: "100%", height: "100%" }}></div>
      </div>
    </div>
  );
}

export default MapContainer;
