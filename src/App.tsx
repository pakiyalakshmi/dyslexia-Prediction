import React, { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Brain, Upload, FileSpreadsheet, UserSquare2, AlertTriangle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement
);

interface FormDataType {
  readingSpeed: number;
  fixationDuration: number;
  saccadeLength: number;
  phonemeErrors: number;
  spellingErrors: number;
  comprehensionScore: number;
}

const initialFormData: FormDataType = {
  readingSpeed: 60,
  fixationDuration: 350,
  saccadeLength: 30,
  phonemeErrors: 10,
  spellingErrors: 7,
  comprehensionScore: 70
};

function App() {
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('input');
  const [inputMethod, setInputMethod] = useState<'manual' | 'csv'>('manual');
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvError(null);

    if (file) {
      try {
        const text = await file.text();
        const lines = text.trim().split('\n');
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain a header row and at least one data row');
        }

        const header = lines[0].toLowerCase().split(',');
        const data = lines[1].split(',');

        const expectedHeaders = [
          'reading speed',
          'fixation duration',
          'saccade length',
          'phoneme errors',
          'spelling errors',
          'comprehension score'
        ];

        // Validate headers
        const isValidFormat = expectedHeaders.every(h => 
          header.some(csvHeader => csvHeader.trim() === h)
        );

        if (!isValidFormat) {
          throw new Error('Invalid CSV format. Please ensure the headers match the required format.');
        }

        // Map CSV data to form data
        const newFormData = {
          readingSpeed: Number(data[header.indexOf('reading speed')]) || initialFormData.readingSpeed,
          fixationDuration: Number(data[header.indexOf('fixation duration')]) || initialFormData.fixationDuration,
          saccadeLength: Number(data[header.indexOf('saccade length')]) || initialFormData.saccadeLength,
          phonemeErrors: Number(data[header.indexOf('phoneme errors')]) || initialFormData.phonemeErrors,
          spellingErrors: Number(data[header.indexOf('spelling errors')]) || initialFormData.spellingErrors,
          comprehensionScore: Number(data[header.indexOf('comprehension score')]) || initialFormData.comprehensionScore
        };

        // Validate numbers
        Object.entries(newFormData).forEach(([key, value]) => {
          if (isNaN(value)) {
            throw new Error(`Invalid number in ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          }
        });

        setFormData(newFormData);
        // Automatically analyze after successful CSV upload
        const predictionResult = await analyzeData(newFormData);
        setResult(predictionResult);
        setActiveTab('results');
      } catch (error) {
        setCsvError(error instanceof Error ? error.message : 'Error processing CSV file');
      }
    }
  };

  const analyzeData = useCallback(async (dataToAnalyze: FormDataType = formData) => {
    const features = [
      dataToAnalyze.readingSpeed,
      dataToAnalyze.fixationDuration,
      dataToAnalyze.saccadeLength,
      dataToAnalyze.phonemeErrors,
      dataToAnalyze.spellingErrors,
      dataToAnalyze.comprehensionScore
    ];

    let riskScore = 0;
    const weights = [0.25, 0.15, 0.15, 0.20, 0.15, 0.10];
    
    const thresholds = {
      readingSpeed: { low: 50, high: 80 },
      fixationDuration: { low: 300, high: 400 },
      saccadeLength: { low: 20, high: 35 },
      phonemeErrors: { low: 8, high: 12 },
      spellingErrors: { low: 5, high: 10 },
      comprehensionScore: { low: 60, high: 80 }
    };

    features.forEach((value, index) => {
      const weight = weights[index];
      let score = 0;
      
      switch(index) {
        case 0:
          score = value < thresholds.readingSpeed.low ? 2 : value < thresholds.readingSpeed.high ? 1 : 0;
          break;
        case 1:
          score = value > thresholds.fixationDuration.high ? 2 : value > thresholds.fixationDuration.low ? 1 : 0;
          break;
        case 2:
          score = value < thresholds.saccadeLength.low ? 2 : value < thresholds.saccadeLength.high ? 1 : 0;
          break;
        case 3:
          score = value > thresholds.phonemeErrors.high ? 2 : value > thresholds.phonemeErrors.low ? 1 : 0;
          break;
        case 4:
          score = value > thresholds.spellingErrors.high ? 2 : value > thresholds.spellingErrors.low ? 1 : 0;
          break;
        case 5:
          score = value < thresholds.comprehensionScore.low ? 2 : value < thresholds.comprehensionScore.high ? 1 : 0;
          break;
      }
      
      riskScore += score * weight;
    });

    const normalizedScore = (riskScore / 2) * 10;

    return {
      prediction: normalizedScore >= 5 ? 1 : 0,
      riskScore: normalizedScore,
      confidence: (1 - Math.abs(5 - normalizedScore) / 5) * 100,
      details: {
        readingSpeedRisk: features[0] < thresholds.readingSpeed.low ? 'High' : features[0] < thresholds.readingSpeed.high ? 'Medium' : 'Low',
        fixationRisk: features[1] > thresholds.fixationDuration.high ? 'High' : features[1] > thresholds.fixationDuration.low ? 'Medium' : 'Low',
        saccadeRisk: features[2] < thresholds.saccadeLength.low ? 'High' : features[2] < thresholds.saccadeLength.high ? 'Medium' : 'Low',
        phonemeRisk: features[3] > thresholds.phonemeErrors.high ? 'High' : features[3] > thresholds.phonemeErrors.low ? 'Medium' : 'Low',
        spellingRisk: features[4] > thresholds.spellingErrors.high ? 'High' : features[4] > thresholds.spellingErrors.low ? 'Medium' : 'Low',
        comprehensionRisk: features[5] < thresholds.comprehensionScore.low ? 'High' : features[5] < thresholds.comprehensionScore.high ? 'Medium' : 'Low'
      }
    };
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const predictionResult = await analyzeData();
    setResult(predictionResult);
    setActiveTab('results');
  };

  const barChartData = {
    labels: ['Reading Speed', 'Fixation Duration', 'Saccade Length', 'Phoneme Errors', 'Spelling Errors', 'Comprehension'],
    datasets: [
      {
        label: 'Current Values',
        data: Object.values(formData),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  const radarChartData = {
    labels: ['Reading Speed', 'Fixation Duration', 'Saccade Length', 'Phoneme Errors', 'Spelling Errors', 'Comprehension'],
    datasets: [
      {
        label: 'Risk Profile',
        data: result ? Object.values(result.details).map(risk => risk === 'High' ? 3 : risk === 'Medium' ? 2 : 1) : [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      }
    ]
  };

  const doughnutChartData = {
    labels: ['Risk Score', 'Safe Zone'],
    datasets: [
      {
        data: result ? [result.riskScore, 10 - result.riskScore] : [0, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(75, 192, 192, 0.5)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <Brain className="w-10 h-10 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-blue-600">Dyslexia Detection System</h1>
            </div>
            
            <div className="flex mb-8 border-b">
              <button
                className={`flex items-center px-6 py-3 ${activeTab === 'input' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('input')}
              >
                <UserSquare2 className="w-5 h-5 mr-2" />
                Input Data
              </button>
              <button
                className={`flex items-center px-6 py-3 ${activeTab === 'results' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('results')}
                disabled={!result}
              >
                <Brain className="w-5 h-5 mr-2" />
                Results
              </button>
            </div>

            {activeTab === 'input' && (
              <div className="space-y-6">
                <div className="flex space-x-4 mb-6">
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center ${
                      inputMethod === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setInputMethod('manual')}
                  >
                    <UserSquare2 className="w-5 h-5 mr-2" />
                    Manual Input
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center ${
                      inputMethod === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setInputMethod('csv')}
                  >
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                    CSV Upload
                  </button>
                </div>

                {inputMethod === 'csv' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <label className="block">
                      <span className="sr-only">Choose CSV file</span>
                      <input
                        type="file"
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        accept=".csv"
                        onChange={handleCSVUpload}
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">Upload a CSV file with the required measurements</p>
                    {csvError && (
                      <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {csvError}
                      </div>
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                      <p className="font-medium">Required CSV format:</p>
                      <code className="block bg-gray-50 p-2 mt-2 rounded text-left">
                        reading speed,fixation duration,saccade length,phoneme errors,spelling errors,comprehension score<br/>
                        60,350,30,10,7,70
                      </code>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {Object.entries(formData).map(([key, value]) => (
                      <div key={key} className="relative">
                        <label className="block text-sm font-medium text-gray-700">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            name={key}
                            value={value}
                            onChange={handleInputChange}
                            className="flex-grow h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                            min={0}
                            max={key === 'comprehensionScore' ? 100 : 500}
                          />
                          <span className="w-12 text-sm text-gray-500">{value}</span>
                        </div>
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Analyze Data
                    </button>
                  </form>
                )}

                {inputMethod === 'manual' && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Current Measurements</h2>
                    <Bar data={barChartData} options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: 'Measurement Values'
                        }
                      }
                    }} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && result && (
              <div className="space-y-8">
                <div className={`p-6 rounded-lg ${result.prediction === 1 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {result.prediction === 1 ? 'Dyslexia Risk Detected' : 'Low Dyslexia Risk'}
                    </h2>
                    <AlertTriangle className={`w-8 h-8 ${result.prediction === 1 ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold mb-4">Risk Analysis</h3>
                      <div className="h-64">
                        <Radar data={radarChartData} options={{
                          scales: {
                            r: {
                              beginAtZero: true,
                              max: 3,
                              ticks: {
                                stepSize: 1
                              }
                            }
                          }
                        }} />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-4">Overall Risk Score</h3>
                      <div className="h-64">
                        <Doughnut data={doughnutChartData} options={{
                          circumference: 180,
                          rotation: -90,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }} />
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-2xl font-bold">{result.riskScore.toFixed(1)}/10</p>
                        <p className="text-sm text-gray-500">Risk Score</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Detailed Analysis:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(result.details).map(([key, value]) => (
                        <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                          <span className="block text-sm text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-sm ${
                            value === 'High' ? 'bg-red-100 text-red-800' : 
                            value === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {result.prediction === 1 && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Recommendations:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-blue-600 mb-2">Immediate Actions</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>Schedule a professional assessment</li>
                          <li>Discuss concerns with educators</li>
                          <li>Keep track of reading difficulties</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-blue-600 mb-2">Long-term Strategies</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>Implement structured reading programs</li>
                          <li>Use multi-sensory learning approaches</li>
                          <li>Regular phonemic awareness exercises</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;