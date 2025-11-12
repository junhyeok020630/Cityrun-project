import React from 'react';

const DataPanel = ({ route, isNavigating, deviationMessage }) => {
    if (!route) {
        return <div style={styles.container}><p>경로 데이터를 로드 중입니다...</p></div>;
    }

    const { uphillM, crosswalkCount, finalScore, nightScore, crowdScore, distanceM } = route;
    
    // 경사도, 횡단보도, 혼잡도 데이터를 아이콘과 함께 시각화
    const metrics = [
        { label: '거리', value: `${(distanceM / 1000).toFixed(2)} km`, icon: '📏' },
        { label: '최종 점수', value: `${finalScore}점`, icon: '🏆', color: finalScore > 75 ? 'green' : finalScore > 50 ? 'orange' : 'red' },
        { label: '총 경사', value: `${uphillM} m`, icon: '⛰️', tooltip: '오르막길 미터 수' },
        { label: '신호등/횡단보도', value: `${crosswalkCount} 개`, icon: '🚦', tooltip: '러닝 흐름 방해 요소' },
        { label: '야간 안전 점수', value: `${nightScore}점`, icon: '🌙' },
        { label: '혼잡도 점수', value: `${crowdScore}점`, icon: '👥' },
    ];

    return (
        <div style={styles.container}>
            {isNavigating ? (
                <div style={styles.navStatus}>
                    <p style={{ color: deviationMessage ? 'red' : 'green' }}>
                        {deviationMessage || '🏃‍♂️ 경로 이탈 감시 중'}
                    </p>
                </div>
            ) : (
                <p style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                    {route.name} 상세 정보
                </p>
            )}

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

const styles = {
    container: {
        padding: '15px',
        margin: '10px 0',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginTop: '10px',
    },
    metricItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 0',
        borderBottom: '1px dotted #eee',
    },
    metricLabel: {
        fontSize: '14px',
        color: '#555',
    },
    metricValue: {
        fontSize: '16px',
        fontWeight: 'bold',
    },
    navStatus: {
        fontSize: '20px',
        fontWeight: 'extrabold',
        textAlign: 'center',
        padding: '10px',
    }
};

export default DataPanel;