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
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);


  // 16:10 비율과 화면 크기에 최적화된 텍스트 크기 결정
  const getTextSizeClass = (text: string) => {
    const length = text.length;
    const aspectRatio = screenWidth / screenHeight;
    const isWideScreen = aspectRatio >= 1.5; // 16:10 = 1.6, 16:9 = 1.78
    
    // 넓은 화면에서는 더 큰 텍스트 사용
    const sizeMultiplier = isWideScreen ? 1 : 0.8;
    
    if (length <= 8) {
      return isWideScreen 
        ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[12rem]' 
        : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl';
    } else if (length <= 15) {
      return isWideScreen
        ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl'
        : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl';
    } else if (length <= 25) {
      return isWideScreen
        ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl'
        : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl';
    } else if (length <= 40) {
      return isWideScreen
        ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl'
        : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl';
    } else if (length <= 60) {
      return isWideScreen
        ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl'
        : 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl';
    } else {
      return isWideScreen
        ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl'
        : 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl';
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

  // 화면 크기 추적
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    // 초기 화면 크기 설정
    updateScreenSize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* 배경 이미지 - 16:10 비율 최적화 */}
      {imageLoaded && (
        <div 
          className="absolute inset-0 w-full h-full bg-black"
          style={{
            backgroundImage: `url('/최종송출화면.png')`,
            backgroundSize: 'contain', // 이미지 전체가 보이도록 contain 사용
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
          }}
        />
      )}
      
      {/* 폴백 배경 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-black" />
      )}

      {/* 컨텐츠 오버레이 - 메시지 표시 영역 */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="w-full max-w-[95vw] text-center overflow-hidden">
          {currentMessage ? (
            <div className="space-y-6">
              {/* 메인 메시지 */}
              <h1 className={`${getTextSizeClass(currentMessage)} font-bold text-gray-900 leading-tight break-keep drop-shadow-lg transition-all duration-500 ease-in-out transform w-full overflow-hidden`}
                  style={{ 
                    textShadow: '2px 2px 4px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.5)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
                    wordBreak: 'keep-all',
                    lineHeight: '1.1',
                    maxWidth: '100%',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
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
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold mb-6 drop-shadow-lg w-full overflow-hidden"
                  style={{ 
                    textShadow: '2px 2px 4px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.5)',
                    wordBreak: 'keep-all',
                    lineHeight: '1.1',
                    maxWidth: '100%',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}>
                마음의 전화
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl text-gray-700 drop-shadow-lg w-full overflow-hidden"
                 style={{ 
                   textShadow: '1px 1px 2px rgba(255,255,255,0.7)',
                   wordBreak: 'keep-all',
                   maxWidth: '100%'
                 }}>
                표시할 메시지가 없습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
