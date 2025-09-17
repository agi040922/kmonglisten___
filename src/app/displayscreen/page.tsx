'use client'

import { useState, useEffect } from 'react';

interface DisplayMessage {
  id: number;
  message_text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function DisplayScreen() {
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);


  // 글자 수에 따른 텍스트 크기 결정
  const getTextSizeClass = (text: string) => {
    const length = text.length;
    
    if (length <= 10) {
      return 'text-3xl md:text-5xl lg:text-6xl'; // 짧은 텍스트 - 큰 크기
    } else if (length <= 20) {
      return 'text-2xl md:text-4xl lg:text-5xl'; // 중간 텍스트 - 중간 크기
    } else if (length <= 40) {
      return 'text-xl md:text-3xl lg:text-4xl'; // 긴 텍스트 - 작은 크기
    } else {
      return 'text-lg md:text-2xl lg:text-3xl'; // 매우 긴 텍스트 - 매우 작은 크기
    }
  };

  // 전광판 메시지 불러오기
  const fetchDisplayMessages = async (isInitialLoad = false) => {
    try {
      const response = await fetch('/api/display/messages');
      const data = await response.json();
      
      if (response.ok && data.messages) {
        const activeMessages = data.messages.filter((msg: DisplayMessage) => msg.is_active);
        setMessages(activeMessages);
        
        if (activeMessages.length > 0) {
          setCurrentMessage(activeMessages[0].message_text);
        }
        
        // 초기 로딩 시에만 페이드 인 효과 적용
        if (isInitialLoad) {
          setTimeout(() => {
            setIsVisible(true);
          }, 100);
        }
      }
    } catch (error) {
      console.error('메시지 로딩 오류:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // 메시지 순환 표시 (페이드 효과 포함)
  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        // 페이드 아웃
        setIsVisible(false);
        
        // 500ms 후 텍스트 변경 및 페이드 인
        setTimeout(() => {
          setCurrentIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % messages.length;
            setCurrentMessage(messages[nextIndex].message_text);
            return nextIndex;
          });
          
          // 텍스트 변경 후 페이드 인
          setTimeout(() => {
            setIsVisible(true);
          }, 50); // 약간의 지연으로 자연스러운 효과
        }, 500); // 페이드 아웃 완료 후 텍스트 변경
      }, 5000); // 5초마다 메시지 변경

      return () => clearInterval(interval);
    }
  }, [messages]);

  // 컴포넌트 마운트 시 메시지 로드
  useEffect(() => {
    // 초기 로딩
    fetchDisplayMessages(true);
    
    // 배경 이미지 로드 확인
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      console.error('배경 이미지 로드 실패');
      setImageLoaded(false);
    };
    img.src = '/최종송출화면.png';
    
    // 30초마다 새로운 메시지 확인 (초기 로딩이 아님)
    const refreshInterval = setInterval(() => fetchDisplayMessages(false), 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen relative flex items-center justify-center ${
        imageLoaded ? '' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}
      style={imageLoaded ? {
        backgroundImage: `url('/최종송출화면.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}}
    >
      {/* 메시지 표시 영역 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8">
        <div className="p-12 text-center">
          {currentMessage ? (
            <div className="space-y-6">
              {/* 메인 메시지 */}
              <h1 className={`${getTextSizeClass(currentMessage)} font-bold text-gray-900 leading-tight break-keep drop-shadow-lg transition-all duration-500 ease-in-out transform`}
                  style={{ 
                    textShadow: '2px 2px 4px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.5)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'
                  }}>
                {currentMessage}
              </h1>
              
              {/* 메시지 인디케이터 */}
              {/* {messages.length > 1 && (
                <div className="flex justify-center space-x-2 mt-8">
                  {messages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${
                        index === currentIndex 
                          ? 'bg-gray-800 shadow-gray-800/50' 
                          : 'bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )} */}
              
              {/* 하단 정보 */}
              {/* <div className="text-gray-800 text-lg mt-8 drop-shadow-lg">
                <p className="font-semibold" 
                   style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.7)' }}>
                  마음의 전화
                </p>
                <p className="text-sm mt-2 text-gray-700"
                   style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.7)' }}>
                  {messages.length > 0 && `${currentIndex + 1} / ${messages.length}`}
                </p>
              </div> */}
            </div>
          ) : (
            <div className="text-gray-900 transition-all duration-500 ease-in-out transform"
                 style={{ 
                   opacity: isVisible ? 1 : 0,
                   transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'
                 }}>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg"
                  style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.5)' }}>
                마음의 전화
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-700 drop-shadow-lg"
                 style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.7)' }}>
                표시할 메시지가 없습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
