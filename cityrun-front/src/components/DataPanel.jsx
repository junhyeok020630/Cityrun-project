// 경로 추천 결과의 주요 데이터(거리 등)를 표시하는 패널 UI 컴포넌트
import React from 'react';

/**
 * 경로 데이터 표시 패널
 * @param {object} props
 * @param {object} props.route - 추천 경로 상세 정보
 */
const DataPanel = ({ route }) => {
    // route 데이터가 없을 경우 로딩 메시지 표시
    if (!route) {
        return <div style={styles.container}><p>경로 데이터를 로드 중입니다</p></div>;
    }

    const { distanceM } = route;
    
    // 표시할 메트릭 목록 (현재는 거리만 사용)
    const metrics = [
        // 거리 (미터 -> 킬로미터 변환)
        { label: '거리', value: `${(distanceM / 1000).toFixed(2)} km`, icon: '📏' },
    ];

    return (
        <div style={styles.container}>
            {/* 경로 이름 및 제목 */}
            <p style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                {route.name} 상세 정보
            </p>

            {/* 메트릭 그리드 */}
            <div style={styles.metricsGrid}>
                {metrics.map(m => (
                    <div key={m.label} style={styles.metricItem}>
                        <span style={styles.metricLabel}>
                            {m.icon} {m.label}
                        </span>
                        <span style={{ ...styles.metricValue, color: m.color || 'black' }}>
                            {m.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 스타일 ---
const styles = {
    // 패널 전체 컨테이너
    container: {
        padding: '15px',
        margin: '10px 0',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    // 메트릭 항목을 담는 그리드 (1열)
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr', 
        gap: '10px',
        marginTop: '10px',
    },
    // 개별 메트릭 항목
    metricItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 0',
        borderBottom: '1px dotted #eee',
    },
    // 메트릭 레이블 (제목)
    metricLabel: {
        fontSize: '14px',
        color: '#555',
    },
    // 메트릭 값 (숫자/거리)
    metricValue: {
        fontSize: '16px',
        fontWeight: 'bold',
    },
};

export default DataPanel;