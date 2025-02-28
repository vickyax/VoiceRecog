import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, Upload, Search, AlertCircle, User } from 'lucide-react';
import ip from "../../serve.json";
const Recognize = () => {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file);
        setAudioBlob(null);
        setAudioURL(URL.createObjectURL(file));
        setResult(null);
        setError('');
      } else {
        setError('Please upload an audio file.');
      }
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
              <User className="h-5 w-5 text-indigo-600 mr-2" />
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