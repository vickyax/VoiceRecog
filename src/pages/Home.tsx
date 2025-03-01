import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Users, ArrowRight } from 'lucide-react';
import ip from "../../serve.json";
const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Speaker Recognition System</h1>
        <p className="text-xl text-gray-600">
          Identify speakers by their voice using advanced machine learning
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Register a Speaker</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Add a new speaker to the system by recording voice samples or uploading audio files.
          </p>
          <Link 
            to="/register" 
            className="flex items-center text-indigo-600 font-medium hover:text-indigo-800"
          >
            Register now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center mb-4">
            <Mic className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Recognize a Speaker</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Identify a speaker by recording their voice or uploading an audio sample.
          </p>
          <Link 
            to="/recognize" 
            className="flex items-center text-indigo-600 font-medium hover:text-indigo-800"
          >
            Start recognition
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold mr-3">
              1
            </div>
            <p className="text-gray-700">
              <strong>Register speakers</strong> by providing voice samples through recording or file upload.
            </p>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold mr-3">
              2
            </div>
            <p className="text-gray-700">
              <strong>Our ML model</strong> extracts unique voice features and creates a voice profile.
            </p>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold mr-3">
              3
            </div>
            <p className="text-gray-700">
              <strong>Identify speakers</strong> by comparing new voice samples against registered profiles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;