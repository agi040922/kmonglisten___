# 음성 녹음 기술 심화 가이드

## 📋 목차

1. [Web Audio API 개념](#web-audio-api-개념)
2. [MediaRecorder API 활용](#mediarecorder-api-활용)
3. [오디오 포맷과 압축](#오디오-포맷과-압축)
4. [브라우저 호환성](#브라우저-호환성)
5. [성능 최적화](#성능-최적화)
6. [문제 해결 가이드](#문제-해결-가이드)

---

## 🎵 Web Audio API 개념

### 오디오 컨텍스트와 노드 시스템

Web Audio API는 **노드 기반 오디오 처리 시스템**입니다.

```typescript
// 오디오 컨텍스트 생성
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 실시간 오디오 분석
class AudioAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  
  constructor(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    
    // 분석 설정
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    // 마이크 입력을 분석기에 연결
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
  }
  
  // 실시간 볼륨 레벨 측정
  getVolumeLevel(): number {
    this.analyser.getByteFrequencyData(this.dataArray);
    const sum = this.dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / this.dataArray.length;
    return Math.round((average / 255) * 100);
  }
}
```

---

## 🎙️ MediaRecorder API 활용

### 고급 녹음 설정

```typescript
class AdvancedVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  // 지원되는 MIME 타입 확인
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',    // 최고 압축률
      'audio/webm',                // WebM 컨테이너
      'audio/mp4',                 // MP4 컨테이너
      'audio/wav',                 // 무손실
    ];
    
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
  }
  
  // 최적화된 녹음 시작
  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,        // 48kHz 샘플링
          channelCount: 1,          // 모노 채널
          echoCancellation: true,   // 에코 제거
          noiseSuppression: true,   // 노이즈 제거
          autoGainControl: true,    // 자동 게인 조절
        }
      });
      
      const options = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000, // 128kbps
      };
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.setupEventListeners();
      
      this.audioChunks = [];
      this.mediaRecorder.start(1000); // 1초마다 청크 생성
      
    } catch (error) {
      throw new Error(`녹음 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
  
  private setupEventListeners(): void {
    if (!this.mediaRecorder) return;
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onerror = (event) => {
      console.error('녹음 에러:', event);
    };
  }
  
  // 녹음 중지 및 Blob 반환
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('녹음이 진행 중이지 않습니다.'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder!.mimeType 
        });
        this.cleanup();
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
}
```

### React 훅 통합

```typescript
export function useVoiceRecorder() {
  const [recorder] = useState(() => new AdvancedVoiceRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await recorder.startRecording();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '녹음 시작 실패');
    }
  }, [recorder]);
  
  const stopRecording = useCallback(async () => {
    try {
      const blob = await recorder.stopRecording();
      setAudioBlob(blob);
      setIsRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '녹음 중지 실패');
    }
  }, [recorder]);
  
  return {
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
  };
}
```

---

## 🔧 오디오 포맷과 압축

### 포맷별 특성 비교

| 포맷 | 압축률 | 품질 | 브라우저 지원 | 용도 |
|------|--------|------|---------------|------|
| **WebM (Opus)** | 높음 | 우수 | 모던 브라우저 | **권장** |
| **MP4 (AAC)** | 높음 | 좋음 | 광범위 | 모바일 호환성 |
| **WAV** | 없음 | 최고 | 모든 브라우저 | 고품질 필요시 |

### 동적 포맷 선택

```typescript
class AudioFormatSelector {
  static getBestFormat(purpose: 'streaming' | 'storage' | 'analysis'): string {
    const capabilities = this.getBrowserCapabilities();
    
    switch (purpose) {
      case 'streaming':
        if (capabilities.supportsOpus) {
          return 'audio/webm;codecs=opus';
        }
        return 'audio/webm';
        
      case 'storage':
        if (capabilities.supportsAAC) {
          return 'audio/mp4;codecs=mp4a.40.2';
        }
        return 'audio/webm';
        
      case 'analysis':
        if (capabilities.supportsWAV) {
          return 'audio/wav';
        }
        return 'audio/webm;codecs=opus';
        
      default:
        return 'audio/webm';
    }
  }
  
