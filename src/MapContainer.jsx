import { useEffect, useState } from "react";

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
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
  const [mapRef, setMapRef] = useState(null);
  const [polyline, setPolyline] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [closestName, setClosestName] = useState("");
  const markerMap = {};
  const infoMap = {};

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
              })).sort((a, b) => a.distance - b.distance);

              setShelters(withDistance);
              setFiltered(withDistance);
              setClosestName(withDistance[0]?.name || "");

              withDistance.forEach((shelter) => {
                const marker = new window.kakao.maps.Marker({
                  map,
                  position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                  image: new window.kakao.maps.MarkerImage(
                    shelter.name === withDistance[0].name
                      ? "/dog-icon1.png"
                      : "/dog-icon.png",
                    new window.kakao.maps.Size(40, 40),
                    { offset: new window.kakao.maps.Point(20, 40) }
                  ),
                });
                markerMap[shelter.name] = marker;

                const iw = new window.kakao.maps.InfoWindow();
                const content = document.createElement("div");
                content.style.cssText =
                  "padding:10px;font-size:14px;max-width:300px;line-height:1.6;";
                content.innerHTML = `
                  <strong>${shelter.name}</strong><br/>
                  ${shelter.addr}<br/>
                  ${shelter.tel}<br/>
                  <a href="https://map.kakao.com/link/to/${encodeURIComponent(
                    shelter.name
                  )},${shelter.lat},${shelter.lng}" target="_blank" style="color:blue;">📍 길찾기</a>
                `;
                iw.setContent(content);
                infoMap[shelter.name] = iw;

                window.kakao.maps.event.addListener(marker, "click", () => {
                  if (infoWindow) infoWindow.close();
                  if (polyline) polyline.setMap(null);

                  iw.open(map, marker);
                  setInfoWindow(iw);

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
    setFiltered(value ? shelters.filter((s) => s.name.includes(value)) : shelters);
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
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* 왼쪽 검색창 + 리스트 */}
      <div
        style={{
          width: "400px",
          padding: "20px",
          overflowY: "auto",
          background: "#fff",
          boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
          zIndex: 10,
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>📍 보호소 리스트</h2>
        <input
          value={searchText}
          onChange={handleSearchChange}
          placeholder="보호소 이름 검색"
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            marginBottom: "12px",
          }}
        />
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filtered.map((shelter) => (
            <li
              key={shelter.name}
              onClick={() => handleSearchClick(shelter)}
              style={{
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                background: "#f9f9f9",
              }}
            >
              <strong>{shelter.name}</strong>
              <div style={{ fontSize: "13px", color: "#555" }}>{shelter.addr}</div>
              <div style={{ fontSize: "12px", color: "#777" }}>{shelter.tel}</div>
              {shelter.distance && (
                <div style={{ fontSize: "11px", color: "#999" }}>
                  거리: {shelter.distance.toFixed(1)} km
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 오른쪽 지도 */}
      <div style={{ flexGrow: 1, position: "relative" }}>
        <div id="map" style={{ width: "100%", height: "100%" }}></div>
      </div>
    </div>
  );
}

export default MapContainer;
