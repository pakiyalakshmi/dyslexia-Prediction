import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

def load_data(file_path):
    """Load and preprocess the dataset"""
    data = pd.read_csv(file_path)
    return data

def train_model(X, y):
    """Train the Random Forest model"""
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize and train the model
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = rf_model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    
    # Print detailed classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return rf_model, accuracy

def save_model(model, file_path):
    """Save the trained model"""
    joblib.dump(model, file_path)
    print(f"Model saved to {file_path}")

if __name__ == "__main__":
    # Sample dataset structure
    data = {
        'reading_speed': np.random.randint(20, 100, 1000),
        'fixation_duration': np.random.randint(200, 500, 1000),
        'saccade_length': np.random.randint(10, 50, 1000),
        'phoneme_errors': np.random.randint(0, 20, 1000),
        'spelling_errors': np.random.randint(0, 15, 1000),
        'comprehension_score': np.random.randint(40, 100, 1000)
    }
    
    # Create sample dataset
    df = pd.DataFrame(data)
    # Simulate dyslexia diagnosis based on features
    df['dyslexia'] = (df['reading_speed'] < 50) & (df['phoneme_errors'] > 10)
    df['dyslexia'] = df['dyslexia'].astype(int)
    
    # Save sample dataset
    df.to_csv('data/sample_data.csv', index=False)
    
    # Train model
    X = df.drop('dyslexia', axis=1)
    y = df['dyslexia']
    
    model, accuracy = train_model(X, y)
    save_model(model, 'models/dyslexia_model.joblib')