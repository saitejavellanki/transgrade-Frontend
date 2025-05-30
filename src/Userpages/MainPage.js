import React, { useState } from 'react';
import { Upload, FileText, Image, Eye, Download, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import '../csstemplates/SecondMain.css';

const Main = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState({
    images: [],
    ocrResults: [],
    restructuredOutput: null
  });
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5015'; // Update with your Flask server URL

  const steps = [
    { name: 'Upload PDF', icon: Upload },
    { name: 'Convert to Images', icon: Image },
    { name: 'Extract Text (OCR)', icon: FileText },
    { name: 'Restructure Data', icon: RefreshCw },
    { name: 'View Results', icon: Eye }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
      setResults({ images: [], ocrResults: [], restructuredOutput: null });
      setCurrentStep(0);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const convertPdfToImages = async () => {
    if (!pdfFile) return;

    setProcessing(true);
    setCurrentStep(1);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await fetch(`${API_BASE}/convert-pdf`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResults(prev => ({ ...prev, images: data.images }));
        setCurrentStep(2);
        // Automatically proceed to OCR
        await extractTextFromImages(data.images);
      } else {
        setError(data.error || 'Failed to convert PDF');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const extractTextFromImages = async (imageData) => {
    setCurrentStep(2);
    const ocrResults = [];

    try {
      for (let i = 0; i < imageData.length; i++) {
        const response = await fetch(`${API_BASE}/extract-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_data: imageData[i].data
          })
        });

        if (response.ok) {
          const result = await response.json();
          ocrResults.push({
            page: i + 1,
            imagePath: imageData[i].path,
            filename: imageData[i].filename,
            data: result
          });
        } else {
          const errorData = await response.json();
          throw new Error(`OCR failed for page ${i + 1}: ${errorData.error || 'Unknown error'}`);
        }
      }

      setResults(prev => ({ ...prev, ocrResults }));
      setCurrentStep(3);
      
      // Automatically proceed to restructuring
      await restructureData(ocrResults);
      
    } catch (err) {
      setError('OCR processing failed: ' + err.message);
    }
  };

  const restructureData = async (ocrResults) => {
    setCurrentStep(3);
    setProcessing(true);

    try {
      // Create FormData to send JSON files
      const formData = new FormData();
      
      // Convert OCR results to JSON and create Blob for key file
      const keyJsonBlob = new Blob([JSON.stringify(ocrResults, null, 2)], {
        type: 'application/json'
      });
      
      // For now, using the same data for both key and student
      // You might want to modify this based on your specific requirements
      const studentJsonBlob = new Blob([JSON.stringify(ocrResults, null, 2)], {
        type: 'application/json'
      });
      
      formData.append('key', keyJsonBlob, 'key.json');
      formData.append('student', studentJsonBlob, 'student.json');

      const response = await fetch(`${API_BASE}/restructure-answers`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const restructuredText = await response.text();
        setResults(prev => ({ ...prev, restructuredOutput: restructuredText }));
        setCurrentStep(4);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to restructure data');
      }
    } catch (err) {
      setError('Restructuring failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadJSON = () => {
    if (results.ocrResults.length > 0) {
      const dataStr = JSON.stringify(results.ocrResults, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ocr_results_${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const downloadRestructuredOutput = () => {
    if (results.restructuredOutput) {
      const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(results.restructuredOutput);
      
      const exportFileDefaultName = `restructured_output_${Date.now()}.txt`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const resetProcess = () => {
    setPdfFile(null);
    setResults({ images: [], ocrResults: [], restructuredOutput: null });
    setCurrentStep(0);
    setError('');
    setProcessing(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="title">PDF OCR Processor</h1>
          <p className="subtitle">Convert PDF documents to text using advanced OCR technology with automatic restructuring</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Progress Steps */}
          <div className="progress-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              
              return (
                <div key={index} className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="step-icon">
                    {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
                  </div>
                  <span className="step-name">{step.name}</span>
                </div>
              );
            })}
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Section */}
          {currentStep === 0 && (
            <div className="upload-section">
              <div className="upload-card">
                <Upload size={48} className="upload-icon" />
                <h2>Upload PDF Document</h2>
                <p>Select a PDF file to begin the OCR and restructuring process</p>
                
                <label className="file-input-label">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  Choose PDF File
                </label>
                
                {pdfFile && (
                  <div className="file-info">
                    <FileText size={20} />
                    <span>{pdfFile.name}</span>
                    <span className="file-size">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
              
              {pdfFile && (
                <button className="process-btn" onClick={convertPdfToImages}>
                  Start Processing
                </button>
              )}
            </div>
          )}

          {/* Processing Section */}
          {processing && (
            <div className="processing-section">
              <div className="processing-card">
                <Loader2 size={48} className="spinner" />
                <h2>Processing Your Document</h2>
                <p>
                  {currentStep === 1 && "Converting PDF to images..."}
                  {currentStep === 2 && "Extracting text using OCR..."}
                  {currentStep === 3 && "Restructuring data..."}
                </p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {currentStep === 4 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Processing Complete</h2>
                <div className="results-actions">
                  <button className="download-btn" onClick={downloadJSON}>
                    <Download size={20} />
                    Download OCR JSON
                  </button>
                  <button className="download-btn" onClick={downloadRestructuredOutput}>
                    <Download size={20} />
                    Download Restructured Output
                  </button>
                  <button className="reset-btn" onClick={resetProcess}>
                    Process Another PDF
                  </button>
                </div>
              </div>

              {/* OCR Results Summary */}
              <div className="results-summary">
                <h3>OCR Processing Summary</h3>
                <p>Successfully processed {results.ocrResults.length} pages</p>
              </div>

              {/* Restructured Output */}
              {results.restructuredOutput && (
                <div className="restructured-section">
                  <h3>Restructured Output</h3>
                  <div className="restructured-output">
                    <pre className="output-text">
                      {results.restructuredOutput}
                    </pre>
                  </div>
                </div>
              )}

              {/* OCR Results Grid (Collapsed by default) */}
              <details className="ocr-details">
                <summary>View OCR Results Details</summary>
                <div className="results-grid">
                  {results.ocrResults.map((result, index) => (
                    <div key={index} className="result-card">
                      <h4>Page {result.page}</h4>
                      <div className="result-preview">
                        <pre className="json-preview">
                          {JSON.stringify(result.data, null, 2).substring(0, 200)}
                          {JSON.stringify(result.data, null, 2).length > 200 && '...'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 PDF OCR Processor. Advanced document processing solution.</p>
        </div>
      </footer>
    </div>
  );
};

export default Main;