# Speaker Recognition Web App

A web application for speaker recognition with both recording and file upload capabilities, along with a system for registering new speakers. The app uses a Python backend with machine learning for speaker recognition and a React frontend.

## Features

- Register new speakers with voice samples
- Record audio directly in the browser
- Upload audio files for registration and recognition
- Identify speakers with confidence scores
- Responsive UI with Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Python, Flask
- **ML**: Librosa for audio processing, scikit-learn for GMM models

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- pip

### Installation

1. Clone the repository

2. Install frontend dependencies:
```
npm install
```

3. Install backend dependencies:
```
pip install -r requirements.txt
```

### Running the Application

1. Start the backend server:
```
npm run server
```

2. In a separate terminal, start the frontend development server:
```
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## How It Works

1. **Speaker Registration**:
   - Users provide their name and a voice sample
   - The system extracts MFCC features from the audio
   - A Gaussian Mixture Model (GMM) is trained on these features
   - The model is saved for future recognition

2. **Speaker Recognition**:
   - Users provide a voice sample
   - The system extracts features from the sample
   - The features are compared against all registered speaker models
   - The system identifies the most likely speaker with a confidence score

## Project Structure

- `/src`: Frontend React code
  - `/components`: Reusable UI components
  - `/pages`: Main application pages
- `/server`: Python backend
  - `app.py`: Flask server with ML integration
  - `/models`: Saved speaker models
  - `/uploads`: Temporary storage for audio files