'use client'

import Image from "next/image";
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 시간을 MM:SS 형식으로 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // 타이머 시작
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('녹음을 시작할 수 없습니다:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // 타이머 정리
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('음성 메시지가 성공적으로 전송되었습니다!');
        setAudioBlob(null);
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 음원메시지 남기기 클릭 핸들러
  const handleRecordingAreaClick = () => {
    if (isPlayingIntro || isRecording) return;
    
    setIsPlayingIntro(true);
    const audio = new Audio('/마음의전화2_음성녹음 시.wav');
    introAudioRef.current = audio;
    
    audio.onended = () => {
      setIsPlayingIntro(false);
      // 오디오가 끝나면 자동으로 녹음 시작
      startRecording();
    };
    
    audio.onerror = () => {
      setIsPlayingIntro(false);
      console.error('인트로 오디오 재생 실패');
      // 오디오 재생 실패시에도 녹음 시작
      startRecording();
    };
    
    audio.play().catch(error => {
      console.error('오디오 재생 오류:', error);
      setIsPlayingIntro(false);
      startRecording();
    });
  };

  // SOS마음의 전화 클릭 핸들러
  const handleSOSAreaClick = () => {
    const audio = new Audio('/마음의전화3_마음의전화 소개.wav');
    
    audio.onerror = () => {
      console.error('SOS 오디오 재생 실패');
      alert('오디오 파일을 재생할 수 없습니다.');
    };
    
    audio.play().catch(error => {
      console.error('SOS 오디오 재생 오류:', error);
      alert('오디오 파일을 재생할 수 없습니다.');
    });
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* 메인 컨텐츠 - 이미지와 클릭 영역 */}
      <div className="relative w-full h-full">
        <img 
          src="/최종메인화면.jpg" 
          alt="Be:liveU 메인화면"
          className="w-full h-full object-cover"
        />
        
        {/* 반응형 클릭 가능한 영역들 */}
        {/* 음원메세지 남기기 영역 - 원본 좌표: 523,124,57 */}
        <div 
          className="absolute cursor-pointer"
          style={{
            left: 'calc(78% - 80px)', // 중앙에서 28% 오른쪽으로 이동
            top: 'calc(30% - 60px)',  // 상단 30% 위치
            width: '160px', 
            height: '120px',
            borderRadius: '50%',
            // 개발시 영역 확인용 (나중에 제거 가능)
            // backgroundColor: 'rgba(255, 0, 0, 0.3)'
          }}
          onClick={handleRecordingAreaClick}
          title="음원메세지 남기기"
        />
        
        {/* SOS마음의 전화 영역 - 원본 좌표: 522,269,60 */}
        <div 
          className="absolute cursor-pointer"
          style={{
            left: 'calc(78% - 80px)', // 중앙에서 28% 오른쪽으로 이동
            top: 'calc(75% - 60px)',  // 하단 75% 위치
            width: '160px', 
            height: '120px',
            borderRadius: '50%',
            // 개발시 영역 확인용 (나중에 제거 가능)
            // backgroundColor: 'rgba(0, 0, 255, 0.3)'
          }}
          onClick={handleSOSAreaClick}
          title="SOS마음의 전화"
        />

        {/* 상태 표시 오버레이 */}
        {(isPlayingIntro || isRecording || audioBlob) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md mx-auto">
              {isPlayingIntro && (
                <div className="text-center">
                  <div className="text-2xl mb-4">🔊</div>
                  <p className="text-lg font-medium text-gray-800">안내음성을 재생 중입니다...</p>
                  <p className="text-sm text-gray-600 mt-2">재생이 끝나면 자동으로 녹음이 시작됩니다</p>
                </div>
              )}
              
              {isRecording && !isPlayingIntro && (
                <div className="text-center">
                  <div className="text-2xl mb-4 animate-pulse">🎙️</div>
                  <p className="text-lg font-medium text-gray-800">녹음 중...</p>
                  <div className="text-3xl font-mono font-bold text-red-600 my-4">
                    {formatTime(recordingTime)}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200"
                  >
                    녹음 중지
                  </button>
                </div>
              )}
              
              {audioBlob && !isRecording && !isPlayingIntro && (
                <div className="text-center space-y-4">
                  <div className="text-2xl mb-4">🎵</div>
                  <p className="text-lg font-medium text-gray-800">녹음이 완료되었습니다</p>
                  
                  {/* 오디오 재생 */}
                  <div className="flex justify-center">
                    <audio controls className="w-full max-w-sm rounded-lg">
                      <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                    </audio>
                  </div>
                  
                  {/* 전송/다시녹음 버튼 */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={uploadAudio}
                      disabled={isUploading}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-all duration-200"
                    >
                      {isUploading ? '전송 중...' : '전송하기'}
                    </button>
                    <button
                      onClick={() => setAudioBlob(null)}
                      className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all duration-200"
                    >
                      다시 녹음
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
