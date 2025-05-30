import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import '../csstemplates/KeyOCRPage.css';

const KeyOCRPage = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);
  const [ocrResults, setOcrResults] = useState([]);
  const [combinedOCR, setCombinedOCR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass);
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:8000/classes/');
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch classes');
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      const response = await fetch(`http://localhost:8000/subjects/?class_id=${classId}`);
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError('Failed to fetch subjects');
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (!selectedSubject) {
        setError('Please select a class and subject first');
        return;
      }

      setPdfFile(file);
      setError('');
      setSuccess('');
      
      // Reset previous results
      setImages([]);
      setOcrResults([]);
      setCombinedOCR(null);
      setStep(1);

      // Automatically start the processing chain
      await processCompleteWorkflow(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const processCompleteWorkflow = async (file) => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Convert PDF to Images
      setStep(1);
      const convertedImages = await convertPdfToImages(file);
      
      // Step 2: Perform OCR
      setStep(2);
      const ocrData = await performOCR(convertedImages);
      
      // Step 3: Save to Database
      setStep(3);
      const saveResult = await saveToDatabase(ocrData);
      
      // Step 4: Call additional API
      setStep(4);
      await callAdditionalAPI(selectedSubject);
      
      setStep(5); // Final step
      setSuccess(`Processing completed successfully! Key OCR saved and context uploaded for subject.`);
      
      // Reset form after successful completion
      setTimeout(() => {
        resetForm();
      }, 5000);

    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const convertPdfToImages = async (file) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('http://localhost:5015/convert-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to convert PDF');
      }

      const result = await response.json();
      setImages(result.images);
      return result.images;
    } catch (err) {
      throw new Error(`PDF conversion failed: ${err.message}`);
    }
  };

  const performOCR = async (imageList) => {
    if (imageList.length === 0) {
      throw new Error('No images available for OCR');
    }

    const results = [];

    try {
      for (let i = 0; i < imageList.length; i++) {
        const image = imageList[i];
        
        const response = await fetch('http://localhost:5015/extract-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_data: image.data
          }),
        });

        if (!response.ok) {
          throw new Error(`OCR failed for page ${i + 1}`);
        }

        const ocrResult = await response.json();
        results.push({
          page: i + 1,
          filename: image.filename,
          ocr_data: ocrResult
        });
      }

      setOcrResults(results);
      
      // Combine all OCR results into one JSON object
      const combined = {
        total_pages: results.length,
        pages: results.map(r => ({
          page_number: r.page,
          filename: r.filename,
          ocr_data: r.ocr_data
        }))
      };
      
      setCombinedOCR(combined);
      return combined;
    } catch (err) {
      throw new Error(`OCR processing failed: ${err.message}`);
    }
  };

  const saveToDatabase = async (ocrData) => {
    if (!selectedSubject || !ocrData) {
      throw new Error('Missing subject selection or OCR data');
    }

    try {
      const payload = {
        subject_id: selectedSubject,
        key_json: ocrData
      };

      const response = await fetch('http://localhost:8000/key-ocr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save to database');
      }

      return result;
    } catch (err) {
      throw new Error(`Save failed: ${err.message}`);
    }
  };

  const callAdditionalAPI = async (subjectId) => {
    try {
      const response = await fetch(`https://student-answer.onrender.com/run/${subjectId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to upload context');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      throw new Error(`Context upload failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setPdfFile(null);
    setImages([]);
    setOcrResults([]);
    setCombinedOCR(null);
    setSelectedClass('');
    setSelectedSubject('');
    setStep(1);
    setError('');
    setSuccess('');
  };

  const StepIndicator = ({ currentStep }) => {
    const steps = [
      { num: 1, title: 'Convert PDF', icon: FileText },
      { num: 2, title: 'OCR Processing', icon: Eye },
      { num: 3, title: 'Save to Database', icon: Save },
      { num: 4, title: 'Upload Context', icon: Upload },
      { num: 5, title: 'Complete', icon: CheckCircle }
    ];

    return (
      <div className="step-indicator">
        <div className="step-indicator-container">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = currentStep >= stepItem.num;
            const isCompleted = currentStep > stepItem.num;
            
            return (
              <div key={stepItem.num} className="step-item">
                <div className={`step-circle ${isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}`}>
                  {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                </div>
                <span className={`step-title ${isActive ? 'active' : 'inactive'}`}>
                  {stepItem.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${currentStep > stepItem.num ? 'completed' : 'inactive'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="keyocr-container">
      <h1 className="main-title">Key OCR Processing</h1>

      <StepIndicator currentStep={step} />

      {/* Error Display */}
      {error && (
        <div className="alert error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="alert success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Class and Subject Selection */}
      <div className="selection-section">
        <div className="form-group">
          <label htmlFor="classSelect">Select Class:</label>
          <select
            id="classSelect"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="">Choose a class...</option>
            {classes.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subjectSelect">Select Subject:</label>
          <select
            id="subjectSelect"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="form-select"
            disabled={!selectedClass || loading}
          >
            <option value="">Choose a subject...</option>
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PDF Upload Section */}
      <div className="upload-section">
        <div className="upload-area">
          <Upload size={48} className="upload-icon" />
          <p>Upload Answer Key PDF</p>
          <p className="upload-instruction">
            {!selectedSubject 
              ? "Please select a class and subject first" 
              : "Select PDF file to automatically process and save"
            }
          </p>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="file-input"
            id="pdfUpload"
            disabled={loading || !selectedSubject}
          />
          <label 
            htmlFor="pdfUpload" 
            className={`file-label ${(!selectedSubject || loading) ? 'disabled' : ''}`}
          >
            {loading ? 'Processing...' : 'Choose PDF File'}
          </label>
          {pdfFile && <p className="file-name">Selected: {pdfFile.name}</p>}
        </div>
      </div>

      {/* Processing Status */}
      {loading && (
        <div className="processing-status">
          <Loader className="spinning" size={24} />
          <p>
            {step === 1 && "Converting PDF to images..."}
            {step === 2 && "Extracting text with OCR..."}
            {step === 3 && "Saving to database..."}
            {step === 4 && "Uploading context..."}
          </p>
        </div>
      )}

      {/* Reset Button */}
      {(step > 1 || error) && (
        <div className="action-buttons">
          <button
            onClick={resetForm}
            className="btn btn-secondary"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      )}

      {/* Results Display */}
      {images.length > 0 && (
        <div className="results-section">
          <h3>Converted Images ({images.length} pages)</h3>
          <div className="image-grid">
            {images.map((image, index) => (
              <div key={index} className="image-item">
                <img
                  src={`data:image/png;base64,${image.data}`}
                  alt={`Page ${index + 1}`}
                  className="preview-image"
                />
                <p className="image-label">Page {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ocrResults.length > 0 && (
        <div className="results-section">
          <h3>OCR Results</h3>
          <div className="ocr-summary">
            <p>Successfully processed {ocrResults.length} pages</p>
            <details className="ocr-details">
              <summary>View OCR Data</summary>
              <div className="json-display">
                <pre>{JSON.stringify(combinedOCR, null, 2)}</pre>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyOCRPage;