import React, { useState, useEffect } from 'react';
import { Calculator, User, BookOpen, GraduationCap, ArrowLeft, Search, Loader2, CheckCircle, AlertCircle, Download, RefreshCw, BarChart, FileText, Upload, Image } from 'lucide-react';
import '../csstemplates/MathProcessingPage.css';

const MathProcessingPage = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [scripts, setScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadResults, setUploadResults] = useState({
    images: [],
    scriptId: null
  });
  const [processingMode, setProcessingMode] = useState('existing'); // 'existing' or 'upload'

  const DJANGO_API_BASE = 'https://transback.transpoze.ai';
  const MATH_API_BASE = 'https://transback.transpoze.ai/math';
  const API_BASE = 'https://transback.transpoze.ai/app';

  const steps = [
    { name: 'Upload PDF', icon: Upload },
    { name: 'Convert to Images', icon: Image },
    { name: 'Save Images', icon: CheckCircle },
    { name: 'Process Math Data', icon: Calculator }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/classes/`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (err) {
      setError('Failed to load classes');
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/subjects/?class_id=${classId}`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (err) {
      setError('Failed to load subjects');
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/students/?class_id=${classId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      setError('Failed to load students');
    }
  };

  const fetchScripts = async (studentId, subjectId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/scripts/?student_id=${studentId}&subject_id=${subjectId}`);
      if (response.ok) {
        const data = await response.json();
        setScripts(data);
      }
    } catch (err) {
      setError('Failed to load scripts');
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedSubject('');
    setSelectedStudent('');
    setSelectedScript('');
    setSubjects([]);
    setStudents([]);
    setScripts([]);
    
    if (classId) {
      fetchSubjects(classId);
      fetchStudents(classId);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setSelectedScript('');
    setScripts([]);
    
    if (subjectId && selectedStudent && processingMode === 'existing') {
      fetchScripts(selectedStudent, subjectId);
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    setSelectedScript('');
    setScripts([]);
    
    if (studentId && selectedSubject && processingMode === 'existing') {
      fetchScripts(studentId, selectedSubject);
    }
  };

  const handleScriptChange = (e) => {
    setSelectedScript(e.target.value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
      setUploadResults({ images: [], scriptId: null });
      setCurrentStep(0);
    } else {
      setError('Please select a valid PDF file');
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
      
      setUploadResults(prev => ({ ...prev, images: data.images }));
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
        student_id: selectedStudent,
        subject_id: selectedSubject
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
            `${DJANGO_API_BASE}/scripts/?student_id=${selectedStudent}&subject_id=${selectedSubject}`
          );
          const existingScript = existingScripts.find(
            script => script.student_id === parseInt(selectedStudent) && 
                     script.subject_id === parseInt(selectedSubject)
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

      setUploadResults(prev => ({ ...prev, scriptId }));

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

      setUploadResults(prev => ({ ...prev, savedImages }));
      setCurrentStep(3);
      
      // Now process with math API
      await processMathData(selectedSubject, scriptId);
      
    } catch (err) {
      setError('Failed to save images to database: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processMathData = async (subjectId = null, scriptId = null) => {
    const finalSubjectId = subjectId || selectedSubject;
    const finalScriptId = scriptId || selectedScript;

    if (!finalSubjectId || !finalScriptId) {
      setError('Please select both subject and script');
      return;
    }

    if (processingMode === 'existing') {
      setProcessing(true);
    }
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${MATH_API_BASE}/${finalScriptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'MyApp/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      setResults(result);
    } catch (err) {
      setError(`Math processing failed: ${err.message}`);
    } finally {
      if (processingMode === 'existing') {
        setProcessing(false);
      }
    }
  };

  const downloadResults = () => {
    if (results) {
      const selectedStudentData = students.find(s => s.student_id === parseInt(selectedStudent));
      const selectedSubjectData = subjects.find(s => s.subject_id === parseInt(selectedSubject));
      
      const filename = `math_results_${selectedStudentData?.name || 'student'}_${selectedSubjectData?.subject_name || 'subject'}_${Date.now()}.json`;
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', filename);
      linkElement.click();
    }
  };

  const resetForm = () => {
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedStudent('');
    setSelectedScript('');
    setPdfFile(null);
    setSubjects([]);
    setStudents([]);
    setScripts([]);
    setResults(null);
    setError('');
    setCurrentStep(0);
    setUploadResults({ images: [], scriptId: null });
    setProcessingMode('existing');
  };

  const selectedClassData = classes.find(c => c.class_id === parseInt(selectedClass));
  const selectedSubjectData = subjects.find(s => s.subject_id === parseInt(selectedSubject));
  const selectedStudentData = students.find(s => s.student_id === parseInt(selectedStudent));
  const selectedScriptData = scripts.find(s => s.script_id === parseInt(selectedScript));

  return (
    <div className="math-page">
      <header className="math-header">
        <div className="container">
          <button onClick={() => window.history.back()} className="back-button">
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <div className="math-title-section">
            <h1 className="math-title">Math Processing Center</h1>
            <p className="math-subtitle">Process mathematical content using advanced AI algorithms</p>
          </div>
        </div>
      </header>

      <main className="math-main">
        <div className="container">
          {/* Progress Steps - Only show when upload mode */}
          {processingMode === 'upload' && (
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
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Processing Mode Selection */}
          <div className="mode-selection">
            <h2 className="section-title">Choose Processing Mode</h2>
            <div className="mode-buttons">
              <button 
                className={`mode-btn ${processingMode === 'existing' ? 'active' : ''}`}
                onClick={() => {
                  setProcessingMode('existing');
                  setPdfFile(null);
                  setCurrentStep(0);
                  setUploadResults({ images: [], scriptId: null });
                }}
              >
                <FileText size={20} />
                <span>Use Existing Script</span>
                <small>Process an already uploaded script</small>
              </button>
              <button 
                className={`mode-btn ${processingMode === 'upload' ? 'active' : ''}`}
                onClick={() => {
                  setProcessingMode('upload');
                  setSelectedScript('');
                  setScripts([]);
                }}
              >
                <Upload size={20} />
                <span>Upload New PDF</span>
                <small>Upload and process a new PDF document</small>
              </button>
            </div>
          </div>

          <div className="selection-section">
            <h2 className="section-title">
              <Search size={24} />
              Select Class, Subject & Student
            </h2>
            
            <div className="selection-grid">
              <div className="form-group">
                <label className="form-label">
                  <GraduationCap size={18} />
                  Select Class
                </label>
                <select 
                  className="form-select" 
                  value={selectedClass} 
                  onChange={handleClassChange}
                >
                  <option value="">Choose a class...</option>
                  {classes.map(cls => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <BookOpen size={18} />
                  Select Subject
                </label>
                <select 
                  className="form-select" 
                  value={selectedSubject} 
                  onChange={handleSubjectChange}
                  disabled={!selectedClass}
                >
                  <option value="">Choose a subject...</option>
                  {subjects.map(subject => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={18} />
                  Select Student
                </label>
                <select 
                  className="form-select" 
                  value={selectedStudent} 
                  onChange={handleStudentChange}
                  disabled={!selectedClass}
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.name} ({student.roll_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Script Selection - Only for existing mode */}
              {processingMode === 'existing' && (
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={18} />
                    Select Script
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedScript} 
                    onChange={handleScriptChange}
                    disabled={!selectedStudent || !selectedSubject}
                  >
                    <option value="">Choose a script...</option>
                    {scripts.map(script => (
                      <option key={script.script_id} value={script.script_id}>
                        Script #{script.script_id} - {new Date(script.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedClassData && selectedSubjectData && selectedStudentData && (
              <div className="selection-info">
                <h3>Selected Information:</h3>
                <div className="selection-item">
                  <GraduationCap size={16} />
                  <span>Class: {selectedClassData.class_name}</span>
                </div>
                <div className="selection-item">
                  <BookOpen size={16} />
                  <span>Subject: {selectedSubjectData.subject_name}</span>
                </div>
                <div className="selection-item">
                  <User size={16} />
                  <span>Student: {selectedStudentData.name} ({selectedStudentData.roll_number})</span>
                </div>
                {selectedScriptData && processingMode === 'existing' && (
                  <div className="selection-item">
                    <FileText size={16} />
                    <span>Script: #{selectedScriptData.script_id} - {new Date(selectedScriptData.created_at).toLocaleDateString()}</span>
                  </div>
                )}
                {processingMode === 'upload' && uploadResults.scriptId && (
                  <div className="selection-item">
                    <FileText size={16} />
                    <span>New Script ID: {uploadResults.scriptId}</span>
                  </div>
                )}
              </div>
            )}

            {/* Upload Section - Only for upload mode */}
            {processingMode === 'upload' && selectedStudent && selectedSubject && currentStep === 0 && (
              <div className="upload-section">
                <div className="upload-card">
                  <Upload size={48} className="upload-icon" />
                  <h3>Upload Math Problem PDF</h3>
                  <p>Select the PDF file containing mathematical problems for processing</p>
                  
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
                    <Upload size={20} />
                    Start Processing
                  </button>
                )}
              </div>
            )}

            {/* Process Button - For existing scripts */}
            {processingMode === 'existing' && selectedSubject && selectedScript && (
              <button 
                className="process-btn" 
                onClick={() => processMathData()}
                disabled={processing}
              >
                <Calculator size={20} />
                {processing ? 'Processing...' : 'Process Math Data'}
              </button>
            )}
          </div>

          {processing && (
            <div className="processing-section">
              <div className="processing-card">
                <Loader2 size={48} className="spinner" />
                <h2>
                  {currentStep === 1 && "Converting PDF to images..."}
                  {currentStep === 2 && "Saving images to database..."}
                  {currentStep === 3 && "Processing Mathematical Content"}
                  {processingMode === 'existing' && "Processing Mathematical Content"}
                </h2>
                <p>
                  {currentStep === 1 && "Converting your PDF document into high-quality images for processing..."}
                  {currentStep === 2 && "Saving processed images to the database and creating script record..."}
                  {(currentStep === 3 || processingMode === 'existing') && "Analyzing mathematical expressions and solving problems using AI algorithms..."}
                </p>
                <div className="processing-info">
                  <span>Subject ID: {selectedSubject}</span>
                  {processingMode === 'upload' && uploadResults.scriptId && <span>Script ID: {uploadResults.scriptId}</span>}
                  {processingMode === 'existing' && <span>Script ID: {selectedScript}</span>}
                  <span>Student: {selectedStudentData?.name}</span>
                  {processingMode === 'upload' && uploadResults.images.length > 0 && <span>Images: {uploadResults.images.length} pages</span>}
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="results-section">
              <div className="results-header">
                <h2>Math Processing Complete</h2>
                <div className="results-summary">
                  <p>Mathematical content has been successfully processed for:</p>
                  <div className="summary-details">
                    <span><strong>Student:</strong> {selectedStudentData?.name}</span>
                    <span><strong>Subject:</strong> {selectedSubjectData?.subject_name}</span>
                    <span><strong>Script ID:</strong> {processingMode === 'upload' ? uploadResults.scriptId : selectedScript}</span>
                    <span><strong>Processed At:</strong> {new Date().toLocaleString()}</span>
                    {processingMode === 'upload' && <span><strong>Pages Uploaded:</strong> {uploadResults.images.length}</span>}
                  </div>
                </div>
              </div>

              {/* Show uploaded images if in upload mode */}
              {processingMode === 'upload' && uploadResults.images.length > 0 && (
                <div className="uploaded-images">
                  <h3>Uploaded Images</h3>
                  <div className="images-grid">
                    {uploadResults.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="image-preview">
                        <img
                          src={`data:image/jpeg;base64,${image.data}`}
                          alt={`Page ${index + 1}`}
                          className="preview-image"
                        />
                        <span className="image-label">Page {index + 1}</span>
                      </div>
                    ))}
                    {uploadResults.images.length > 4 && (
                      <div className="image-preview more-images">
                        <span>+{uploadResults.images.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="results-content">
                <div className="result-card">
                  <div className="result-header">
                    <BarChart size={24} />
                    <h3>Processing Results</h3>
                    <span className="result-status success">Completed</span>
                  </div>
                  <div className="result-body">
                    <div className="result-preview">
                      <pre className="json-preview">
                        {JSON.stringify(results, null, 2)}
                      </pre>
                    </div>
                    <div className="result-stats">
                      {results.total_problems && (
                        <div className="stat-item">
                          <span className="stat-label">Problems Analyzed:</span>
                          <span className="stat-value">{results.total_problems}</span>
                        </div>
                      )}
                      {results.solutions_found && (
                        <div className="stat-item">
                          <span className="stat-label">Solutions Found:</span>
                          <span className="stat-value">{results.solutions_found}</span>
                        </div>
                      )}
                      {results.accuracy_score && (
                        <div className="stat-item">
                          <span className="stat-label">Accuracy Score:</span>
                          <span className="stat-value">{results.accuracy_score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="result-actions">
                    <button className="btn-download" onClick={downloadResults}>
                      <Download size={16} />
                      Download Results
                    </button>
                  </div>
                </div>
              </div>

              <div className="results-actions">
                <button className="btn-primary" onClick={resetForm}>
                  <RefreshCw size={16} />
                  Process Another Script
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MathProcessingPage;