import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Eye, Download, Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, User, BookOpen, GraduationCap, Database, BarChart, FileCheck } from 'lucide-react';
import '../csstemplates/UploadPage.css';

const UploadPage = () => {
  const [selectedData, setSelectedData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [keyOcrData, setKeyOcrData] = useState(null);
  const [isMcq, setIsMcq] = useState(false);
  const [results, setResults] = useState({
    images: [],
    ocrResults: [],
    textractResults: null,
    scriptId: null,
    correctionResult: null,
    restructureResult: null,
    analysisResult: null,
    validationResult: null
  });
  const [error, setError] = useState('');

const API_BASE = 'https:transback.transpoze.ai/app';
const DJANGO_API_BASE = 'https:transback.transpoze.ai';
const TEXTRACT_API_BASE = 'https:transback.transpoze.ai/textract';
const CORRECTION_API_BASE = 'https:transback.transpoze.ai/correction';
const VLM = 'https:transback.transpoze.ai/diagram';
const RESTRUCTURE_API_BASE = 'https:transback.transpoze.ai/restructure';
const ANALYSIS_API_BASE = 'http://127.0.0.1:5018'; // Replace with your analysis API
const VALIDATION_API_BASE = 'https:transback.transpoze.ai/validation'; // Replace with your validation API
const MCQ_API_BASE = 'https:transback.transpoze.ai/MCQ';


  const steps = [
    { name: 'Upload PDF', icon: Upload },
    { name: 'Convert to Images', icon: Image },
    { name: 'Save Images', icon: CheckCircle },
    { name: 'Extract Text (OCR)', icon: FileText },
    { name: 'Process with Textract', icon: RefreshCw },
    { name: 'Save to Database', icon: CheckCircle },
    { name: 'Correct OCR Data', icon: RefreshCw },
    { name: 'Restructure Data', icon: Database },
    { name: 'Analyze Results', icon: BarChart }, // New step 8
    { name: 'Validate & Finalize', icon: FileCheck }, // New step 9
    { name: 'View Results', icon: Eye } // Now step 10
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
      setResults({ 
        images: [], 
        ocrResults: [], 
        textractResults: null, 
        scriptId: null,
        correctionResult: null,
        restructureResult: null,
        analysisResult: null,
        validationResult: null
      });
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

  const processMcqData = async (scriptId) => {
  setProcessing(true);
  
  try {
    const mcqResult = await apiCall(`${MCQ_API_BASE}/run/${scriptId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    setResults(prev => ({ ...prev, mcqResult }));
    console.log('MCQ processing completed:', mcqResult);
  } catch (err) {
    console.warn(`MCQ processing failed but continuing: ${err.message}`);
    setError(`MCQ processing warning: ${err.message}`);
  } finally {
    setProcessing(false);
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
    
    // NEW: Process MCQ if toggle is enabled
    if (isMcq) {
      await processMcqData(scriptId);
    }
    
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
      await restructureData(subjectId, scriptId);
    } catch (err) {
      console.warn(`OCR correction failed but continuing: ${err.message}`);
      setCurrentStep(7);
      await restructureData(selectedData.subject.subject_id, scriptId);
    } finally {
      setProcessing(false);
    }
  };
const restructureData = async (subjectId, scriptId) => {
  setCurrentStep(7);
  setProcessing(true);

  try {
    const restructureResult = await fetch(`${RESTRUCTURE_API_BASE}/restructure/${subjectId}/${scriptId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        'User-Agent': 'MyApp/1.0'
      }
    });

    if (restructureResult.ok) {
      const result = await restructureResult.json();
      setResults(prev => ({ ...prev, restructureResult: result }));
    } else {
      console.warn('Restructure API call failed but continuing');
    }
    
    setCurrentStep(8);
    await analyzeResults(subjectId, scriptId);
  } catch (err) {
    console.warn(`Data restructuring failed but continuing: ${err.message}`);
    setCurrentStep(8);
    await analyzeResults(selectedData.subject.subject_id, scriptId);
  } finally {
    setProcessing(false);
  }
};


  // NEW STEP 8: Analyze Results
  const analyzeResults = async (subjectId, scriptId) => {
    setCurrentStep(8);
    setProcessing(true);

    try {
      // Replace this with your actual analysis API call
      const analysisResult = await fetch(`${ANALYSIS_API_BASE}/evaluate_batch/${scriptId}/${subjectId}`, {
  method: 'GET',  // Changed from POST to GET
  headers: {
    'Content-Type': 'application/json'
  }
  // Remove the body since it's now a GET request
});

      if (analysisResult.ok) {
        const result = await analysisResult.json();
        setResults(prev => ({ ...prev, analysisResult: result }));
      } else {
        console.warn('Analysis API call failed but continuing');
      }
      
      setCurrentStep(9);
      await validateAndFinalize(subjectId, scriptId);
    } catch (err) {
      console.warn(`Results analysis failed but continuing: ${err.message}`);
      setCurrentStep(9);
      await validateAndFinalize(selectedData.subject.subject_id, scriptId);
    } finally {
      setProcessing(false);
    }
  };

  // NEW STEP 9: Validate & Finalize
  const validateAndFinalize = async (subjectId, scriptId) => {
    setCurrentStep(9);
    setProcessing(true);

    try {
      // Replace this with your actual validation API call
      const validationResult = await fetch(`${VALIDATION_API_BASE}/validate/${scriptId}/${subjectId}`, {
  method: 'GET',  // Changed from POST to GET
  headers: {
    'Content-Type': 'application/json'
  }
  // Remove the body since it's now a GET request
});

      if (validationResult.ok) {
        const result = await validationResult.json();
        setResults(prev => ({ ...prev, validationResult: result }));
      } else {
        console.warn('Validation API call failed but continuing');
      }
      
      setCurrentStep(10); // Final step - View Results
    } catch (err) {
      console.warn(`Validation and finalization failed but continuing: ${err.message}`);
      setCurrentStep(10);
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

  const downloadAnalysisResults = () => {
    if (results.analysisResult) {
      const filename = `analysis_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      downloadResults(results.analysisResult, filename);
    }
  };

  const downloadValidationResults = () => {
    if (results.validationResult) {
      const filename = `validation_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      downloadResults(results.validationResult, filename);
    }
  };

  const resetProcess = () => {
  setPdfFile(null);
  setIsMcq(false);  // ADD THIS LINE
  setResults({ 
    images: [], 
    ocrResults: [], 
    textractResults: null, 
    scriptId: null,
    correctionResult: null,
    restructureResult: null,
    analysisResult: null,
    validationResult: null,
    mcqResult: null  // ADD THIS LINE
  });
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
                  
{pdfFile && (
  <div className="mcq-toggle-section">
    <label className="mcq-toggle-label">
      <input
        type="checkbox"
        checked={isMcq}
        onChange={(e) => setIsMcq(e.target.checked)}
        className="mcq-checkbox"
      />
      <span className="mcq-toggle-text">MCQ Processing</span>
      <small className="mcq-toggle-description">
        Enable for multiple choice question analysis
      </small>
    </label>
  </div>
)}
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
                  {currentStep === 3 && isMcq && "Processing MCQ data..."}
                  {currentStep === 3 && !isMcq && "Extracting text using OCR..."}
                  {currentStep === 4 && "Processing with AWS Textract OCR..."}
                  {currentStep === 5 && "Saving OCR data to database..."}
                  {currentStep === 6 && "Correcting OCR data with AI..."}
                  {currentStep === 7 && "Restructuring data for analysis..."}
                  {currentStep === 8 && "Analyzing results and generating insights..."}
                  {currentStep === 9 && "Validating data and finalizing results..."}
                </p>
                <div className="processing-info">
                  <span>Student: {selectedData?.student?.name}</span>
                  <span>Subject: {selectedData?.subject?.subject_name}</span>
                  {keyOcrData && <span>Answer Key: Available ✓</span>}
                  {results.scriptId && <span>Script ID: {results.scriptId}</span>}
                  {currentStep === 4 && <span>Textract: Processing ⏳</span>}
                  {currentStep === 7 && <span>Restructuring: In Progress ⏳</span>}
                  {currentStep === 8 && <span>Analysis: In Progress ⏳</span>}
                  {currentStep === 9 && <span>Validation: In Progress ⏳</span>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Processing Complete</h2>
                <div className="student-info">
                  <p>Answer script processed and saved for <strong>{selectedData?.student?.name}</strong> - {selectedData?.subject?.subject_name}</p>
                  {results.scriptId && <p className="script-id">Script ID: {results.scriptId}</p>}
                  {keyOcrData && <p className="key-info">✓ Processed with answer key comparison</p>}
                  <p className="images-info">✓ {results.images.length} images saved to database</p>
                  <p className="ocr-info">✓ {results.ocrResults.length} pages processed with regular OCR</p>
                  // This is the remaining part of your UploadPage.js file
// Place this after line 551 where it cuts off

                  {results.textractResults && <p className="textract-info">✓ AWS Textract processing completed</p>}
                  {results.correctionResult && <p className="correction-info">✓ OCR data corrected with AI</p>}
                  {results.restructureResult && <p className="restructure-info">✓ Data restructured for analysis</p>}
                  {results.analysisResult && <p className="analysis-info">✓ Results analyzed and insights generated</p>}
                  {results.validationResult && <p className="validation-info">✓ Data validated and finalized</p>}
                </div>
              </div>

              <div className="results-grid">
                {/* OCR Results Card */}
                <div className="result-card">
                  <div className="result-header">
                    <FileText size={24} />
                    <h3>OCR Results</h3>
                    <span className="result-count">{results.ocrResults.length} pages</span>
                  </div>
                  <div className="result-content">
                    <p>Regular OCR processing completed for all pages</p>
                    <div className="result-actions">
                      <button className="btn-secondary" onClick={downloadJSON}>
                        <Download size={16} />
                        Download OCR JSON
                      </button>
                    </div>
                  </div>
                </div>

                
{/* MCQ Results Card */}
{results.mcqResult && (
  <div className="result-card">
    <div className="result-header">
      <CheckCircle size={24} />
      <h3>MCQ Analysis</h3>
      <span className="result-status success">Processed</span>
    </div>
    <div className="result-content">
      <p>Multiple choice questions analyzed and processed</p>
      <div className="result-stats">
        {results.mcqResult.total_questions && (
          <small>Questions: {results.mcqResult.total_questions}</small>
        )}
        {results.mcqResult.processed_answers && (
          <small>Answers: {results.mcqResult.processed_answers}</small>
        )}
      </div>
      <div className="result-actions">
        <button 
          className="btn-secondary" 
          onClick={() => downloadResults(results.mcqResult, `mcq_results_${selectedData?.student?.name || 'student'}_${Date.now()}.json`)}
        >
          <Download size={16} />
          Download MCQ Results
        </button>
      </div>
    </div>
  </div>
)}

                {/* Textract Results Card */}
                {results.textractResults && (
                  <div className="result-card">
                    <div className="result-header">
                      <RefreshCw size={24} />
                      <h3>Textract Results</h3>
                      <span className="result-status success">AWS Processed</span>
                    </div>
                    <div className="result-content">
                      <p>Advanced AWS Textract processing completed</p>
                      <div className="result-stats">
                        <small>Enhanced text extraction and structure analysis</small>
                      </div>
                      <div className="result-actions">
                        <button className="btn-secondary" onClick={downloadTextractResults}>
                          <Download size={16} />
                          Download Textract JSON
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Correction Results Card */}
                {results.correctionResult && (
                  <div className="result-card">
                    <div className="result-header">
                      <CheckCircle size={24} />
                      <h3>AI Correction</h3>
                      <span className="result-status success">Corrected</span>
                    </div>
                    <div className="result-content">
                      <p>OCR data corrected using AI processing</p>
                      <div className="result-stats">
                        {results.correctionResult.status && (
                          <small>Status: {results.correctionResult.status}</small>
                        )}
                        {results.correctionResult.corrections_applied && (
                          <small>Corrections: {results.correctionResult.corrections_applied}</small>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Restructure Results Card */}
                {results.restructureResult && (
                  <div className="result-card">
                    <div className="result-header">
                      <Database size={24} />
                      <h3>Data Restructure</h3>
                      <span className="result-status success">Structured</span>
                    </div>
                    <div className="result-content">
                      <p>Data restructured for analysis and evaluation</p>
                      <div className="result-stats">
                        {results.restructureResult.questions_identified && (
                          <small>Questions: {results.restructureResult.questions_identified}</small>
                        )}
                        {results.restructureResult.answers_processed && (
                          <small>Answers: {results.restructureResult.answers_processed}</small>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Results Card */}
                {results.analysisResult && (
                  <div className="result-card">
                    <div className="result-header">
                      <BarChart size={24} />
                      <h3>Analysis Results</h3>
                      <span className="result-status success">Analyzed</span>
                    </div>
                    <div className="result-content">
                      <p>Comprehensive analysis and scoring completed</p>
                      <div className="result-stats">
                        {results.analysisResult.total_score && (
                          <small>Score: {results.analysisResult.total_score}</small>
                        )}
                        {results.analysisResult.feedback_generated && (
                          <small>Feedback: Generated</small>
                        )}
                        {results.analysisResult.insights_count && (
                          <small>Insights: {results.analysisResult.insights_count}</small>
                        )}
                      </div>
                      <div className="result-actions">
                        <button className="btn-secondary" onClick={downloadAnalysisResults}>
                          <Download size={16} />
                          Download Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Results Card */}
                {results.validationResult && (
                  <div className="result-card">
                    <div className="result-header">
                      <FileCheck size={24} />
                      <h3>Validation & Final Report</h3>
                      <span className="result-status success">Validated</span>
                    </div>
                    <div className="result-content">
                      <p>Data validated and final report generated</p>
                      <div className="result-stats">
                        {results.validationResult.validation_status && (
                          <small>Status: {results.validationResult.validation_status}</small>
                        )}
                        {results.validationResult.completeness_score && (
                          <small>Completeness: {results.validationResult.completeness_score}%</small>
                        )}
                        {results.validationResult.accuracy_score && (
                          <small>Accuracy: {results.validationResult.accuracy_score}%</small>
                        )}
                      </div>
                      <div className="result-actions">
                        <button className="btn-secondary" onClick={downloadValidationResults}>
                          <Download size={16} />
                          Download Report
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Images Preview Card */}
                {results.images.length > 0 && (
                  <div className="result-card full-width">
                    <div className="result-header">
                      <Image size={24} />
                      <h3>Processed Images</h3>
                      <span className="result-count">{results.images.length} images</span>
                    </div>
                    <div className="result-content">
                      <div className="images-grid">
                        {results.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="image-preview">
                            <img
                              src={`data:image/jpeg;base64,${image.data}`}
                              alt={`Page ${index + 1}`}
                              className="preview-image"
                            />
                            <span className="image-label">Page {index + 1}</span>
                          </div>
                        ))}
                        {results.images.length > 4 && (
                          <div className="image-preview more-images">
                            <span>+{results.images.length - 4} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="results-actions">
                <button className="btn-primary" onClick={resetProcess}>
                  <RefreshCw size={16} />
                  Process Another Script
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft size={16} />
                  Back to Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Processing Status Modal */}
      {processing && currentStep >= 4 && currentStep <= 9 && (
        <div className="processing-overlay">
          <div className="processing-modal">
            <div className="processing-modal-content">
              <div className="processing-animation">
                <Loader2 size={64} className="spinner large" />
              </div>
              <h3>Advanced Processing in Progress</h3>
              <p>
                {currentStep === 4 && "AWS Textract is analyzing document structure and extracting enhanced text data..."}
                {currentStep === 5 && "Saving processed OCR data with metadata to database..."}
                {currentStep === 6 && "AI is correcting and enhancing OCR accuracy..."}
                {currentStep === 7 && "Restructuring data for comprehensive analysis..."}
                {currentStep === 8 && "Analyzing answers and generating performance insights..."}
                {currentStep === 9 && "Validating results and generating final report..."}
              </p>
              <div className="processing-details">
                <div className="detail-item">
                  <span>Student:</span>
                  <span>{selectedData?.student?.name}</span>
                </div>
                <div className="detail-item">
                  <span>Subject:</span>
                  <span>{selectedData?.subject?.subject_name}</span>
                </div>
                {results.scriptId && (
                  <div className="detail-item">
                    <span>Script ID:</span>
                    <span>{results.scriptId}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span>Pages:</span>
                  <span>{results.images.length || 0}</span>
                </div>
                {keyOcrData && (
                  <div className="detail-item">
                    <span>Answer Key:</span>
                    <span className="success">Available ✓</span>
                  </div>
                )}
              </div>
              <div className="processing-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  Step {currentStep} of {steps.length - 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;