let lastSpokenText = '';
let currentUtterance = null;

export function speak(text) {
  if (!text || !('speechSynthesis' in window)) return;

  if (lastSpokenText === text) return;
  lastSpokenText = text;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-EG';
  utterance.rate = 1;
  utterance.pitch = 1;
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function playAudio(base64Data, mimeType = 'audio/mpeg') {
  if (!base64Data) return;
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
}

export function cancelSpeech() {
  window.speechSynthesis.cancel();
  lastSpokenText = '';
  currentUtterance = null;
}
