// ✅ 도그마 스타일 검색창 상단 고정 개선
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lat1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function MapContainer() {
  const [shelters, setShelters] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [polyline, setPolyline] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [closestName, setClosestName] = useState("");
  const navigate = useNavigate();
  const markerMap = {};
  const infoMap = {};

  const goToDetail = (shelter) => {
    navigate(`/shelter-detail/${encodeURIComponent(shelter.name)}`, { state: { shelter } });
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false";
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

          fetch("/shelters.json")
            .then((res) => res.json())
            .then((data) => {
              const withDistance = data.map((shelter) => ({
                ...shelter,
                distance: getDistance(lat, lng, shelter.lat, shelter.lng),
              }));

              withDistance.sort((a, b) => a.distance - b.distance);
              setShelters(withDistance);
              setFiltered(withDistance);

              let closest = withDistance[0];
              setClosestName(closest.name);

              withDistance.forEach((shelter) => {
                const marker = new window.kakao.maps.Marker({
                  map,
                  position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                  image: new window.kakao.maps.MarkerImage(
                    shelter.name === closest.name ? "/dog-icon1.png" : "/dog-icon.png",
                    new window.kakao.maps.Size(40, 40),
                    { offset: new window.kakao.maps.Point(20, 40) }
                  ),
                });
                markerMap[shelter.name] = marker;

                const imageSrc = shelter.img && typeof shelter.img === "string" && shelter.img.trim() !== ""
                  ? shelter.img
                  : "/preview.jpg";
                const iw = new window.kakao.maps.InfoWindow();

                const content = document.createElement("div");
                content.style.cssText =
                  "display:flex;align-items:center;max-width:450px;position:relative;background:#fff;padding:12px 14px;border-radius:8px;box-shadow:0 3px 12px rgba(0,0,0,0.3);border:1px solid #ccc;";

                content.innerHTML = `
                  <img src="${imageSrc}" alt="${shelter.name}" onerror="this.src='/preview.jpg'"
                    style="width:85px;height:85px;margin-right:12px;object-fit:cover;border-radius:6px;border:1px solid #ccc;">
                  <div style="font-size:15px;line-height:1.6;max-width:320px;">
                    <strong style="font-size:16px;">${shelter.name}</strong><br/>
                    ${shelter.addr}<br/>
                    ${shelter.tel}<br/>
                    <button id="detail-btn-${shelter.name}" style='margin-top:6px;padding:6px 12px;background:#ccc;border-radius:4px;border:none;cursor:pointer;'>상세보기</button>
                  </div>
                `;

                const closeBtn = document.createElement("button");
                closeBtn.innerText = "❌";
                closeBtn.style.cssText =
                  "position:absolute;top:6px;right:8px;background:transparent;border:none;font-size:16px;cursor:pointer;";
                closeBtn.onclick = () => iw.close();
                content.appendChild(closeBtn);

                iw.setContent(content);
                infoMap[shelter.name] = iw;

                setTimeout(() => {
                  const detailBtn = document.getElementById(`detail-btn-${shelter.name}`);
                  if (detailBtn) {
                    detailBtn.onclick = () => goToDetail(shelter);
                  }
                }, 100);

                window.kakao.maps.event.addListener(marker, "click", () => {
                  if (infoWindow) infoWindow.close();
                  if (polyline) polyline.setMap(null);

                  iw.open(map, marker);
                  setInfoWindow(iw);

                  if (shelter.name === closestName && userLocation) {
                    const line = new window.kakao.maps.Polyline({
                      path: [userLocation, new window.kakao.maps.LatLng(shelter.lat, shelter.lng)],
                      strokeWeight: 4,
                      strokeColor: "#f00",
                      strokeOpacity: 0.7,
                      strokeStyle: "solid",
                    });
                    line.setMap(map);
                    setPolyline(line);
                  }
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
    setFiltered(
      value ? shelters.filter((s) => s.name.includes(value)) : shelters
    );
  };

  const handleSearchClick = (shelter) => {
    const pos = new window.kakao.maps.LatLng(shelter.lat, shelter.lng);
    const offsetPos = new window.kakao.maps.LatLng(shelter.lat + 0.0012, shelter.lng);

    if (infoWindow) infoWindow.close();
    if (polyline) polyline.setMap(null);

    const iw = infoMap[shelter.name];
    if (!iw) return;
    iw.setPosition(offsetPos);
    iw.open(mapRef);
    setInfoWindow(iw);

    mapRef.setLevel(3);
    mapRef.panTo(pos);

    if (shelter.name === closestName && userLocation) {
      const line = new window.kakao.maps.Polyline({
        path: [userLocation, pos],
        strokeWeight: 4,
        strokeColor: "#f00",
        strokeOpacity: 0.7,
        strokeStyle: "solid",
      });
      line.setMap(mapRef);
      setPolyline(line);
    }
  };
          return (
            <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
              {/* 지도 */}
              <div id="map" style={{ width: "100%", height: "100%" }}></div>

              {/* 🧭 검색창: 지도 위에 고정 */}
              <div
                style={{
                  position: "absolute",
                  top: "70px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "560px",
                  maxHeight: "70vh",
                  overflowY: "auto",
                  background: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  padding: "12px",
                  zIndex: 9999,
                }}
              >
              
              
            
          

  
        <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>📍 보호소 리스트</h2>
        <input
          value={searchText}
          onChange={handleSearchChange}
          placeholder="보호소 이름 검색"
          style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: "4px", width: "100%" }}
        />
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filtered.map((shelter) => (
            <li
              key={shelter.name}
              onClick={() => handleSearchClick(shelter)}
              style={{ padding: "10px", borderBottom: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <img src={shelter.img || "/preview.jpg"} alt={shelter.name} style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "10px", borderRadius: "4px" }} />
              <div>
                <strong>{shelter.name}</strong>
                <div style={{ fontSize: "13px", color: "#555" }}>{shelter.addr}</div>
                <div style={{ fontSize: "13px", color: "#777" }}>{shelter.tel}</div>
                {shelter.distance && (
                  <div style={{ fontSize: "12px", color: "#999" }}>{shelter.distance.toFixed(1)} km</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MapContainer;
