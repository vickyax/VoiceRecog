//Register.tsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, Upload, Save, AlertCircle } from 'lucide-react';
import ip from "../../serve.json";
const Register = () => {
  const [speakerName, setSpeakerName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
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
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage({
        text: 'Error accessing microphone. Please check permissions.',
        type: 'error'
      });
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
      } else {
        setMessage({
          text: 'Please upload an audio file.',
          type: 'error'
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!speakerName.trim()) {
      setMessage({
        text: 'Please enter a speaker name.',
        type: 'error'
      });
      return;
    }
    
    if (!audioBlob && !uploadedFile) {
      setMessage({
        text: 'Please record or upload an audio sample.',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      const formData = new FormData();
      formData.append('name', speakerName);
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.wav');
      } else if (uploadedFile) {
        formData.append('audio', uploadedFile);
      }
      
      const response = await axios.post(`${ip.ip}/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({
        text: `Speaker "${speakerName}" registered successfully!`,
        type: 'success'
      });
      
      // Reset form
      setSpeakerName('');
      setAudioBlob(null);
      setAudioURL(null);
      setUploadedFile(null);
      
    } catch (error) {
      console.error('Error registering speaker:', error);
      setMessage({
        text: 'Error registering speaker. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Register a New Speaker</h1>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{message.text}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="speakerName" className="block text-sm font-medium text-gray-700 mb-2">
              Speaker Name
            </label>
            <input
              type="text"
              id="speakerName"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter speaker name"
              disabled={isSubmitting}
            />
          </div>
          
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
                disabled={isSubmitting || (!!uploadedFile && !isRecording)}
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
                  disabled={isSubmitting || isRecording}
                />
                <label
                  htmlFor="audioFile"
                  className={`flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer ${
                    (isRecording || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''
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
            type="submit"
            className={`w-full flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting || isRecording || (!audioBlob && !uploadedFile)}
          >
            <Save className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Registering...' : 'Register Speaker'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;