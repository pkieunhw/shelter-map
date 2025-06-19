
import { useEffect } from "react";
import { getDistance } from "../utils/getDistance";

export function useShelterMap({
    setShelters,
    setFiltered,
    setClosestName,
    setInfoWindow,
    setSelectedShelter,
    closestName,
    mapRef,
    userLocation,
    polylineRef,
    markerMap,
    infoMap,
    infoWindowRef,
    handleMarkerClick, // 이거 꼭 props로 추가!
}) {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                const map = new window.kakao.maps.Map(document.getElementById("map"), {
                    center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                    level: 10,
                });
                mapRef.current = map;

                navigator.geolocation.getCurrentPosition((pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const userPos = new window.kakao.maps.LatLng(lat, lng);
                    userLocation.current = userPos;

                    new window.kakao.maps.Marker({ map, position: userPos, title: "현재 위치" });

                    const pulse = document.createElement("div");
                    pulse.className = "pulse-marker";
                    new window.kakao.maps.CustomOverlay({
                        content: pulse,
                        position: userPos,
                        xAnchor: 0.5,
                        yAnchor: 0.5
                    }).setMap(map);

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
                                        new window.kakao.maps.Size(50, 50),
                                        { offset: new window.kakao.maps.Point(20, 40) }
                                    ),
                                });
                                markerMap.current.set(shelter.name, marker);

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
                  <div style="padding: 7px; font-size: 12px; position: relative;">
                    <div style="position: absolute; top: 2px; right: 7px; cursor: pointer; font-size: 25px;" id="closeBtn">✖</div>
                    <div style="display: flex; gap: 9px; align-items: flex-start;">
                      <img src="${shelter.img}" width="70" height="70" style="object-fit: cover; border-radius: 8px;" />
                      <div style="flex: 1;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${shelter.name}</div>
                        <div style="margin-bottom: 2px;">📍 ${shelter.addr}</div>
                        <div>📞 ${shelter.tel}</div>
                      </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                      <a href="https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.lat},${shelter.lng}" target="_blank" style="font-size: 15px; font-weight: bold; color:rgb(0, 140, 255); text-decoration: underline;">🧭 길찾기</a>
                      <a href="/shelter-detail/${encodeURIComponent(shelter.id)}" class="detail-button">상세 보기</a>
                    </div>
                  </div>
                `;

                                content.querySelector("#closeBtn").onclick = () => {
                                    infoWindowRef.current?.close();
                                };

                                infoMap.current.set(shelter.name, content);

                                window.kakao.maps.event.addListener(marker, "click", () => {
                                    handleMarkerClick(shelter); // ✅ MapContainer에서 받아서 연결!
                                    map.panTo(marker.getPosition());
                                });
                                infoWindowRef.current?.close();
                                polylineRef.current?.setMap(null);

                                infoWindowRef.current.setContent(content);
                                infoWindowRef.current.open(map, marker);
                                setInfoWindow(infoWindowRef.current);
                                setSelectedShelter(shelter); // ✅ 반드시 shelter 전체 객체로!


                                setTimeout(() => {
                                    infoWindowRef.current?.close();
                                }, 50000);

                                if (shelter.name === closestName && userLocation.current) {
                                    const line = new window.kakao.maps.Polyline({
                                        path: [userLocation.current, marker.getPosition()],
                                        strokeWeight: 4,
                                        strokeColor: "#f00",
                                        strokeOpacity: 0.7,
                                        strokeStyle: "solid",
                                    });
                                    line.setMap(map);
                                    polylineRef.current = line;
                                }
                                window.kakao.maps.event.addListener(marker, "click", () => {
                                    handleMarkerClick(shelter); // ⭐️ MapContainer에서 내려준 함수로 동기화!

                                    map.panTo(marker.getPosition());
                                });
                            });
                        });
                });
            });
        };
        document.head.appendChild(script);
    }, []);

    return {
        mapRef,
        markerMap,
        infoMap,
        infoWindowRef,
        userLocation,
        polylineRef,
    };
}
