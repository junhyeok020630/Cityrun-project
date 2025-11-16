// React 애플리케이션의 메인 진입점(Entry Point)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // 최상위 App 컴포넌트 임포트

// public/index.html 파일에 있는 'root' ID를 가진 DOM 요소를 찾음
ReactDOM.createRoot(document.getElementById("root")).render(
    // React의 <StrictMode>를 사용하여 개발 모드에서 잠재적인 문제를 검사
    <React.StrictMode>
        {/* App 컴포넌트를 'root' div 내부에 렌더링 */}
        <App />
    </React.StrictMode>
);