import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MapContainer() {
  const [shelters, setShelters] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [infoWindowList, setInfoWindowList] = useState([]);
  const [markerList, setMarkerList] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [closestName, setClosestName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false`; // 본인 키로 교체
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 10,
        });
        setMapRef(map);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const userPos = new window.kakao.maps.LatLng(lat, lng);
            setUserLocation(userPos);
            new window.kakao.maps.Marker({ map, position: userPos });

            fetch("/shelters.json")
              .then((res) => res.json())
              .then((data) => {
                const withDistance = data.map((s) => ({
                  ...s,
                  distance: getDistance(lat, lng, s.lat, s.lng),
                }));
                withDistance.sort((a, b) => a.distance - b.distance);
                setShelters(withDistance);
                setFiltered(withDistance);
                setClosestName(withDistance[0].name);

                const infoList = [];
                const markerList = [];

                withDistance.forEach((shelter) => {
                  const marker = new window.kakao.maps.Marker({
                    position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                    map,
                    image: new window.kakao.maps.MarkerImage(
                      shelter.name === withDistance[0].name
                        ? "/dog-icon1.png"
                        : "/dog-icon.png",
                      new window.kakao.maps.Size(40, 40),
                      { offset: new window.kakao.maps.Point(20, 40) }
                    ),
                  });

                  const content = document.createElement("div");
                  content.style.cssText =
                    "display:flex;align-items:center;max-width:450px;position:relative;background:#fff;padding:12px 14px;border-radius:8px;box-shadow:0 3px 12px rgba(0,0,0,0.3);border:1px solid #ccc;";

                  content.innerHTML = `
                    <img src="${shelter.img || "/preview.jpg"}" style="width:85px;height:85px;margin-right:12px;object-fit:cover;border-radius:6px;border:1px solid #ccc;">
                    <div style="font-size:15px;line-height:1.6;max-width:320px;">
                      <strong>${shelter.name}</strong><br/>
                      ${shelter.addr}<br/>
                      ${shelter.tel}<br/>
                    </div>
                  `;

                  const button = document.createElement("button");
                  button.innerText = "상세보기";
                  button.style.cssText = "margin-top:6px;padding:4px 10px;background:#eee;border-radius:4px;border:1px solid #aaa;cursor:pointer;";
                  button.onclick = () => navigate(`/shelter-detail/${shelter.name}`);
                  content.querySelector("div").appendChild(button);

                  const link = document.createElement("a");
                  link.href = `https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.lat},${shelter.lng}`;
                  link.target = "_blank";
                  link.innerText = "길찾기";
                  link.style.cssText =
                    "margin-left:8px;padding:4px 10px;background:#3B82F6;color:white;border:none;border-radius:6px;font-weight:500;box-shadow:0 2px 6px rgba(0,0,0,0.1);cursor:pointer;";
                  content.querySelector("div").appendChild(link);

                

                  const closeBtn = document.createElement("button");
                  closeBtn.innerText = "❌";
                  closeBtn.style.cssText =
                    "position:absolute;top:6px;right:8px;background:transparent;border:none;font-size:16px;cursor:pointer;";
                  content.appendChild(closeBtn);

                  const iw = new window.kakao.maps.InfoWindow({ content });
                  closeBtn.onclick = () => iw.close();

                  window.kakao.maps.event.addListener(marker, "click", () => {
                    infoList.forEach((inf) => inf.close());
                    iw.open(map, marker);
                    setInfoWindow(iw);
                    map.setLevel(4);
                    map.panTo(marker.getPosition());
                  });

                  infoList.push(iw);
                  markerList.push(marker);
                });

                setInfoWindowList(infoList);
                setMarkerList(markerList);
              });
          });
        }
      });
    };
    document.head.appendChild(script);
  }, []);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearchClick = (shelter, idx) => {
    const pos = new window.kakao.maps.LatLng(shelter.lat, shelter.lng);
    mapRef.setLevel(4);
    mapRef.panTo(pos);

    if (infoWindow) infoWindow.close();
    if (infoWindowList[idx]) {
      infoWindowList.forEach((iw) => iw.close());
      infoWindowList[idx].open(mapRef, markerList[idx]);
      setInfoWindow(infoWindowList[idx]);
    }

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
    } else if (polyline) {
      polyline.setMap(null);
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>

      <div
        style={{
          position: "absolute",
          top: "70px",
          left: "30px",
          width: "400px",
          height: "70vh",
          overflowY: "scroll",
          overflowX: "auto",
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
          onChange={(e) => {
            const value = e.target.value;
            setSearchText(value);
            setFiltered(value ? shelters.filter((s) => s.name.includes(value)) : shelters);
          }}
          placeholder="보호소 이름 검색"
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "100%",
          }}
        />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filtered.map((shelter, idx) => (
            <li
              key={shelter.name}
              onClick={() => handleSearchClick(shelter, idx)}
              style={{
                padding: "10px",
                borderBottom: "1px solid #ddd",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={shelter.img || "/preview.jpg"}
                alt={shelter.name}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  marginRight: "10px",
                  borderRadius: "4px",
                }}
              />
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
