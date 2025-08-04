import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Save, AlertCircle, CheckCircle, Loader, Minimize2, BookOpen } from 'lucide-react';
import '../csstemplates/KeyOCRPage.css';

// Centralized API URLs Configuration
const API_URLS = {
  // Main API endpoints
  CLASSES: 'https://transback.transpoze.ai/classes/',
  SUBJECTS: 'https://transback.transpoze.ai/subjects/',
  KEY_OCR: 'https://transback.transpoze.ai/key-ocr/',
  
  // PDF Processing endpoints
  CONVERT_PDF: 'https://transback.transpoze.ai/app/convert-pdf',
  EXTRACT_TEXT: 'https://transback.transpoze.ai/app/extract-text',
  
  // Additional API endpoints
  CONTEXT_UPLOAD: 'https://transback.transpoze.ai/context/run/',
  GENERATE_RUBRICS: 'https://transback.transpoze.ai/rubric/run/'
};

// Enhanced logging utility
const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  debug: (message, data = null) => {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
  },
  cors: (message, response = null, error = null) => {
    console.group(`[CORS] ${new Date().toISOString()} - ${message}`);
    if (response) {
      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response URL:', response.url);
    }
    if (error) {
      console.error('Error Details:', error);
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
    }
    console.groupEnd();
  }
};

