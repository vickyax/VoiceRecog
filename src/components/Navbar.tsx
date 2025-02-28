import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Users, Zap } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Mic className="h-6 w-6" />
            <span className="font-bold text-xl">VoiceID</span>
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-700 transition">
              <Zap className="h-5 w-5 mr-1" />
              <span>Home</span>
            </Link>
            <Link to="/register" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-700 transition">
              <Users className="h-5 w-5 mr-1" />
              <span>Register</span>
            </Link>
            <Link to="/recognize" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-700 transition">
              <Mic className="h-5 w-5 mr-1" />
              <span>Recognize</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;