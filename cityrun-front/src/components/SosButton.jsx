// 'SOS' 긴급 요청 버튼 UI 및 3초간 눌러 전송하는 기능을 정의하는 컴포넌트
import React, { useState, useRef } from 'react';
import axios from 'axios';

/**
 * SOS 버튼 컴포넌트
 * @param {object} props
 * @param {string} props.userId - 현재 로그인한 사용자 ID
 * @param {object} props.userLocation - 사용자 현재 위치 {lat, lng}
 */
const SosButton = ({ userId, userLocation }) => {
  // --- State 정의 ---
  // 버튼이 꾹 눌리고 있는지(3초 타이머 작동 중) 여부
  const [isPressing, setIsPressing] = useState(false);
  // API 요청이 전송 중인지(로딩) 여부
  const [isSending, setIsSending] = useState(false);
  // 3초 타이머(setTimeout)의 ID를 저장하기 위한 Ref
  const timerRef = useRef(null);

  // '꾹 누르기' 시작 시(onMouseDown, onTouchStart) 호출
  const startPress = () => {
    // 이미 API 전송 중이면 무시
    if (isSending) return; 

    setIsPressing(true); // '누르는 중' 상태로 변경
    // 3초(3000ms) 후 실행될 타이머 설정
    timerRef.current = setTimeout(() => {
      // 3초 후 사용자에게 확인창(confirm) 표시
      if (window.confirm("3초 이상 길게 눌렀습니다 긴급 구조 요청을 보내시겠습니까?")) {
        // '확인' 클릭 시 SOS 요청 전송
        sendSosRequest();
      }
      setIsPressing(false); // 3초가 지나면 '누르는 중' 상태 해제
    }, 3000);
  };

  // '누르기' 종료 시(onMouseUp, onTouchEnd) 호출
  const endPress = () => {
    // 3초가 되기 전에 손을 떼면, 설정된 타이머(timerRef) 취소
    clearTimeout(timerRef.current);
    setIsPressing(false); // '누르는 중' 상태 해제
  };

  // SOS 요청 API (/api/sos)를 호출하는 비동기 함수
  const sendSosRequest = async () => {
    // userId 또는 userLocation이 없으면 경고 후 종료
    if (!userId || !userLocation) {
        alert("로그인 또는 위치 정보를 확인할 수 없습니다");
        return;
    }

    setIsSending(true); // '전송 중' 상태로 변경 (버튼 비활성화)
    try {
      // API Request Body 페이로드 구성
      const payload = {
        userId: userId, 
        lat: userLocation.lat,
        lng: userLocation.lng
      };
      
      // POST /api/sos API 호출
      await axios.post('/api/sos', payload); 
      alert("SOS 요청이 성공적으로 전송되었습니다");
    } catch (err) {
      alert("SOS 요청 실패: 서버 오류");
      console.error("SOS Error:", err);
    } finally {
      setIsSending(false); // '전송 중' 상태 해제
    }
  };

  // --- 렌더링 ---
  return (
    <button
      // 마우스/터치 이벤트 바인딩
      onMouseDown={startPress}
      onMouseUp={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      style={{
        ...styles.sosButton,
        // '누르는 중' 상태일 때 배경색을 어둡게 변경
        backgroundColor: isPressing ? 'darkred' : 'red'
      }}
      disabled={isSending} // '전송 중'일 때 버튼 비활성화
    >
      {/* 버튼 텍스트를 상태에 따라 동적으로 변경 */}
      {isSending ? '전송 중...' : (isPressing ? '꾹 누르는 중 (3초)...' : 'SOS')}
    </button>
  );
};

// --- 스타일 ---
const styles = {
    // SOS 버튼 (우측 상단 고정)
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