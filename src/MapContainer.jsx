import React, { useState, useEffect, useRef } from "react";

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
  const [userLocation, setUserLocation] = useState(null);
  const [userOverlay, setUserOverlay] = useState(null);
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
  const infoWindowRef = useRef(null);

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

              if (!infoWindowRef.current) {
                infoWindowRef.current = new window.kakao.maps.InfoWindow();
              }

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

               const content = document.createElement("div");
                  content.style.cssText = `
                    padding: 14px;
                    font-size: 14px;
                    width: 320px;
                    line-height: 1.6;
                    font-family: 'Noto Sans KR', sans-serif;
                    border-radius: 12px;
                    background: white;
                  `;

                  content.innerHTML = `
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                      <img src="${shelter.img}" 
                          width="100" height="100"
                          style="object-fit: cover; border-radius: 8px;" />
                      <div style="flex: 1;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">
                          ${shelter.name}
                        </div>
                        <div style="margin-bottom: 2px;">📍 ${shelter.addr}</div>
                        <div>📞 ${shelter.tel}</div>
                      </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                      <a href="https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.lat},${shelter.lng}" 
                        target="_blank"
                        style="font-size: 15px; font-weight: bold; color:rgb(0, 140, 255); text-decoration: underline;">
                        🧭 길찾기
                      </a>

                      <a href="/shelter-detail/${encodeURIComponent(shelter.name)}" 
                       className="detail-button"
                        >
                        상세페이지 보기
                      </a>
                    </div>
                  `;



                infoMap[shelter.name] = content;

                window.kakao.maps.event.addListener(marker, "click", () => {
                  if (infoWindowRef.current) infoWindowRef.current.close();
                  if (polyline) polyline.setMap(null);

                  infoWindowRef.current.setContent(content);
                  infoWindowRef.current.open(map, marker);
                  setInfoWindow(infoWindowRef.current);
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
    const content = infoMap[shelter.name];
    if (!marker || !content || !mapRef) return;
    if (infoWindowRef.current) infoWindowRef.current.close();
    if (polyline) polyline.setMap(null);
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapRef, marker);
    setInfoWindow(infoWindowRef.current);
    setSelectedShelter(shelter.name);
    setShowSuggestions(false);
  };

  const paginatedList = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const controlStyle = {
    flex: 1,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "6px",
    fontSize: "14px",
    appearance: ""
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
          <div style={{
                width: "400px",
                height: "100vh",
                overflowY: "auto",
                overflowX: "hidden",
                background: "#fff",
                padding: "20px",
                boxShadow: "2px 0 12px rgba(0, 0, 0, 0.1)", // 🎯 그림자 효과
                borderRight: "1px solid #eee",              // 🎯 오른쪽 경계선
                boxSizing: "border-box",
             
           } }>
        <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>📍 보호소 검색</h2>
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
        </div>
          <ul style={{ listStyle: "none", padding: 0 }}>
              {paginatedList.map((shelter, index) => (
                <li
                  key={shelter.name + index}
                  onClick={() => handleSearchClick(shelter)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    marginBottom: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: selectedShelter === shelter.name ? "#ffe4b5" : "#f9f9f9",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={shelter.img || "/default.png"} // 이미지 없을 때 대비
                    alt={shelter.name}
                    width="70"
                    height="70"
                    style={{
                      objectFit: "cover",
                      borderRadius: "8px",
                      backgroundColor: "#f0f0f0"
                    }}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: "16px",fontWeight: "bold" }}>{shelter.name}</div>
                    <div style={{ fontSize: "13px", color: "#555" }}>{shelter.addr}</div>
                    <div style={{ fontSize: "12px", color: "#777" }}>{shelter.tel}</div>
                    {shelter.distance && (
                      <div style={{ fontSize: "12px", color: "red" }}>
                        {shelter.distance.toFixed(1)} km
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            


     
           
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={currentPage === 1 ? "disabled" : ""}
                  >
                    ◀
                  </button>

                  {[...Array(Math.ceil(filtered.length / itemsPerPage)).keys()].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page + 1)}
                      className={currentPage === page + 1 ? "active" : ""}
                    >
                      {page + 1}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={currentPage === Math.ceil(filtered.length / itemsPerPage) ? "disabled" : ""}
                  >
                    ▶
                  </button>
                </div>

                      



      </div>
      <div style={{ flexGrow: 1, position: "relative" }}>
        <div id="map" style={{ width: "100%", height: "100%" }}></div>
      </div>
    </div>
  );
}

export default MapContainer;
