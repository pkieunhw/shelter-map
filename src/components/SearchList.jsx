import React, { useRef, useEffect } from "react";

function SearchList({
    filtered,
    currentPage,
    itemsPerPage,
    selectedShelter,
    handleSearchClick,
    setCurrentPage
}) {
    // 1. ref 선언(한 번만)
    const selectedRef = useRef(null);

    // 2. 선택된 shelter가 바뀔 때 자동 스크롤
    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [selectedShelter, currentPage]);

    const paginatedList = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {paginatedList.map((shelter, index) => (
                    <li
                        key={shelter.id || (shelter.name + index)}
                        // 3. 선택된 shelter에만 ref 연결(중복 없이!)
                        ref={selectedShelter && selectedShelter.id === shelter.id ? selectedRef : null}
                        onClick={() => handleSearchClick(shelter)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px",
                            marginBottom: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            background:
                                selectedShelter && selectedShelter.id === shelter.id
                                    ? "#ffe4b5"
                                    : "#f9f9f9",
                            cursor: "pointer"
                        }}
                    >
                        <img
                            src={shelter.img || "/default.png"}
                            alt={shelter.name}
                            width="70"
                            height="70"
                            style={{
                                objectFit: "cover",
                                borderRadius: "8px",
                                backgroundColor: "#f0f0f0"
                            }}
                        />
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{shelter.name}</div>
                            <div style={{ fontSize: "13px", color: "#555" }}>{shelter.addr}</div>
                            <div style={{ fontSize: "12px", color: "#777" }}>{shelter.tel}</div>
                            {shelter.distance && (
                                <div style={{ fontSize: "12px", color: "red" }}>
                                    {shelter.distance.toFixed(1)} km
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {/* Pagination */}
            <div className="pagination">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={currentPage === 1 ? "disabled" : ""}
                >
                    ◀
                </button>
                {[...Array(Math.ceil(filtered.length / itemsPerPage)).keys()].map(
                    (page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page + 1)}
                            className={currentPage === page + 1 ? "active" : ""}
                        >
                            {page + 1}
                        </button>
                    )
                )}
                <button
                    disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={
                        currentPage === Math.ceil(filtered.length / itemsPerPage) ? "disabled" : ""
                    }
                >
                    ▶
                </button>
            </div>
        </>
    );
}

export default SearchList;
