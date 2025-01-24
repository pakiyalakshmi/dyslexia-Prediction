# Dyslexia Detection System

This project implements a machine learning-based system for detecting dyslexia using Random Forest algorithm. The system analyzes various behavioral and neural markers to predict the likelihood of dyslexia.

## Features

- Random Forest-based classification
- Interactive web interface using Streamlit
- Feature importance visualization
- Real-time predictions
- High accuracy and interpretability

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Train the model:
```bash
python src/train.py
```

3. Run the application:
```bash
streamlit run src/app.py
```

## Project Structure

- `src/train.py`: Model training script
- `src/app.py`: Streamlit web application
- `data/`: Directory for storing datasets
- `models/`: Directory for storing trained models

## Usage

1. Launch the application using `streamlit run src/app.py`
2. Input the required measurements:
   - Reading Speed
   - Fixation Duration
   - Saccade Length
   - Phoneme Errors
   - Spelling Errors
   - Comprehension Score
3. Click "Detect Dyslexia" to get the prediction

## Model Details

The system uses a Random Forest classifier trained on the following features:
- Reading Speed (words/minute)
- Fixation Duration (milliseconds)
- Saccade Length (pixels)
- Phoneme Errors
- Spelling Errors
- Comprehension Score