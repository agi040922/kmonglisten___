'use client'

import Image from "next/image";
import { useState, useRef } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    } catch (error) {
      console.error('녹음을 시작할 수 없습니다:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/이음캠페인.png"
          alt="Be:liveU 이음 캠페인 배경"
          fill
          className="object-cover"
          priority
        />
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-lg mx-auto text-center space-y-12 mt-8">
          
          {/* 녹음 파일 소개 */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              마음의전화
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              녹음된 목소리를 들어보세요
            </p>
            <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
              💡 추후 실제 목소리로 대체될 예정입니다
            </div>
          </div>

          {/* 버튼 영역 - 이모티콘 형태로 간소화 */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            
            {/* 녹음 시작/정지 버튼 */}
            {!audioBlob && (
              <div className="flex justify-center items-center space-x-6">
                {!isRecording ? (
                  <>
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={startRecording}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg flex items-center justify-center text-base"
                        title="녹음 시작"
                      >
                        🎙️
                      </button>
                      <span className="text-xs text-gray-600">녹음하기</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={stopRecording}
                        className="w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all duration-200 animate-pulse shadow-lg flex items-center justify-center text-base"
                        title="녹음 정지"
                      >
                        ⏹️
                      </button>
                      <span className="text-xs text-gray-600 animate-pulse">녹음 중...</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 재생 및 전송/다시녹음 버튼 */}
            {audioBlob && (
              <div className="space-y-6">
                {/* 오디오 재생 */}
                <div className="flex justify-center">
                  <audio controls className="w-full max-w-sm rounded-lg">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  </audio>
                </div>
                
                {/* 전송/다시녹음 버튼 */}
                <div className="flex justify-center items-center space-x-6">
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={uploadAudio}
                      disabled={isUploading}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg flex items-center justify-center text-sm"
                      title="전송하기"
                    >
                      {isUploading ? '⏳' : '📤'}
                    </button>
                    <span className="text-xs text-white/90">전송하기</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => setAudioBlob(null)}
                      className="w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg flex items-center justify-center text-sm"
                      title="다시 녹음"
                    >
                      🔄
                    </button>
                    <span className="text-xs text-white/90">다시녹음</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
