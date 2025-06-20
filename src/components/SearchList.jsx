// [src/components/SearchList.jsx]

import React, { useRef, useEffect } from "react";

function SearchList({
    filtered,
    currentPage,
    itemsPerPage,
    selectedShelter,
    handleSearchClick,
    setCurrentPage
}) {
    // 선택 보호소 자동 스크롤 ref
    const selectedRef = useRef(null);

    // 선택이 바뀌면 스크롤 자동 이동
    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [selectedShelter, currentPage]);

    // 현재 페이지의 보호소 목록
    const paginatedList = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            {/* 보호소 리스트 */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {paginatedList.map((shelter, index) => (
                    <li
                        key={shelter.id || (shelter.name + index)}
                        ref={
                            selectedShelter && selectedShelter.id === shelter.id
                                ? selectedRef
                                : null
                        }
                        onClick={() => handleSearchClick(shelter)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px",
                            marginBottom: "10px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            background:
                                selectedShelter && selectedShelter.id === shelter.id
                                    ? "#ffe4b5"
                                    : "#fff",
                            boxShadow:
                                selectedShelter && selectedShelter.id === shelter.id
                                    ? "0 1px 7px #ffd18070"
                                    : "0 1px 4px #f1f3f6",
                            cursor: "pointer",
                            transition: "background 0.2s, box-shadow 0.2s"
                        }}
                    >
                        <img
                            src={shelter.img || "/default.png"}
                            alt={shelter.name}
                            width="68"
                            height="68"
                            style={{
                                objectFit: "cover",
                                borderRadius: "8px",
                                backgroundColor: "#f0f0f0",
                                border: "1px solid #f3f3f3"
                            }}
                        />
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ fontSize: "17px", fontWeight: "bold" }}>
                                {shelter.name}
                            </div>
                            <div style={{ fontSize: "13px", color: "#444", marginBottom: "3px" }}>
                                {shelter.addr}
                            </div>
                            <div style={{ fontSize: "12px", color: "#777" }}>{shelter.tel}</div>
                            {shelter.distance !== undefined && (
                                <div style={{
                                    fontSize: "12px",
                                    color: "#e53935",
                                    fontWeight: "bold"
                                }}>
                                    {shelter.distance.toFixed(1)} km
                                </div>
                            )}
                        </div>
                    </li>
                ))}
                {/* 리스트가 비었을 때 안내 메시지 */}
                {paginatedList.length === 0 && (
                    <li style={{
                        textAlign: "center",
                        color: "#999",
                        padding: "40px 0 10px 0",
                        fontSize: "17px"
                    }}>
                        등록된 보호소가 없습니다.
                    </li>
                )}
            </ul>

            {/* 페이지네이션 */}
            <div style={{
                display: "flex", gap: 5, justifyContent: "center",
                marginTop: 8, marginBottom: 8
            }}>
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    style={{
                        padding: "5px 12px", borderRadius: 5, border: "none",
                        background: currentPage === 1 ? "#e9ecef" : "#1976d2",
                        color: currentPage === 1 ? "#aaa" : "#fff",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        fontWeight: "bold"
                    }}
                >◀</button>
                {[...Array(Math.ceil(filtered.length / itemsPerPage)).keys()].map(
                    (page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page + 1)}
                            style={{
                                padding: "5px 10px",
                                borderRadius: 5,
                                border: "none",
                                background: currentPage === page + 1 ? "#ffa000" : "#f3f3f3",
                                color: currentPage === page + 1 ? "#fff" : "#222",
                                fontWeight: currentPage === page + 1 ? "bold" : "normal",
                                boxShadow: currentPage === page + 1 ? "0 1px 4px #ffd18080" : "none",
                                cursor: "pointer"
                            }}
                        >
                            {page + 1}
                        </button>
                    )
                )}
                <button
                    disabled={currentPage === Math.ceil(filtered.length / itemsPerPage) || filtered.length === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    style={{
                        padding: "5px 12px", borderRadius: 5, border: "none",
                        background: (currentPage === Math.ceil(filtered.length / itemsPerPage) || filtered.length === 0) ? "#e9ecef" : "#1976d2",
                        color: (currentPage === Math.ceil(filtered.length / itemsPerPage) || filtered.length === 0) ? "#aaa" : "#fff",
                        cursor: (currentPage === Math.ceil(filtered.length / itemsPerPage) || filtered.length === 0) ? "not-allowed" : "pointer",
                        fontWeight: "bold"
                    }}
                >▶</button>
            </div>
        </>
    );
}

export default SearchList;
