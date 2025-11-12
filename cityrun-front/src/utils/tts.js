// 간단한 TTS 유틸리티 함수
export const speak = (text) => {
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // 한국어 설정 (브라우저 지원 여부에 따라 달라질 수 있음)
    utterance.lang = "ko-KR";

    synth.cancel(); // 이전 음성 중지
    synth.speak(utterance);

    return true;
  } else {
    console.warn("❌ 브라우저가 TTS(Text-to-Speech)를 지원하지 않습니다.");
    return false;
  }
};
