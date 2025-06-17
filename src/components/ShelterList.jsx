import React, { useState, useMemo } from "react";
import shelters from "../shelters.json";
import { getDistance } from "../utils/getDistance";
import useMyLocation from "../hooks/useMyLocation";
import SearchFilter from "./SearchFilter";
import SearchList from "./SearchList";

const regionGroups = {
    "수도권": ["서울", "인천", "경기"],
    "영남": ["부산", "대구", "울산", "경남", "경북"],
    "호남": ["광주", "전남", "전북"],
    "충청·강원": ["충남", "충북", "강원", "대전"]
};

function ShelterList() {
    const [regionGroup, setRegionGroup] = useState("전체");
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedShelter, setSelectedShelter] = useState(null); // 💡 항상 객체로!
    const itemsPerPage = 5;
    const myLoc = useMyLocation();

    const filtered = useMemo(() => {
        let arr = shelters.map(item => ({
            ...item,
            distance: getDistance(myLoc.lat, myLoc.lng, item.lat, item.lng)
        }));
        if (regionGroup !== "전체") {
            arr = arr.filter(item =>
                regionGroups[regionGroup].includes(item.region)
            );
        }
        if (searchText.trim()) {
            const q = searchText.trim().toLowerCase();
            arr = arr.filter(item =>
                item.name.toLowerCase().includes(q) ||
                item.addr.toLowerCase().includes(q) ||
                item.tel.replace(/-/g, "").includes(q.replace(/-/g, ""))
            );
        }
        arr.sort((a, b) => a.distance - b.distance);
        return arr;
    }, [regionGroup, searchText, myLoc.lat, myLoc.lng]);

    // ... 생략

    const handleMarkerClick = (shelter) => {
        // 1. filtered에서 몇 번째인지 구함
        const idx = filtered.findIndex((item) => item.id === shelter.id);
        if (idx === -1) return;
        // 2. 페이지 계산 (예: 7개씩)
        const newPage = Math.floor(idx / itemsPerPage) + 1;
        setCurrentPage(newPage); // 리스트 페이지 이동
        setSelectedShelter(shelter); // 리스트 강조

        // 3. 지도 말풍선 띄우기
        const marker = markerMap.current.get(shelter.name);
        const content = infoMap.current.get(shelter.name);
        if (!marker || !content || !mapRef.current) return;
        if (infoWindowRef.current) infoWindowRef.current.close();
        if (polylineRef.current) polylineRef.current.setMap(null);
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, marker);
        setInfoWindow(infoWindowRef.current);

        // 4. 5초 후 동기 해제 (리스트+말풍선)
        if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = setTimeout(() => {
            setSelectedShelter(null);
            infoWindowRef.current.close();
        }, 5000);
    };



    return (
        <div>
            <SearchFilter
                regionGroup={regionGroup}
                setRegionGroup={setRegionGroup}
                searchText={searchText}
                setSearchText={setSearchText}
            />
            <SearchList
                filtered={filtered}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
                selectedShelter={selectedShelter}
                handleSearchClick={handleSearchClick}
            />
        </div>
    );
}

export default ShelterList;
