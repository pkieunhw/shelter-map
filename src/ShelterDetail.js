import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";
import "./App.css";

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function MapContainer() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [sortedShelters, setSortedShelters] = useState([]);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [polylineInstance, setPolylineInstance] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false";
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 10,
        };
        const map = new window.kakao.maps.Map(container, options);
        setMapInstance(map);

        fetch("/shelters.json")
          .then((res) => res.json())
          .then((shelterList) => {
            setShelters(shelterList);

            const markerImage = new window.kakao.maps.MarkerImage(
              "/dog-icon.png",
              new window.kakao.maps.Size(40, 40)
            );

            shelterList.forEach((shelter) => {
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                title: shelter.name,
                image: markerImage,
              });

              window.kakao.maps.event.addListener(marker, "click", () => {
                setSelectedShelter(shelter);
                const shelterPos = new window.kakao.maps.LatLng(shelter.lat, shelter.lng);
                map.setCenter(shelterPos);

                if (userLocation) {
                  if (polylineInstance) polylineInstance.setMap(null);
                  const newPolyline = new window.kakao.maps.Polyline({
                    path: [userLocation, shelterPos],
                    strokeWeight: 4,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeStyle: "solid",
                  });
                  newPolyline.setMap(map);
                  setPolylineInstance(newPolyline);
                }

                navigate(`/shelter/${encodeURIComponent(shelter.name)}`);
              });
            });
          });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const userPos = new window.kakao.maps.LatLng(userLat, userLng);
            setUserLocation(userPos);

            new window.kakao.maps.Marker({
              map: map,
              position: userPos,
              title: "🧍‍♀️ 현재 위치",
            });

            map.setCenter(userPos);
          });
        }
      });
    };

    document.head.appendChild(script);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (value) {
      const filtered = shelters.filter((s) => s.name.includes(value));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (shelter) => {
    if (!mapInstance) return;
    const pos = new window.kakao.maps.LatLng(shelter.lat, shelter.lng);
    mapInstance.setCenter(pos);
    setSelectedShelter(shelter);
    setSearchText(shelter.name);
    setSuggestions([]);
  };

  const toggleSort = () => {
    if (!userLocation) return;
    const sorted = [...shelters].map((s) => ({
      ...s,
      distance: getDistance(userLocation.getLat(), userLocation.getLng(), s.lat, s.lng),
    })).sort((a, b) => a.distance - b.distance);
    setSortedShelters(sorted);
    setSortByDistance(!sortByDistance);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      <div className="w-full lg:w-1/5 bg-gray-100 p-4">
        <h3 className="text-lg font-semibold mb-2">📍 보호소 정보</h3>
        {selectedShelter ? (
          <div className="space-y-2">
            <div className="font-bold">{selectedShelter.name}</div>
            <p>☎ {selectedShelter.tel}</p>
            <p>🏠 {selectedShelter.addr}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedShelter.lat},${selectedShelter.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              교통 보기 🚗
            </a>
          </div>
        ) : (
          <p>마커를 클릭하면 보호소 정보가 여기에 표시됩니다.</p>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center px-4">
        <div className="w-full max-w-4xl py-4">
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="보호소 이름 검색"
            className="w-full px-3 py-2 border rounded shadow"
          />
          {suggestions.length > 0 ? (
            <ul className="border rounded bg-white shadow mt-1">
              {suggestions.map((shelter) => (
                <li
                  key={shelter.name}
                  onClick={() => handleSuggestionClick(shelter)}
                  className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                >
                  {shelter.name}
                </li>
              ))}
            </ul>
          ) : (
            searchText && <p className="text-sm text-gray-500 mt-2">🔍 검색 결과 없음</p>
          )}
        </div>
        <div id="map" className="w-full max-w-4xl h-[500px] rounded shadow" />
      </div>

      <div className="w-full lg:w-1/5 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold mb-2">📏 거리순 보호소</h3>
        <button
          onClick={toggleSort}
          className="mb-4 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {sortByDistance ? "정렬 해제" : "거리순으로 바꾸기"}
        </button>
        <div className="space-y-2">
          {(sortByDistance ? sortedShelters : shelters).map((shelter) => (
            <div
              key={shelter.name}
              onClick={() => handleSuggestionClick(shelter)}
              className="cursor-pointer p-2 bg-white border rounded hover:bg-gray-100"
            >
              <strong>🐶 {shelter.name}</strong>
              {sortByDistance && shelter.distance !== undefined && (
                <><br />🚶‍♀️ {shelter.distance.toFixed(2)} km</>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapContainer;
