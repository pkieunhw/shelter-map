
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function ShelterDetail() {
  const { id } = useParams();
  const [shelter, setShelter] = useState(null);

  useEffect(() => {
    fetch('/shelters_updated.json')
      .then(res => res.json())
      .then(data => {
        const found = data.find(s => s.id === id);
        setShelter(found);
      });
  }, [id]);

  if (!shelter) {
    return <div style={{ padding: '20px' }}>보호소 정보를 불러오는 중...</div>;
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1>{shelter.name}</h1>
      <img src={shelter.img} alt={shelter.name} width="250" style={{ borderRadius: '12px', marginBottom: '20px' }} />
      <p><strong>📍 주소:</strong> {shelter.addr}</p>
      <p><strong>📞 전화번호:</strong> {shelter.tel}</p>
      <p><strong>📅 등록일:</strong> {shelter.createdAt}</p>
      <p><strong>🔄 최근 업데이트:</strong> {shelter.updatedAt}</p>
    </div>
  );
}

export default ShelterDetail;
