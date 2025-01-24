import streamlit as st
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

def load_model(model_path):
    """Load the trained model"""
    return joblib.load(model_path)

def predict_dyslexia(model, features):
    """Make prediction using the trained model"""
    prediction = model.predict([features])
    probability = model.predict_proba([features])
    return prediction[0], probability[0]

def main():
    st.title("Dyslexia Detection System")
    st.write("Enter the following measurements to detect dyslexia:")
    
    # Input features
    reading_speed = st.slider("Reading Speed (words/minute)", 20, 100, 60)
    fixation_duration = st.slider("Fixation Duration (milliseconds)", 200, 500, 350)
    saccade_length = st.slider("Saccade Length (pixels)", 10, 50, 30)
    phoneme_errors = st.slider("Phoneme Errors", 0, 20, 10)
    spelling_errors = st.slider("Spelling Errors", 0, 15, 7)
    comprehension_score = st.slider("Comprehension Score", 40, 100, 70)
    
    # Create feature array
    features = [
        reading_speed,
        fixation_duration,
        saccade_length,
        phoneme_errors,
        spelling_errors,
        comprehension_score
    ]
    
    if st.button("Detect Dyslexia"):
        try:
            model = load_model('models/dyslexia_model.joblib')
            prediction, probability = predict_dyslexia(model, features)
            
            # Display results
            st.subheader("Results:")
            if prediction == 1:
                st.error("Dyslexia Detected")
                st.write(f"Confidence: {probability[1]*100:.2f}%")
            else:
                st.success("No Dyslexia Detected")
                st.write(f"Confidence: {probability[0]*100:.2f}%")
            
            # Feature importance visualization
            st.subheader("Feature Importance:")
            feature_importance = pd.DataFrame({
                'feature': ['Reading Speed', 'Fixation Duration', 'Saccade Length', 
                           'Phoneme Errors', 'Spelling Errors', 'Comprehension Score'],
                'importance': model.feature_importances_
            })
            
            fig, ax = plt.subplots()
            sns.barplot(data=feature_importance.sort_values('importance', ascending=False),
                       x='importance', y='feature')
            plt.title('Feature Importance in Dyslexia Detection')
            st.pyplot(fig)
            
        except Exception as e:
            st.error(f"Error: {str(e)}")

if __name__ == "__main__":
    main()