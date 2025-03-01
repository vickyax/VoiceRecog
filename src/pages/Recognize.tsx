// Recognize.tsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Upload,  Search, AlertCircle, User } from 'lucide-react';
import ip from "../../serve.json";

const Recognize = () => {
  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const TARGET_SAMPLE_RATE = 16000;
    const offlineContext = new OfflineAudioContext(
      1,
      originalBuffer.duration * TARGET_SAMPLE_RATE,
      TARGET_SAMPLE_RATE
    );

    const source = offlineContext.createBufferSource();
    source.buffer = originalBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const audioBuffer = await offlineContext.startRendering();
    const wavHeader = createWaveHeader(audioBuffer.length, 1, TARGET_SAMPLE_RATE, 16);

    const wavData = new Uint8Array(wavHeader.length + audioBuffer.length * 2);
    wavData.set(wavHeader, 0);

    const pcmData = new Int16Array(audioBuffer.getChannelData(0).map(n => n * 32767));
    wavData.set(new Uint8Array(pcmData.buffer), wavHeader.length);

    return new Blob([wavData], { type: 'audio/wav' });
  };

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ speaker: string; confidence: number } | null>(null);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Canvas and audio analysis
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();

  const setupAudioContext = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(249, 250, 251)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(79, 70, 229)';
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: false
        }
      });

      setupAudioContext(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm; codecs=opus'
          : 'audio/wav'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const wavBlob = await convertToWav(event.data);
          audioChunksRef.current = [wavBlob];
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
        setUploadedFile(null);
        setResult(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone. Please check permissions.');
    }
  };

  // WAV header generator
  const createWaveHeader = (length: number, channels: number, sampleRate: number, bitsPerSample: number) => {
    const header = new Uint8Array(44);
    const view = new DataView(header.buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, 36 + length * channels * (bitsPerSample / 8), true);
    // WAVE identifier
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, channels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate
    view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
    // Block align
    view.setUint16(32, channels * (bitsPerSample / 8), true);
    // Bits per sample
    view.setUint16(34, bitsPerSample, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, length * channels * (bitsPerSample / 8), true);

    return header;
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onloadend = async () => {
        try {
          const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
          const wavBlob = await convertToWav(blob);
          setUploadedFile(new File([wavBlob], 'converted.wav', { type: 'audio/wav' }));
          setAudioBlob(wavBlob);
          setAudioURL(URL.createObjectURL(wavBlob));
        } catch (error) {
          setError('Please upload a valid audio file.');
        }
      };
    }
  };

  const handleRecognize = async () => {
    if (!audioBlob && !uploadedFile) {
      setError('Please record or upload an audio sample.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();

      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.wav');
      } else if (uploadedFile) {
        formData.append('audio', uploadedFile);
      }

      const response = await axios.post(`${ip.ip}/recognize`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult({
        speaker: response.data.speaker,
        confidence: response.data.confidence
      });

    } catch (error) {
      console.error('Error recognizing speaker:', error);
      setError('Error recognizing speaker. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Recognize Speaker</h1>

        {error && (
          <div className="p-4 mb-6 rounded-md bg-red-50 text-red-700">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="block text-sm font-medium text-gray-700 mb-2">Voice Sample</p>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center justify-center px-4 py-2 rounded-md ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              disabled={isProcessing || (!!uploadedFile && !isRecording)}
            >
              <Mic className="h-5 w-5 mr-2" />
              {isRecording ? `Stop (${formatTime(recordingTime)})` : 'Record Audio'}
            </button>

            <div className="relative">
              <input
                type="file"
                id="audioFile"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing || isRecording}
              />
              <label
                htmlFor="audioFile"
                className={`flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer ${
                  (isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Audio
              </label>
            </div>
          </div>

          {audioURL && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {uploadedFile ? `File: ${uploadedFile.name}` : 'Recording Preview:'}
              </p>
              <audio src={audioURL} controls className="w-full" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="w-full h-32 border border-gray-300 rounded-md mb-6"></canvas>

        <button
          onClick={handleRecognize}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 ${
            isProcessing || isRecording || (!audioBlob && !uploadedFile) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isProcessing || isRecording || (!audioBlob && !uploadedFile)}
        >
          <Search className="h-5 w-5 mr-2" />
          {isProcessing ? 'Processing...' : 'Recognize Speaker'}
        </button>

        {result && (
          <div className="mt-6 p-5 border border-indigo-100 rounded-md bg-indigo-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Recognition Result</h3>
            <div className="flex items-center mb-2">
              <User  className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium">Identified Speaker:</span>
              <span className="ml-2 text-indigo-700 font-bold">{result.speaker}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Confidence:</span>
              <span className={`ml-2 font-bold ${getConfidenceColor(result.confidence)}`}>
                {result.confidence.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recognize;