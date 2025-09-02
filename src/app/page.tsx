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
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* 제목 */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            마음의 전화
          </h1>

          {/* 론칭 안내 메시지 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              론칭 안내
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              안녕하세요, 여러분의 마음을 들어주는 <strong>마음의전화</strong>입니다.
              <br />
              마음의전화는 <strong>00월 00일</strong>부터 진행될 예정이오니
              <br />
              당신의 마음을 들려주세요.
              <br />
              감사합니다.
            </p>
          </div>

          {/* 버튼 영역 */}
          <div className="space-y-6">
            {/* 음성 메시지 녹음 버튼 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🎙️ 음성 메시지 녹음
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                수화기를 들고 녹음 버튼을 클릭하여 당신의 마음을 들려주세요
              </p>
              
              <div className="space-y-4">
                {!isRecording && !audioBlob && (
                  <button
                    onClick={startRecording}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    🔴 녹음 시작
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 animate-pulse shadow-lg"
                  >
                    ⏹️ 녹음 중... (클릭하여 정지)
                  </button>
                )}

                {audioBlob && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <audio controls className="w-full max-w-md">
                        <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                      </audio>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={uploadAudio}
                        disabled={isUploading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                      >
                        {isUploading ? '전송 중...' : '📤 전송하기'}
                      </button>
                      <button
                        onClick={() => setAudioBlob(null)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                      >
                        🔄 다시 녹음
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 운영 방안 안내 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📋 운영 방안
              </h3>
              <div className="text-sm text-gray-700 space-y-2 text-left">
                <p><strong>① 수화기를 들고 녹음버튼 클릭</strong> → 발신자 녹음</p>
                <p><strong>② 녹음파일 확인 후 텍스트 추출</strong> (텍스트 추출시 내용 검열)</p>
                <p><strong>③ 검열된 내용은 무대위 미디어월에 전송</strong>하여 화면 노출</p>
              </div>
            </div>
          </div>

          {/* 관리자 링크 */}
          <div className="pt-8">
            <a
              href="/admin"
              className="inline-block bg-gray-800/80 hover:bg-gray-900/80 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              🔧 관리자 페이지
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
