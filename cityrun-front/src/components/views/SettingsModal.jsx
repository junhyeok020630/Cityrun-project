// '경로 추천 설정' (목표 거리, 옵션)을 변경하는 모달 컴포넌트
import React from 'react';

/**
 * 경로 추천 설정(Settings) 모달
 * @param {object} props
 * @param {object} props.routeData - 현재 경로 설정값 (distanceKm, prefs)
 * @param {function} props.setRouteData - routeData state를 변경하는 App.jsx의 핸들러
 * @param {function} props.onClose - 모달을 닫는 핸들러
 */
const SettingsModal = ({ routeData, setRouteData, onClose }) => {
  return (
    // 모달 배경 (어둡게)
    // 클릭 시 onClose 핸들러를 호출하여 모달을 닫음
    <div style={styles.modalOverlay} onClick={onClose}>
      {/* 모달 컨텐츠 (클릭 이벤트 전파 방지) */}
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>설정</h3>
        
        {/* 1. 목표 거리(km) 설정 그룹 */}
        <div style={styles.distanceGroup}>
          <label style={styles.distanceLabel}>
            원하는 거리 (km):
            <input
              type="number"
              value={routeData.distanceKm}
              // App.jsx의 routeData state를 직접 업데이트
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                setRouteData((prev) => ({ 
                  ...prev, 
                  // 0 이하의 값이 입력될 경우 5.0으로 강제
                  distanceKm: newValue > 0 ? newValue : 5.0 
                }));
              }}
              style={styles.distanceInput}
            />
          </label>
        </div>

        {/* 2. 선호 조건(prefs) 설정 그룹 */}
        <div style={styles.prefsGroup}>
          <h4>선호 조건</h4>
          {/* routeData.prefs 객체를 순회하며 체크박스 생성 */}
          {Object.keys(routeData.prefs).map((key) => (
            <label key={key} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={routeData.prefs[key]}
                // App.jsx의 routeData.prefs state를 업데이트
                onChange={(e) =>
                  setRouteData((prev) => ({
                    ...prev,
                    prefs: {
                      ...prev.prefs,
                      [key]: e.target.checked, // 해당 키의 boolean 값 토글
                    },
                  }))
                }
              />
              {/* 키(key)에 따라 레이블 텍스트 표시 */}
              {key === 'minimizeCrosswalks' && ' 횡단보도 최소화'}
            </label>
          ))}
        </div>
        
        {/* 3. 닫기 버튼 */}
        <button onClick={onClose} style={styles.closeButton}>
          닫기
        </button>
      </div>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 모달 전체를 덮는 어두운 배경
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // 모달 본문 (흰색 박스)
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
  },
  // 거리 설정 그룹
  distanceGroup: {
    margin: '20px 0',
  },
  // 거리 레이블 (Flex)
  distanceLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // 거리 입력 (number)
  distanceInput: {
    width: '80px',
    padding: '8px',
    fontSize: '16px',
    textAlign: 'center',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  // 선호 조건 그룹
  prefsGroup: {
    margin: '20px 0',
  },
  // 닫기 버튼
  closeButton: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
};

export default SettingsModal;