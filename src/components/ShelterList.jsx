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
    const [sortOption, setSortOption] = useState("거리순");
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedShelter, setSelectedShelter] = useState(null);
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
        // ⭐️ 정렬 옵션 추가
        if (sortOption === "이름순") {
            arr.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            arr.sort((a, b) => a.distance - b.distance); // 거리순
        }
        return arr;
    }, [regionGroup, sortOption, searchText, myLoc.lat, myLoc.lng]);

    // handleSearchClick, handleMarkerClick 등은 동일하게 구현

    return (
        <div>
            <SearchFilter
                regionGroup={regionGroup}
                setRegionGroup={setRegionGroup}
                sortOption={sortOption}
                setSortOption={setSortOption}
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
