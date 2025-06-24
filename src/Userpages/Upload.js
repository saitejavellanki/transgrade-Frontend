import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Eye, Download, Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, User, BookOpen, GraduationCap } from 'lucide-react';
import '../csstemplates/UploadPage.css';

const UploadPage = () => {
  const [selectedData, setSelectedData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [keyOcrData, setKeyOcrData] = useState(null);
  const [results, setResults] = useState({
    images: [],
    ocrResults: [],
    textractResults: null,
    scriptId: null
  });
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5015';
  const DJANGO_API_BASE = 'http://localhost:8000';
  const TEXTRACT_API_BASE = 'http://localhost:5000';
  const CORRECTION_API_BASE = 'https://3bca-115-108-34-139.ngrok-free.app';
  const VLM = 'http://localhost:5010';

  const steps = [
    { name: 'Upload PDF', icon: Upload },
    { name: 'Convert to Images', icon: Image },
    { name: 'Save Images', icon: CheckCircle },
    { name: 'Extract Text (OCR)', icon: FileText },
    { name: 'Process with Textract', icon: RefreshCw },
    { name: 'Save to Database', icon: CheckCircle },
    { name: 'Correct OCR Data', icon: RefreshCw },
    { name: 'View Results', icon: Eye }
  ];

  useEffect(() => {
    const savedData = sessionStorage.getItem('selectedData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setSelectedData(parsedData);
      if (parsedData.subject?.subject_id) {
        fetchKeyOcr(parsedData.subject.subject_id);
      }
    }
  }, []);

  const fetchKeyOcr = async (subjectId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/key-ocr/?subject_id=${subjectId}`);
      if (response.ok) {
        const keyOcrData = await response.json();
        setKeyOcrData(keyOcrData);
      } else if (response.status !== 404) {
        const errorData = await response.json();
        setError(`Warning: Could not load answer key data - ${errorData.error}`);
      }
    } catch (err) {
      setError('Warning: Could not connect to database for answer key data');
    }
  };

  const compressImage = async (base64String, maxSizeKB = 3500) => {
    try {
      const response = await fetch(`data:image/jpeg;base64,${base64String}`);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let { width, height } = imageBitmap;
      const aspectRatio = width / height;
      const maxDimension = 2000;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          width = maxDimension;
          height = width / aspectRatio;
        } else {
          height = maxDimension;
          width = height * aspectRatio;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      let quality = 0.8;
      let compressedDataUrl;
      
      do {
        ctx.drawImage(imageBitmap, 0, 0, width, height);
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (compressedDataUrl.length * 3/4) / 1024;
        if (sizeKB <= maxSizeKB) break;
        quality -= 0.1;
      } while (quality > 0.1);
      
      imageBitmap.close();
      return compressedDataUrl.split(',')[1];
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
      setResults({ images: [], ocrResults: [], textractResults: null, scriptId: null });
      setCurrentStep(0);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const apiCall = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API call failed');
    }
    return response.json();
  };

  const convertPdfToImages = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setCurrentStep(1);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      const data = await apiCall(`${API_BASE}/convert-pdf`, { method: 'POST', body: formData });
      
      setResults(prev => ({ ...prev, images: data.images }));
      setCurrentStep(2);
      await saveImagesToDatabase(data.images);
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const saveImagesToDatabase = async (imageData) => {
    setCurrentStep(2);
    setProcessing(true);

    try {
      // Create or find script record
      let scriptId;
      const scriptData = {
        student_id: selectedData.student.student_id,
        subject_id: selectedData.subject.subject_id
      };

      try {
        const scriptResult = await apiCall(`${DJANGO_API_BASE}/scripts/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scriptData)
        });
        scriptId = scriptResult.script_id;
      } catch (err) {
        if (err.message.includes('already exists')) {
          const existingScripts = await apiCall(
            `${DJANGO_API_BASE}/scripts/?student_id=${selectedData.student.student_id}&subject_id=${selectedData.subject.subject_id}`
          );
          const existingScript = existingScripts.find(
            script => script.student_id === selectedData.student.student_id && 
                     script.subject_id === selectedData.subject.subject_id
          );
          if (existingScript) {
            scriptId = existingScript.script_id;
          } else {
            throw new Error('Failed to find existing script record');
          }
        } else {
          throw err;
        }
      }

      setResults(prev => ({ ...prev, scriptId }));

      // Save images
      const savedImages = [];
      for (let i = 0; i < imageData.length; i++) {
        let compressedImageData = imageData[i].data;
        const imageSizeKB = (imageData[i].data.length * 3/4) / 1024;
        
        if (imageSizeKB > 3500) {
          compressedImageData = await compressImage(imageData[i].data);
        }

        const imageRecord = {
          script_id: scriptId,
          page_number: i + 1,
          image_data: compressedImageData,
          image_filename: imageData[i].filename,
          image_path: imageData[i].path || ''
        };

        try {
          const savedImage = await apiCall(`${DJANGO_API_BASE}/script-images/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imageRecord)
          });
          savedImages.push(savedImage);
        } catch (err) {
          console.error(`Failed to save image for page ${i + 1}:`, err);
        }
      }

      setResults(prev => ({ ...prev, savedImages }));
      setCurrentStep(3);
      await extractTextFromImages(imageData, scriptId);
      
    } catch (err) {
      setError('Failed to save images to database: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processScript = async (scriptId) => {
    try {
      const processResult = await apiCall(`${VLM}/process/${scriptId}`);
      setResults(prev => ({ ...prev, processResult }));
    } catch (err) {
      console.warn(`Process API failed but continuing: ${err.message}`);
    }
  };

  const extractTextFromImages = async (imageData, scriptId) => {
    setCurrentStep(3);
    setProcessing(true);
    const ocrResults = [];

    try {
      for (let i = 0; i < imageData.length; i++) {
        let imageDataForOcr = imageData[i].data;
        const imageSizeKB = (imageData[i].data.length * 3/4) / 1024;
        
        if (imageSizeKB > 3500) {
          imageDataForOcr = await compressImage(imageData[i].data);
        }

        const result = await apiCall(`${API_BASE}/extract-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: imageDataForOcr })
        });

        ocrResults.push({
          page: i + 1,
          imagePath: imageData[i].path,
          filename: imageData[i].filename,
          data: result
        });
      }

      setResults(prev => ({ ...prev, ocrResults }));
      setCurrentStep(4);
      
      await processScript(scriptId);
      await processWithTextract(scriptId, ocrResults);
      
    } catch (err) {
      setError('OCR processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processWithTextract = async (scriptId, ocrResults) => {
    setCurrentStep(4);
    setProcessing(true);

    try {
      const startResult = await apiCall(`${TEXTRACT_API_BASE}/process-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: scriptId,
          use_api: true,
          force_process: false
        })
      });
      
      await pollTextractStatus(scriptId, ocrResults);
    } catch (err) {
      console.error('Textract processing error:', err);
      await saveOcrDataToDatabase(ocrResults, null, scriptId);
    } finally {
      setProcessing(false);
    }
  };

  const pollTextractStatus = async (scriptId, ocrResults) => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const statusData = await apiCall(`${TEXTRACT_API_BASE}/process-status/${scriptId}`);
        
        if (statusData.status === 'completed') {
          const textractResults = await apiCall(`${TEXTRACT_API_BASE}/process-results/${scriptId}`);
          setResults(prev => ({ ...prev, textractResults }));
          await saveOcrDataToDatabase(ocrResults, textractResults, scriptId);
          return;
        } else if (statusData.status === 'failed') {
          console.error('Textract processing failed:', statusData.error);
          await saveOcrDataToDatabase(ocrResults, null, scriptId);
          return;
        }
        
        if (statusData.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        }
      } catch (err) {
        console.error('Error polling Textract status:', err);
        await saveOcrDataToDatabase(ocrResults, null, scriptId);
        return;
      }
    }
    
    console.warn('Textract processing timed out, saving regular OCR data only');
    await saveOcrDataToDatabase(ocrResults, null, scriptId);
  };

  const saveOcrDataToDatabase = async (ocrResults, textractResults, scriptId) => {
    setCurrentStep(5);
    setProcessing(true);

    try {
      if (!scriptId || !ocrResults?.length) {
        throw new Error('No script ID or OCR results available.');
      }

      const overallMetadata = {
        textract_results: textractResults,
        processing_timestamp: new Date().toISOString(),
        student_info: {
          name: selectedData.student.name,
          roll_number: selectedData.student.roll_number,
          class_name: selectedData.class.class_name
        },
        subject_info: {
          name: selectedData.subject.subject_name,
          class_name: selectedData.subject.class_name || selectedData.class.class_name
        },
        key_ocr_info: keyOcrData ? {
          key_ocr_id: keyOcrData.key_ocr_id,
          created_at: keyOcrData.created_at,
          updated_at: keyOcrData.updated_at
        } : null,
        processing_metadata: {
          total_pages: ocrResults.length,
          upload_timestamp: new Date().toISOString(),
          processing_status: 'completed',
          has_answer_key: !!keyOcrData,
          textract_processed: !!textractResults
        }
      };

      const savedOcrData = [];
      for (const ocrResult of ocrResults) {
        const ocrData = {
          script_id: scriptId,
          page_number: ocrResult.page,
          ocr_json: ocrResult.data,
          structured_json: {
            ...overallMetadata,
            page_specific: {
              page_number: ocrResult.page,
              filename: ocrResult.filename,
              imagePath: ocrResult.imagePath,
              processing_timestamp: new Date().toISOString()
            }
          },
          context: [
            `Answer script OCR data - Page ${ocrResult.page}`,
            `Student: ${selectedData.student.name} (${selectedData.student.roll_number})`,
            `Subject: ${selectedData.subject.subject_name}`,
            `Class: ${selectedData.class.class_name}`,
            `File: ${ocrResult.filename}`,
            keyOcrData ? 'Answer key available for processing' : 'No answer key available',
            textractResults ? 'Textract processing completed' : 'Textract processing not available'
          ].join(' - ')
        };

        const savedOcr = await apiCall(`${DJANGO_API_BASE}/ocr/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ocrData)
        });
        savedOcrData.push(savedOcr);
      }

      setResults(prev => ({ ...prev, savedOcrData, ocrSaveSuccess: true }));
      setCurrentStep(6);
      await correctOcrData(selectedData.subject.subject_id, scriptId);
      
    } catch (err) {
      setError('Database save failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const correctOcrData = async (subjectId, scriptId) => {
    setCurrentStep(6);
    setProcessing(true);

    try {
      const correctionResult = await fetch(`${CORRECTION_API_BASE}/correct_ocr/${subjectId}/${scriptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (correctionResult.ok) {
        const result = await correctionResult.json();
        setResults(prev => ({ ...prev, correctionResult: result }));
      }
      
      setCurrentStep(7);
    } catch (err) {
      console.warn(`OCR correction failed but continuing: ${err.message}`);
      setCurrentStep(7);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResults = (data, filename) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
  };

  const downloadJSON = () => {
    if (results.ocrResults.length > 0) {
      const filename = `ocr_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      downloadResults(results.ocrResults, filename);
    }
  };

  const downloadTextractResults = () => {
    if (results.textractResults) {
      const filename = `textract_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      downloadResults(results.textractResults, filename);
    }
  };

  const resetProcess = () => {
    setPdfFile(null);
    setResults({ images: [], ocrResults: [], textractResults: null, scriptId: null });
    setCurrentStep(0);
    setError('');
    setProcessing(false);
  };

  return (
    <div className="upload-page">
      <header className="upload-header">
        <div className="container">
          <button onClick={() => window.history.back()} className="back-button">
            <ArrowLeft size={20} />
            Back to Selection
          </button>
          
          <div className="upload-title-section">
            <h1 className="upload-title">Upload Answer Script</h1>
            <p className="upload-subtitle">Process PDF documents using advanced OCR and Textract technology</p>
          </div>

          {selectedData && (
            <div className="selection-info">
              <div className="selection-item">
                <GraduationCap size={16} />
                <span>{selectedData.class?.class_name}</span>
              </div>
              <div className="selection-item">
                <BookOpen size={16} />
                <span>{selectedData.subject?.subject_name}</span>
                {keyOcrData ? <span className="key-indicator">✓ Answer Key Available</span> : <span className="no-key-indicator">⚠ No Answer Key</span>}
              </div>
              <div className="selection-item">
                <User size={16} />
                <span>{selectedData.student?.name} ({selectedData.student?.roll_number})</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="upload-main">
        <div className="container">
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

          {selectedData && (
            <div className={`key-status ${keyOcrData ? 'key-available' : 'key-missing'}`}>
              <div className="key-status-content">
                {keyOcrData ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>
                  {keyOcrData 
                    ? `Answer key loaded for ${selectedData.subject.subject_name}`
                    : `No answer key available for ${selectedData.subject.subject_name}`
                  }
                </span>
                <small>
                  {keyOcrData 
                    ? `Last updated: ${new Date(keyOcrData.updated_at).toLocaleDateString()}`
                    : 'Processing will continue with Textract OCR processing'
                  }
                </small>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {currentStep === 0 && (
            <div className="upload-section">
              <div className="upload-card">
                <Upload size={48} className="upload-icon" />
                <h2>Upload Answer Script PDF</h2>
                <p>Select the answer script PDF file for {selectedData?.student?.name || 'the selected student'}</p>
                
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

          {processing && (
            <div className="processing-section">
              <div className="processing-card">
                <Loader2 size={48} className="spinner" />
                <h2>Processing Answer Script</h2>
                <p>
                  {currentStep === 1 && "Converting PDF to images..."}
                  {currentStep === 2 && "Saving images to database..."}
                  {currentStep === 3 && "Extracting text using OCR..."}
                  {currentStep === 4 && "Processing with AWS Textract OCR..."}
                  {currentStep === 5 && "Saving OCR data to database..."}
                  {currentStep === 6 && "Correcting OCR data with AI..."}
                </p>
                <div className="processing-info">
                  <span>Student: {selectedData?.student?.name}</span>
                  <span>Subject: {selectedData?.subject?.subject_name}</span>
                  {keyOcrData && <span>Answer Key: Available ✓</span>}
                  {results.scriptId && <span>Script ID: {results.scriptId}</span>}
                  {currentStep === 4 && <span>Textract: Processing ⏳</span>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Processing Complete</h2>
                <div className="student-info">
                  <p>Answer script processed and saved for <strong>{selectedData?.student?.name}</strong> - {selectedData?.subject?.subject_name}</p>
                  {results.scriptId && <p className="script-id">Script ID: {results.scriptId}</p>}
                  {keyOcrData && <p className="key-info">✓ Processed with answer key comparison</p>}
                  <p className="images-info">✓ {results.images.length} images saved to database</p>
                  <p className="ocr-info">✓ {results.ocrResults.length} pages processed with regular OCR</p>
                  {results.textractResults && <p className="textract-info">✓ {results.textractResults.successfully_processed || 0} pages processed with Textract</p>}
                  {results.correctionResult && <p className="correction-info">✓ OCR data corrected with AI</p>}
                </div>
                <div className="results-actions">
                  <button className="download-btn primary" onClick={downloadTextractResults}>
                    <Download size={20} />
                    Download Textract Results
                  </button>
                  <button className="download-btn secondary" onClick={downloadJSON}>
                    <Download size={20} />
                    Download Regular OCR Data
                  </button>
                  <button className="reset-btn" onClick={resetProcess}>
                    Process Another Script
                  </button>
                </div>
              </div>

              <div className="results-summary">
                <h3>Processing Summary</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-number">{results.ocrResults.length}</span>
                    <span className="stat-label">Pages Processed</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{results.images.length}</span>
                    <span className="stat-label">Images Saved</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{results.textractResults?.successfully_processed || 0}</span>
                    <span className="stat-label">Textract Pages</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{selectedData?.subject?.subject_name || 'N/A'}</span>
                    <span className="stat-label">Subject</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{selectedData?.student?.roll_number || 'N/A'}</span>
                    <span className="stat-label">Roll Number</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">✓ Saved</span>
                    <span className="stat-label">Database Status</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{keyOcrData ? '✓ Used' : '✗ N/A'}</span>
                    <span className="stat-label">Answer Key</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{results.correctionResult ? '✓ Corrected' : '✗ N/A'}</span>
                    <span className="stat-label">AI Correction</span>
                  </div>
                </div>
              </div>

              {results.textractResults && (
                <div className="textract-section">
                  <h3>AWS Textract Processing Results</h3>
                  <div className="textract-summary">
                    <p><strong>Total Images:</strong> {results.textractResults.total_images}</p>
                    <p><strong>Successfully Processed:</strong> {results.textractResults.successfully_processed}</p>
                    <p><strong>Failed Images:</strong> {results.textractResults.failed_images}</p>
                    <p><strong>Saved to Database:</strong> {results.textractResults.saved_to_database}</p>
                    <p><strong>Processing Completed:</strong> {new Date(results.textractResults.processed_at).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <details className="ocr-details">
                <summary>View Regular OCR Data</summary>
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
    </div>
  );
};

export default UploadPage;