// Enhanced fetch wrapper with detailed logging
const fetchWithLogging = async (url, options = {}) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  logger.info(`[${requestId}] Making request to: ${url}`);
  logger.debug(`[${requestId}] Request options:`, {
    method: options.method || 'GET',
    headers: options.headers || {},
    bodyType: options.body ? typeof options.body : 'none',
    bodySize: options.body ? (options.body.length || 'FormData') : 0
  });

  try {
    const response = await fetch(url, options);
    
    logger.info(`[${requestId}] Response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      url: response.url
    });

    // Log response headers
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    logger.debug(`[${requestId}] Response headers:`, headers);

    // Check for CORS-related headers
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      'access-control-expose-headers': response.headers.get('access-control-expose-headers')
    };
    logger.debug(`[${requestId}] CORS headers:`, corsHeaders);

    if (!response.ok) {
      logger.error(`[${requestId}] HTTP Error Response:`, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      // Try to get error response body
      try {
        const errorText = await response.text();
        logger.error(`[${requestId}] Error response body:`, errorText);
      } catch (bodyError) {
        logger.error(`[${requestId}] Could not read error response body:`, bodyError);
      }
    }

    return response;
  } catch (error) {
    logger.cors(`[${requestId}] Fetch failed for ${url}`, null, error);
    
    // Additional error analysis
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      logger.error(`[${requestId}] Network error - possible CORS issue or server unreachable`);
    } else if (error.name === 'AbortError') {
      logger.error(`[${requestId}] Request was aborted`);
    } else {
      logger.error(`[${requestId}] Unexpected error:`, error);
    }
    
    throw error;
  }
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
    logger.info('Component mounted, fetching classes...');
    fetchClasses();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      logger.info(`Class selected: ${selectedClass}, fetching subjects...`);
      fetchSubjects(selectedClass);
    } else {
      logger.debug('No class selected, clearing subjects');
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    logger.info('Starting fetchClasses...');
    try {
      const response = await fetchWithLogging(API_URLS.CLASSES);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('Classes fetched successfully:', data);
      setClasses(data);
    } catch (err) {
      logger.error('Failed to fetch classes:', err);
      setError('Failed to fetch classes');
    }
  };

  const fetchSubjects = async (classId) => {
    logger.info(`Starting fetchSubjects for class ID: ${classId}`);
    try {
      const url = `${API_URLS.SUBJECTS}?class_id=${classId}`;
      const response = await fetchWithLogging(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('Subjects fetched successfully:', data);
      setSubjects(data);
    } catch (err) {
      logger.error('Failed to fetch subjects:', err);
      setError('Failed to fetch subjects');
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    logger.info('PDF upload triggered:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      selectedSubject: selectedSubject
    });
    
    if (file && file.type === 'application/pdf') {
      if (!selectedSubject) {
        logger.warn('PDF upload attempted without subject selection');
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

      logger.info('Starting complete workflow processing...');
      // Automatically start the processing chain
      await processCompleteWorkflow(file);
    } else {
      logger.warn('Invalid file type selected:', file?.type);
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
      logger.debug('Starting image compression:', {
        originalSize: getBase64SizeInMB(base64String).toFixed(2) + 'MB',
        quality,
        maxWidth
      });
      
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
        
        logger.debug('Image compression completed:', {
          originalSize: getBase64SizeInMB(base64String).toFixed(2) + 'MB',
          compressedSize: getBase64SizeInMB(base64Data).toFixed(2) + 'MB',
          newDimensions: `${width}x${height}`
        });
        
        resolve(base64Data);
      };
      
      img.src = `data:image/png;base64,${base64String}`;
    });
  };

  // New function to check and compress images if needed
  const checkAndCompressImages = async (imageList) => {
    logger.info(`Starting image compression check for ${imageList.length} images`);
    const processedImages = [];
    let compressionCount = 0;
    
    for (let i = 0; i < imageList.length; i++) {
      const image = imageList[i];
      const sizeInMB = getBase64SizeInMB(image.data);
      
      logger.debug(`Image ${i + 1} size: ${sizeInMB.toFixed(2)}MB`);
      
      if (sizeInMB > 4) {
        logger.info(`Compressing image ${i + 1} (${sizeInMB.toFixed(2)}MB > 4MB)`);
        
        // Compress the image
        const compressedData = await compressBase64Image(image.data, 0.8, 1920);
        const newSizeInMB = getBase64SizeInMB(compressedData);
        
        // If it's still too large, compress more aggressively
        let finalData = compressedData;
        if (newSizeInMB > 4) {
          logger.info(`Image ${i + 1} still too large, applying more compression`);
          finalData = await compressBase64Image(image.data, 0.6, 1600);
          const finalSizeInMB = getBase64SizeInMB(finalData);
          
          // Last resort - very aggressive compression
          if (finalSizeInMB > 4) {
            logger.warn(`Image ${i + 1} requires aggressive compression`);
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
    
    logger.info(`Image compression complete: ${compressionCount} images compressed`);
    return { images: processedImages, compressionCount };
  };

  const processCompleteWorkflow = async (file) => {
    logger.info('Starting complete workflow processing');
    setLoading(true);
    setError('');

    try {
      // Step 1: Convert PDF to Images
      logger.info('Step 1: Converting PDF to images');
      setStep(1);
      const convertedImages = await convertPdfToImages(file);
      
      // Step 2: Check and compress images if needed
      logger.info('Step 2: Checking and compressing images');
      setStep(2);
      const { images: processedImages, compressionCount } = await checkAndCompressImages(convertedImages);
      
      if (compressionCount > 0) {
        setSuccess(`Compressed ${compressionCount} images to reduce size for processing.`);
      }
      
      // Step 3: Perform OCR
      logger.info('Step 3: Performing OCR');
      setStep(3);
      const ocrData = await performOCR(processedImages);
      
      // Step 4: Save to Database
      logger.info('Step 4: Saving to database');
      setStep(4);
      const saveResult = await saveToDatabase(ocrData);
      
      // Step 5: Call additional API (Context Upload)
      logger.info('Step 5: Uploading context');
      setStep(5);
      await callAdditionalAPI(selectedSubject);
      
      // Step 6: Generate Rubrics
      logger.info('Step 6: Generating rubrics');
      setStep(6);
      await generateRubrics(selectedSubject);
      
      setStep(7); // Final step
      logger.info('Workflow completed successfully');
      setSuccess(`Processing completed successfully! Key OCR saved, context uploaded, and rubrics generated for subject.`);
      
      // Reset form after successful completion
      setTimeout(() => {
        resetForm();
      }, 5000);

    } catch (err) {
      logger.error('Workflow failed:', err);
      setError(`Processing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const convertPdfToImages = async (file) => {
    logger.info('Starting PDF to images conversion:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      logger.debug('FormData prepared for PDF conversion');
      
      const response = await fetchWithLogging(API_URLS.CONVERT_PDF, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to convert PDF`);
      }

      const result = await response.json();
      logger.info('PDF conversion successful:', {
        imageCount: result.images?.length || 0,
        resultKeys: Object.keys(result)
      });
      
      setImages(result.images);
      return result.images;
    } catch (err) {
      logger.error('PDF conversion failed:', err);
      throw new Error(`PDF conversion failed: ${err.message}`);
    }
  };

  const performOCR = async (imageList) => {
    logger.info(`Starting OCR processing for ${imageList.length} images`);
    
    if (imageList.length === 0) {
      logger.error('No images available for OCR');
      throw new Error('No images available for OCR');
    }

    const results = [];

    try {
      for (let i = 0; i < imageList.length; i++) {
        const image = imageList[i];
        logger.info(`Processing OCR for image ${i + 1}/${imageList.length}`);
        
        const requestPayload = {
          image_data: image.data
        };
        
        logger.debug(`OCR request payload for image ${i + 1}:`, {
          dataLength: image.data.length,
          filename: image.filename
        });
        
        const response = await fetchWithLogging(API_URLS.EXTRACT_TEXT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: OCR failed for page ${i + 1}`);
        }

        const ocrResult = await response.json();
        logger.info(`OCR completed for image ${i + 1}:`, {
          resultKeys: Object.keys(ocrResult),
          hasText: !!ocrResult.text
        });
        
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
      
      logger.info('OCR processing completed:', {
        totalPages: combined.total_pages,
        combinedDataSize: JSON.stringify(combined).length
      });
      
      setCombinedOCR(combined);
      return combined;
    } catch (err) {
      logger.error('OCR processing failed:', err);
      throw new Error(`OCR processing failed: ${err.message}`);
    }
  };

  const saveToDatabase = async (ocrData) => {
    logger.info('Starting database save operation');
    
    if (!selectedSubject || !ocrData) {
      logger.error('Missing required data for database save:', {
        hasSubject: !!selectedSubject,
        hasOcrData: !!ocrData
      });
      throw new Error('Missing subject selection or OCR data');
    }

    try {
      const payload = {
        subject_id: selectedSubject,
        key_json: ocrData
      };

      logger.debug('Database save payload:', {
        subject_id: selectedSubject,
        dataSize: JSON.stringify(payload).length,
        totalPages: ocrData.total_pages
      });

      const response = await fetchWithLogging(API_URLS.KEY_OCR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('Database save failed:', {
          status: response.status,
          result: result
        });
        throw new Error(result.error || 'Failed to save to database');
      }

      logger.info('Database save successful:', result);
      return result;
    } catch (err) {
      logger.error('Database save error:', err);
      throw new Error(`Save failed: ${err.message}`);
    }
  };

  const callAdditionalAPI = async (subjectId) => {
    logger.info(`Starting context upload for subject: ${subjectId}`);
    
    try {
      const url = `${API_URLS.CONTEXT_UPLOAD}${subjectId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Context upload API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP ${response.status}: Failed to upload context`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        logger.error('Context upload non-JSON response:', {
          contentType: contentType,
          responseText: responseText
        });
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      logger.info('Context upload successful:', result);
      return result;
    } catch (err) {
      logger.error('Context upload failed:', err);
      
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
    logger.info(`Starting rubrics generation for subject: ${subjectId}`);
    
    try {
      const url = `${API_URLS.GENERATE_RUBRICS}${subjectId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Rubrics generation API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP ${response.status}: Failed to generate rubrics`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        logger.error('Rubrics generation non-JSON response:', {
          contentType: contentType,
          responseText: responseText
        });
        throw new Error('Rubrics server returned non-JSON response');
      }

      const result = await response.json();
      
      if (result.status === 'error') {
        logger.error('Rubrics generation returned error:', result);
        throw new Error(result.message || 'Rubrics generation failed');
      }

      logger.info('Rubrics generation successful:', result);
      return result;
    } catch (err) {
      logger.error('Rubrics generation failed:', err);
      
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
    logger.info('Resetting form');
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

  // Log component state changes
  useEffect(() => {
    logger.debug('Component state changed:', {
      selectedClass,
      selectedSubject,
      step,
      loading,
      hasError: !!error,
      hasSuccess: !!success,
      imagesCount: images.length,
      ocrResultsCount: ocrResults.length
    });
  }, [selectedClass, selectedSubject, step, loading, error, success, images, ocrResults]);

  return (
    <div className="keyocr-container">
      <h1 className="main-title">Question Paper Upload.</h1>

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