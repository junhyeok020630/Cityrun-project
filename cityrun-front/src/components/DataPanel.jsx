import React from 'react';

const DataPanel = ({ route }) => {
    if (!route) {
        return <div style={styles.container}><p>경로 데이터를 로드 중입니다...</p></div>;
    }

    const { distanceM } = route;
    
    // '거리' 외 모든 메트릭 제거
    const metrics = [
        { label: '거리', value: `${(distanceM / 1000).toFixed(2)} km`, icon: '📏' },
    ];

    return (
        <div style={styles.container}>
            <p style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                {route.name} 상세 정보
            </p>

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
        gridTemplateColumns: '1fr', // 1열로 변경
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
    // (참고) navStatus 스타일은 이제 사용되지 않습니다.
};

export default DataPanel;