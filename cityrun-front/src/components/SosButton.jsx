import React, { useState, useRef } from 'react';
import axios from 'axios';

const SosButton = ({ userId, userLocation }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const timerRef = useRef(null);

  const startPress = () => {
    // 이미 전송 중이면 무시
    if (isSending) return; 

    setIsPressing(true);
    // 3초 후 확인창 띄우기
    timerRef.current = setTimeout(() => {
      if (window.confirm("🚨 3초 이상 길게 눌렀습니다. 긴급 구조 요청을 보내시겠습니까?")) {
        sendSosRequest();
      }
      setIsPressing(false);
    }, 3000);
  };

  const endPress = () => {
    // 3초 되기 전에 손을 떼면 타이머 취소 (실수 방지)
    clearTimeout(timerRef.current);
    setIsPressing(false);
  };

  const sendSosRequest = async () => {
    if (!userId || !userLocation) {
        alert("로그인 또는 위치 정보를 확인할 수 없습니다.");
        return;
    }

    setIsSending(true);
    try {
      const payload = {
        userId: userId, // 💡 실제 로그인된 userId 사용
        lat: userLocation.lat,
        lng: userLocation.lng
      };
      
      // POST /api/sos 요청
      await axios.post('/api/sos', payload); 
      alert("✅ SOS 요청이 성공적으로 전송되었습니다!");
    } catch (err) {
      alert("❌ SOS 요청 실패: 서버 오류.");
      console.error("SOS Error:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      style={{
        ...styles.sosButton,
        backgroundColor: isPressing ? 'darkred' : 'red'
      }}
      disabled={isSending}
    >
      {isSending ? '전송 중...' : (isPressing ? '꾹 누르는 중 (3초)...' : 'SOS')}
    </button>
  );
};

const styles = {
    sosButton: {
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
};

export default SosButton;