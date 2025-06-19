

import React, { useState, useRef, useEffect } from "react";
import SearchList from "./SearchList";
import SearchFilter from "./SearchFilter";
import { useShelterMap } from "../hooks/useShelterMap";

function MapContainer() {
  // ======== 레퍼런스(참조 객체)
  const mapRef = useRef(null);
  const markerMap = useRef(new Map());
  const infoMap = useRef(new Map());
  const infoWindowRef = useRef(null);
  const userLocation = useRef(null);
  const polylineRef = useRef(null);

  // ======== 상태(state) 관리
  const [shelters, setShelters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [closestName, setClosestName] = useState("");
  const [infoWindow, setInfoWindow] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [regionOption, setRegionOption] = useState("전체");
  const [sortOption, setSortOption] = useState("거리순");
  const [searchText, setSearchText] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autoCloseTimer = useRef(null);

  const itemsPerPage = 7;

  // ======== 마커/리스트 클릭 동기화
  const handleSearchClick = (shelter) => {
    if (!shelter) return;
    const idx = filtered.findIndex(item => item.id === shelter.id);
    if (idx !== -1) {
      setCurrentPage(Math.floor(idx / itemsPerPage) + 1);
    }
    const marker = markerMap.current.get(shelter.name);
    const content = infoMap.current.get(shelter.name);
    if (!marker || !content || !mapRef.current) return;
    if (infoWindowRef.current) infoWindowRef.current.close();
    if (polylineRef.current) polylineRef.current.setMap(null);

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapRef.current, marker);
    setInfoWindow(infoWindowRef.current);
    setSelectedShelter(shelter);

    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    autoCloseTimer.current = setTimeout(() => {
      setSelectedShelter(null);
      if (infoWindowRef.current) infoWindowRef.current.close();
    }, 5000);
  };

  useShelterMap({
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
    handleMarkerClick: handleSearchClick,
  });

  useEffect(() => {
    applyFilter(searchText, sortOption, regionOption);
  }, [searchText, sortOption, regionOption, shelters]);

  const applyFilter = (text, sort, region) => {
    let data = [...shelters];
    if (text) data = data.filter((s) => s.name.includes(text));
    if (region !== "전체") data = data.filter((s) => s.region === region);
    if (sort === "거리순") data.sort((a, b) => a.distance - b.distance);
    if (sort === "이름순") data.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "등록순") data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "업데이트순") data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setFiltered(data);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setShowSuggestions(true);
    const suggestions = shelters.filter((shelter) =>
      shelter.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(suggestions.slice(0, 5));
  };

  const handleSearchIconClick = () => {
    // setSearchText(searchText); // 이미 반영됨
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div className="sidebar" style={{ width: 370, background: "#f4f6fa", padding: 16 }}>
        <SearchFilter
          searchText={searchText}
          setSearchText={setSearchText}
          handleSearchChange={handleSearchChange}
          handleSearchIconClick={handleSearchIconClick}
          sortOption={sortOption}
          setSortOption={setSortOption}
          regionOption={regionOption}
          setRegionOption={setRegionOption}
          mapRef={mapRef.current}
          userLocation={userLocation.current}
        />
        <SearchList
          filtered={filtered}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          selectedShelter={selectedShelter}
          handleSearchClick={handleSearchClick}
          setCurrentPage={setCurrentPage}
        />
      </div>
      <div style={{ flexGrow: 1, position: "relative" }}>
        <div id="map" style={{ width: "100%", height: "100%" }}></div>
      </div>
    </div>
  );
}

export default MapContainer;
