// 📄 SearchBox.jsx
import { useState } from "react";

function SearchBox({ shelterList, onSearch }) {
  const [keyword, setKeyword] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const shelter = shelterList.find((shelter) =>
        shelter.name.includes(keyword)
      );
      if (shelter) {
        onSearch(shelter);
      } else {
        alert("❌ 검색 결과가 없습니다.");
      }
    }
  };

  const handleChange = (e) => {
    setKeyword(e.target.value);
  };

  return (
    <div className="p-2">
      <input
        type="text"
        value={keyword}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="🔍 보호소 이름을 입력하세요"
        className="border border-gray-400 rounded px-3 py-2 w-full text-sm"
      />
    </div>
  );
}

export default SearchBox;