  private static getBrowserCapabilities() {
    return {
      supportsOpus: MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
      supportsAAC: MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2'),
      supportsWAV: MediaRecorder.isTypeSupported('audio/wav'),
      supportsWebM: MediaRecorder.isTypeSupported('audio/webm'),
    };
  }
}
```

---

## 🌐 브라우저 호환성

### 기능 감지 및 폴백

```typescript
class BrowserCompatibility {
  static checkSupport() {
    return {
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
      mediaRecorder: !!window.MediaRecorder,
      audioContext: !!(window.AudioContext || window.webkitAudioContext),
      formats: this.getSupportedFormats(),
    };
  }
  
  private static getSupportedFormats(): string[] {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
    ];
    
    return formats.filter(format => MediaRecorder.isTypeSupported(format));
  }
  
  // 브라우저별 최적화 설정
  static getBrowserOptimizations() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        preferredFormat: 'audio/webm;codecs=opus',
        maxBitrate: 256000,
        sampleRate: 48000,
      };
    } else if (userAgent.includes('firefox')) {
      return {
        preferredFormat: 'audio/webm',
        maxBitrate: 192000,
        sampleRate: 44100,
      };
    } else if (userAgent.includes('safari')) {
      return {
        preferredFormat: 'audio/mp4',
        maxBitrate: 128000,
        sampleRate: 44100,
      };
    }
    
    return {
      preferredFormat: 'audio/webm',
      maxBitrate: 128000,
      sampleRate: 44100,
    };
  }
}
```

---

## ⚡ 성능 최적화

### 메모리 관리

```typescript
class AudioMemoryManager {
  private static readonly MAX_BUFFER_SIZE = 50 * 1024 * 1024; // 50MB
  private static bufferPool: AudioBuffer[] = [];
  
  static getBuffer(length: number, sampleRate: number): AudioBuffer {
    const existingBuffer = this.bufferPool.find(
      buffer => buffer.length === length && buffer.sampleRate === sampleRate
    );
    
    if (existingBuffer) {
      this.bufferPool = this.bufferPool.filter(b => b !== existingBuffer);
      return existingBuffer;
    }
    
    return new AudioBuffer({
      numberOfChannels: 1,
      length,
      sampleRate,
    });
  }
  
  static returnBuffer(buffer: AudioBuffer): void {
    if (this.getTotalBufferSize() < this.MAX_BUFFER_SIZE) {
      const channelData = buffer.getChannelData(0);
      channelData.fill(0);
      this.bufferPool.push(buffer);
    }
  }
  
  private static getTotalBufferSize(): number {
    return this.bufferPool.reduce((total, buffer) => {
      return total + buffer.length * buffer.numberOfChannels * 4;
    }, 0);
  }
}
```

---

## 🔍 문제 해결 가이드

### 일반적인 문제와 해결책

**1. 마이크 권한 거부**
```typescript
async function handleMicrophonePermission(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error('마이크 사용 권한이 거부되었습니다.');
        case 'NotFoundError':
          throw new Error('마이크를 찾을 수 없습니다.');
        case 'NotReadableError':
          throw new Error('마이크에 접근할 수 없습니다.');
        default:
          throw new Error(`마이크 오류: ${error.message}`);
      }
    }
    throw error;
  }
}
```

**2. 오디오 컨텍스트 자동 재생 정책**
```typescript
class AudioContextManager {
  private static context: AudioContext | null = null;
  
  static async getContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    return this.context;
  }
}
```

**3. 디버깅 도구**
```typescript
class AudioDebugger {
  static logRecorderState(recorder: MediaRecorder): void {
    console.log('MediaRecorder 상태:', {
      state: recorder.state,
      mimeType: recorder.mimeType,
      audioBitsPerSecond: recorder.audioBitsPerSecond,
    });
  }
  
  static analyzeAudioBlob(blob: Blob): void {
    console.log('오디오 Blob 정보:', {
      size: `${(blob.size / 1024).toFixed(2)} KB`,
      type: blob.type,
      duration: '분석 필요',
    });
  }
}
```

---

## 🎯 모범 사례 요약

1. **포맷 선택**: WebM (Opus) 우선, 호환성을 위한 폴백 제공
2. **품질 설정**: 128kbps, 48kHz, 모노 채널로 균형 유지
3. **에러 처리**: 구체적인 에러 메시지와 복구 방안 제공
4. **메모리 관리**: 버퍼 풀링과 적절한 정리로 메모리 누수 방지
5. **사용자 경험**: 실시간 피드백과 직관적인 UI 제공

이 가이드를 통해 안정적이고 효율적인 음성 녹음 기능을 구현할 수 있습니다.
