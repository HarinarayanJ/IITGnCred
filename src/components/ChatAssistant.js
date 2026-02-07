import React, { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import './ChatAssistant.css';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I can guide you through the app. You can type or speak to me.' }
  ]);
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- VOICE RECORDER HOOK ---
  const { startRecording, stopRecording, status } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => handleVoiceUpload(blob) 
  });

  // --- HANDLERS ---

  // 1. Handle Text Submission
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText;
    addMessage('user', userMessage);
    setInputText(''); 
    setIsLoading(true);

    try {
      const botResponse = await sendTextToBackend(userMessage); 
      addMessage('bot', botResponse);
    } catch (error) {
      addMessage('bot', "Sorry, I couldn't reach the server.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // 2. Handle Voice Submission
  const handleVoiceUpload = async (audioBlob) => {
    setIsLoading(true);
    addMessage('user', '🎤 (Processing Audio...)');

    try {
      const data = await sendVoiceToBackend(audioBlob);
      
      // Update the "Processing" message with the actual transcription
      setMessages(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = `🎤 ${data.transcription}`;
        return newHistory;
      });

      addMessage('bot', data.reply);

    } catch (error) {
      addMessage('bot', "Error processing voice command.");
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h3>App Assistant</h3>
        <div className="mode-toggle">
          <button 
            className={`tab ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
          >
            ⌨️ Text
          </button>
          <button 
            className={`tab ${inputMode === 'voice' ? 'active' : ''}`}
            onClick={() => setInputMode('voice')}
          >
            🎙️ Voice
          </button>
        </div>
      </div>

      {/* Chat History Area */}
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}
          >
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && <div className="loading-bubble">Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        {inputMode === 'text' ? (
          <form onSubmit={handleTextSubmit} className="text-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about features..."
              className="text-input"
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={isLoading || !inputText}>
              Send
            </button>
          </form>
        ) : (
          <div className="voice-controls">
            {status === 'recording' ? (
              <button onClick={stopRecording} className="stop-btn">
                ⏹️ Stop & Send
              </button>
            ) : (
              <button onClick={startRecording} className="record-btn" disabled={isLoading}>
                🔴 Tap to Record
              </button>
            )}
            <span className="status-text">
              Status: {status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- API HELPERS ---

async function sendTextToBackend(text) {
  const res = await fetch('http://localhost:8000/chat', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ message: text }) 
  });
  const data = await res.json();
  return data.reply;
}

async function sendVoiceToBackend(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');

  const res = await fetch('http://localhost:8000/talk', { 
    method: 'POST', 
    body: formData 
  });
  
  return await res.json();
}

export default ChatAssistant;
