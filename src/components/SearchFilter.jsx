// 📁 src/components/SearchFilter.jsx
import React from "react";


function SearchFilter({
    searchText,
    setSearchText,
    handleSearchChange,
    handleSearchIconClick,
    sortOption,
    setSortOption,
    regionOption,
    setRegionOption,
    mapRef,
    userLocation
}) {
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
        <div className="fixed-filter">
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
                <button
                    style={controlStyle}
                    onClick={() => {
                        if (userLocation && mapRef) {
                            mapRef.setLevel(4);
                            mapRef.panTo(userLocation);
                        } else {
                            alert("현재 위치를 가져올 수 없습니다.");
                        }
                    }}
                >
                    내 위치
                </button>
            </div>

            <div style={{ position: "relative", width: "97%", marginBottom: "10px" }}>
                <input
                    value={searchText}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearchIconClick();
                    }}
                    placeholder="데려가시개 입양케어센터 24"
                    style={{ width: "100%", padding: "6px 0px 6px 10px", fontSize: "17px", border: "1px solid #ccc", borderRadius: "6px" }}
                />
                <span
                    onClick={handleSearchIconClick}
                    style={{
                        position: "absolute",
                        right: "20px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}
                >
                    🔍
                </span>
            </div>
        </div>
    );
}

export default SearchFilter;

