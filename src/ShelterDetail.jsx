import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ShelterDetail() {
  const { id } = useParams();
  const [shelter, setShelter] = useState(null);

  useEffect(() => {
    fetch("/shelters_updated.json")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((s) => s.id === id);
        setShelter(found);
      });
  }, [id]);

  useEffect(() => {
  if (!shelter || !shelter.lat || !shelter.lng) return;

  const script = document.createElement("script");
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false`;
  script.async = true;

  script.onload = () => {
    window.kakao.maps.load(() => {
      // 💡 DOM이 완전히 그려지고 난 뒤에 실행
      setTimeout(() => {
        const container = document.getElementById("map");
        if (!container) {
          console.error("❌ #map DOM을 찾을 수 없습니다");
          return;
        }

        const options = {
          center: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
          level: 4,
        };

        const map = new window.kakao.maps.Map(container, options);

        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
          title: shelter.name,
        });

        console.log("✅ Kakao Map initialized");
      }, 200); // 💡 살짝 딜레이
    });
  };

  document.head.appendChild(script);
}, [shelter]);



  if (!shelter) return <p>보호소 정보를 불러오는 중...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>🐾 {shelter.name}</h1>
      <img
        src={shelter.img}
        alt={shelter.name}
        style={{ width: 250, borderRadius: 12, marginBottom: "16px" }}
      />
      <p>📍 주소: {shelter.addr}</p>
      <p>📞 전화: {shelter.tel}</p>
      <p>📅 등록일: {shelter.createdAt}</p>
      <p>🔄 업데이트: {shelter.updatedAt}</p>




    {/* ✅ 여기 추가하세요 */}
        <h2 style={{ marginTop: "30px" }}>🗺️ 보호소 위치 지도</h2>
      <div
        id="map"
        // {/* style={{
        //   width: "100%",
        //   marginTop: "20px",
        //   border: "2px solid #ccc",
        //   borderRadius: "12px",
        //   backgroundColor: "#e8f4ff", // 연한 하늘색
        // }} */}
      ></div>

  </div>
);
}

export default ShelterDetail;
