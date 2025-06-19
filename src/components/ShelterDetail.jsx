import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ShelterDetail() {
    const { id } = useParams();
    const [shelter, setShelter] = useState(null);

    // 보호소 정보 불러오기
    useEffect(() => {
        fetch("/shelters.json")
            .then((res) => res.json())
            .then((data) => {
                const found = data.find((s) => String(s.id) === String(id));
                setShelter(found);
            });
    }, [id]);

    // 상세페이지 지도 표시
    useEffect(() => {
        if (!shelter || !shelter.lat || !shelter.lng) return;
        if (!window.kakao?.maps) {
            const script = document.createElement("script");
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=b20318c59f42b7677cbf4c31b9f38420&autoload=false`;
            script.async = true;
            script.onload = () => window.kakao.maps.load(drawMap);
            document.head.appendChild(script);
        } else {
            window.kakao.maps.load(drawMap);
        }

        function drawMap() {
            const container = document.getElementById("shelter-detail-map");
            if (!container) return;
            container.style.width = "100%";
            container.style.height = "400px";
            container.style.minHeight = "320px";
            const map = new window.kakao.maps.Map(container, {
                center: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                level: 4,
            });
            new window.kakao.maps.Marker({
                map,
                position: new window.kakao.maps.LatLng(shelter.lat, shelter.lng),
                title: shelter.name,
            });
        }
    }, [shelter]);

    if (!shelter) return <div>Loading...</div>;

    return (
        <div
            style={{
                width: "100vw",
                minHeight: "100vh",
                background: "#fff",
                overflowY: "auto",
                padding: "32px 0 40px 0",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: 900,
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 0 16px #f0f0f0",
                    padding: "32px",
                    minHeight: 600,
                }}
            >
                <h1 style={{ fontSize: 38, marginBottom: 28 }}>
                    <span role="img" aria-label="paw">🐾</span> {shelter.name}
                </h1>
                {/* 이미지 + 정보 flex 배치 */}
                <div
                    style={{
                        display: "flex",
                        gap: "32px",
                        alignItems: "flex-start",
                        marginBottom: "28px",
                        flexWrap: "wrap"
                    }}
                >
                    {/* 왼쪽: 이미지 */}
                    <img
                        src={shelter.img}
                        alt={shelter.name}
                        style={{
                            width: 260,
                            height: 180,
                            objectFit: "cover",
                            borderRadius: 10,
                            boxShadow: "0 0 8px #eee",
                            flexShrink: 0
                        }}
                    />
                    {/* 오른쪽: 상세정보 */}
                    <ul
                        style={{
                            fontSize: 19,
                            textAlign: "left",
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            lineHeight: 2.2,
                            flex: 1
                        }}
                    >
                        <li>📍 <b>주소:</b> {shelter.addr}</li>
                        <li>☎️ <b>전화:</b> {shelter.tel}</li>
                        <li>🗓️ <b>등록일:</b> {shelter.createdAt}</li>
                        <li>📅 <b>업데이트:</b> {shelter.updatedAt}</li>
                    </ul>
                </div>

                {/* 지도 */}
                <h2 style={{ margin: "28px 0 18px 0", fontSize: 28 }}>
                    🗺️ 보호소 위치 지도
                </h2>
                <div
                    style={{
                        width: "100%",
                        height: "420px",
                        minHeight: "320px",
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 0 8px #eee",
                    }}
                >
                    <div
                        id="shelter-detail-map"
                        style={{
                            width: "100%",
                            height: "100%",
                            minHeight: "320px"
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default ShelterDetail;
