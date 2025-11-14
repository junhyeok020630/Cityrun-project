import React from 'react';

const BottomNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'activity', label: '활동' },
    { id: 'mypage', label: '마이페이지' },
  ];

  return (
    <nav style={styles.navContainer}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          style={{
            ...styles.navButton,
            color: currentView === item.id ? '#007bff' : '#888',
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

const styles = {
  navContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '60px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  navButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px',
    fontWeight: 'bold',
  },
};

export default BottomNav;