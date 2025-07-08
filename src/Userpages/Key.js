import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Save, AlertCircle, CheckCircle, Loader, Minimize2, BookOpen } from 'lucide-react';
import '../csstemplates/KeyOCRPage.css';

// Centralized API URLs Configuration
const API_URLS = {
  // Main API endpoints
  CLASSES: 'https://www.transgrade.transpoze.ai/classes/',
  SUBJECTS: 'https://www.transgrade.transpoze.ai/subjects/',
  KEY_OCR: 'https://www.transgrade.transpoze.ai/key-ocr/',
  
  // PDF Processing endpoints
  CONVERT_PDF: 'https://www.transgrade.transpoze.ai/app/convert-pdf',
  EXTRACT_TEXT: 'https://www.transgrade.transpoze.ai/app/extract-text',
  
  // Additional API endpoints
  CONTEXT_UPLOAD: 'http://127.0.0.1:5001/run/',
  GENERATE_RUBRICS: 'http://localhost:5033/run/'
};

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
      const response = await fetch(API_URLS.CLASSES);
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch classes');
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      const response = await fetch(`${API_URLS.SUBJECTS}?class_id=${classId}`);
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

  // Helper function to get base64 size in MB
  const getBase64SizeInMB = (base64String) => {
    // Remove data URL prefix if present
    const base64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    // Calculate size: base64 is ~33% larger than original, so divide by 1.33
    const sizeInBytes = (base64.length * 3) / 4;
    return sizeInBytes / (1024 * 1024); // Convert to MB
  };

  // Function to compress base64 image
  const compressBase64Image = (base64String, quality = 0.7, maxWidth = 1920) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Remove data URL prefix to get just the base64 data
        const base64Data = compressedBase64.replace(/^data:image\/jpeg;base64,/, '');
        resolve(base64Data);
      };
      
      img.src = `data:image/png;base64,${base64String}`;
    });
  };

  // New function to check and compress images if needed
  const checkAndCompressImages = async (imageList) => {
    const processedImages = [];
    let compressionCount = 0;
    
    for (let i = 0; i < imageList.length; i++) {
      const image = imageList[i];
      const sizeInMB = getBase64SizeInMB(image.data);
      
      if (sizeInMB > 4) {
        // Compress the image
        const compressedData = await compressBase64Image(image.data, 0.8, 1920);
        const newSizeInMB = getBase64SizeInMB(compressedData);
        
        // If it's still too large, compress more aggressively
        let finalData = compressedData;
        if (newSizeInMB > 4) {
          finalData = await compressBase64Image(image.data, 0.6, 1600);
          const finalSizeInMB = getBase64SizeInMB(finalData);
          
          // Last resort - very aggressive compression
          if (finalSizeInMB > 4) {
            finalData = await compressBase64Image(image.data, 0.4, 1200);
          }
        }
        
        processedImages.push({
          ...image,
          data: finalData,
          originalSize: sizeInMB.toFixed(2),
          compressedSize: getBase64SizeInMB(finalData).toFixed(2),
          compressed: true
        });
        
        compressionCount++;
      } else {
        processedImages.push({
          ...image,
          originalSize: sizeInMB.toFixed(2),
          compressed: false
        });
      }
    }
    
    return { images: processedImages, compressionCount };
  };

  const processCompleteWorkflow = async (file) => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Convert PDF to Images
      setStep(1);
      const convertedImages = await convertPdfToImages(file);
      
      // Step 2: Check and compress images if needed
      setStep(2);
      const { images: processedImages, compressionCount } = await checkAndCompressImages(convertedImages);
      
      if (compressionCount > 0) {
        setSuccess(`Compressed ${compressionCount} images to reduce size for processing.`);
      }
      
      // Step 3: Perform OCR
      setStep(3);
      const ocrData = await performOCR(processedImages);
      
      // Step 4: Save to Database
      setStep(4);
      const saveResult = await saveToDatabase(ocrData);
      
      // Step 5: Call additional API (Context Upload)
      setStep(5);
      await callAdditionalAPI(selectedSubject);
      
      // Step 6: Generate Rubrics
      setStep(6);
      await generateRubrics(selectedSubject);
      
      setStep(7); // Final step
      setSuccess(`Processing completed successfully! Key OCR saved, context uploaded, and rubrics generated for subject.`);
      
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

      const response = await fetch(API_URLS.CONVERT_PDF, {
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
        
        const response = await fetch(API_URLS.EXTRACT_TEXT, {
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
          ocr_data: ocrResult,
          compressed: image.compressed || false,
          originalSize: image.originalSize,
          compressedSize: image.compressedSize
        });
      }

      setOcrResults(results);
      
      // Combine all OCR results into one JSON object
      const combined = {
        total_pages: results.length,
        pages: results.map(r => ({
          page_number: r.page,
          filename: r.filename,
          ocr_data: r.ocr_data,
          image_info: {
            compressed: r.compressed,
            original_size_mb: r.originalSize,
            compressed_size_mb: r.compressedSize
          }
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

      const response = await fetch(API_URLS.KEY_OCR, {
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
      const response = await fetch(`${API_URLS.CONTEXT_UPLOAD}${subjectId}`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: Failed to upload context`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON Response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      if (err.name === 'SyntaxError') {
        throw new Error('Server returned invalid JSON response');
      } else if (err.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to reach the server');
      } else {
        throw new Error(`Context upload failed: ${err.message}`);
      }
    }
  };

  const generateRubrics = async (subjectId) => {
    try {
      const response = await fetch(`${API_URLS.GENERATE_RUBRICS}${subjectId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Rubrics API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: Failed to generate rubrics`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON Response:', responseText);
        throw new Error('Rubrics server returned non-JSON response');
      }

      const result = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message || 'Rubrics generation failed');
      }

      return result;
    } catch (err) {
      if (err.name === 'SyntaxError') {
        throw new Error('Rubrics server returned invalid JSON response');
      } else if (err.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to reach the rubrics server');
      } else {
        throw new Error(`Rubrics generation failed: ${err.message}`);
      }
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
      { num: 2, title: 'Compress Images', icon: Minimize2 },
      { num: 3, title: 'OCR Processing', icon: Eye },
      { num: 4, title: 'Save to Database', icon: Save },
      { num: 5, title: 'Upload Context', icon: Upload },
      { num: 6, title: 'Generate Rubrics', icon: BookOpen },
      { num: 7, title: 'Complete', icon: CheckCircle }
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
            {step === 2 && "Checking and compressing images..."}
            {step === 3 && "Extracting text with OCR..."}
            {step === 4 && "Saving to database..."}
            {step === 5 && "Uploading context..."}
            {step === 6 && "Generating rubrics..."}
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
                <p className="image-label">
                  Page {index + 1}
                  {image.compressed && (
                    <span className="compression-info">
                      <br />
                      <small>
                        Compressed: {image.originalSize}MB → {image.compressedSize}MB
                      </small>
                    </span>
                  )}
                </p>
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
            {ocrResults.some(r => r.compressed) && (
              <p className="compression-summary">
                {ocrResults.filter(r => r.compressed).length} images were compressed for optimal processing
              </p>
            )}
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