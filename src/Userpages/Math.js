import React, { useState, useEffect } from 'react';
import { Calculator, User, BookOpen, GraduationCap, ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, FileText, Image } from 'lucide-react';

const MathProcessingPage = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadResults, setUploadResults] = useState({
    images: [],
    scriptId: null
  });

  const DJANGO_API_BASE = 'https://transback.transpoze.ai';
  const MATHFIR_API_BASE = 'https://transback.transpoze.ai/mathfir';
  const MATHRES_API_BASE = 'https://transback.transpoze.ai/mathres';
  const APP_API_BASE = 'https://transback.transpoze.ai/app';

  const steps = [
    { name: 'Upload PDF', icon: Upload },
    { name: 'Convert to Images', icon: Image },
    { name: 'Save Images', icon: CheckCircle },
    { name: 'Convert Images', icon: Calculator },
    { name: 'Restructure Data', icon: FileText }
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

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedSubject('');
    setSelectedStudent('');
    setSubjects([]);
    setStudents([]);
    
    if (classId) {
      fetchSubjects(classId);
      fetchStudents(classId);
    }
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
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
      const data = await apiCall(`${APP_API_BASE}/convert-pdf`, { method: 'POST', body: formData });
      
      setUploadResults(prev => ({ ...prev, images: data.images }));
      setCurrentStep(2);
      await saveImagesToDatabase(data.images);
    } catch (err) {
      setError('Network error: ' + err.message);
      setProcessing(false);
    }
  };

  const saveImagesToDatabase = async (imageData) => {
    setCurrentStep(2);

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
      
      // Now call the two required APIs
      setCurrentStep(3);
      await convertImages(scriptId);
      
    } catch (err) {
      setError('Failed to save images to database: ' + err.message);
      setProcessing(false);
    }
  };

  const convertImages = async (scriptId) => {
    setCurrentStep(3);

    try {
      // Try POST method first (most common for API endpoints)
      let convertResponse;
      
      try {
        convertResponse = await fetch(`${MATHFIR_API_BASE}/convert-images/${scriptId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'MyApp/1.0'
          },
          body: JSON.stringify({ script_id: scriptId })
        });
      } catch (postError) {
        console.log('POST failed, trying GET method:', postError.message);
        
        // If POST fails, try GET as fallback
        convertResponse = await fetch(`${MATHFIR_API_BASE}/convert-images/${scriptId}`, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'MyApp/1.0'
          }
        });
      }

      if (!convertResponse.ok) {
        const errorText = await convertResponse.text();
        
        // If we get 405, try alternative endpoints
        if (convertResponse.status === 405) {
          console.log('Method not allowed, trying alternative endpoint...');
          
          // Try different endpoint patterns
          const alternativeEndpoints = [
            `${MATHFIR_API_BASE}/convert-images`,
            `${MATHFIR_API_BASE}/process/${scriptId}`,
            `${MATHFIR_API_BASE}/convert/${scriptId}`
          ];
          
          let alternativeSuccess = false;
          
          for (const endpoint of alternativeEndpoints) {
            try {
              const altResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true',
                  'User-Agent': 'MyApp/1.0'
                },
                body: JSON.stringify({ script_id: scriptId })
              });
              
              if (altResponse.ok) {
                convertResponse = altResponse;
                alternativeSuccess = true;
                console.log(`Success with alternative endpoint: ${endpoint}`);
                break;
              }
            } catch (altError) {
              console.log(`Alternative endpoint ${endpoint} failed:`, altError.message);
              continue;
            }
          }
          
          if (!alternativeSuccess) {
            throw new Error(`All convert-images endpoints failed. Original error: HTTP ${convertResponse.status}: ${convertResponse.statusText} - ${errorText}`);
          }
        } else {
          throw new Error(`Convert Images API failed: HTTP ${convertResponse.status}: ${convertResponse.statusText} - ${errorText}`);
        }
      }

      const convertResult = await convertResponse.json();
      console.log('Convert Images Result:', convertResult);

      // Now call restructure API
      setCurrentStep(4);
      await restructureData(scriptId);
      
    } catch (err) {
      setError(`Image conversion failed: ${err.message}`);
      setProcessing(false);
    }
  };

  const restructureData = async (scriptId) => {
  setCurrentStep(4);

  try {
    // MathRes restructure API only accepts GET requests
    const restructureResponse = await fetch(`${MATHRES_API_BASE}/restructure/${selectedSubject}/${scriptId}`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'MyApp/1.0'
      }
    });

    if (!restructureResponse.ok) {
      const errorText = await restructureResponse.text();
      throw new Error(`Restructure API failed: HTTP ${restructureResponse.status}: ${restructureResponse.statusText} - ${errorText}`);
    }

    const restructureResult = await restructureResponse.json();
    console.log('Restructure Result:', restructureResult);

    // Processing complete
    setProcessing(false);
    alert('Processing completed successfully!');
    
  } catch (err) {
    setError(`Data restructuring failed: ${err.message}`);
    setProcessing(false);
  }
};

  const resetForm = () => {
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedStudent('');
    setPdfFile(null);
    setSubjects([]);
    setStudents([]);
    setError('');
    setCurrentStep(0);
    setUploadResults({ images: [], scriptId: null });
  };

  const selectedClassData = classes.find(c => c.class_id === parseInt(selectedClass));
  const selectedSubjectData = subjects.find(s => s.subject_id === parseInt(selectedSubject));
  const selectedStudentData = students.find(s => s.student_id === parseInt(selectedStudent));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <button 
            onClick={() => window.history.back()} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#4f46e5',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              Math Processing Center
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
              Upload PDF and process mathematical content
            </p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted ? '#10b981' : isActive ? '#4f46e5' : '#e5e7eb',
                  color: isCompleted || isActive ? '#fff' : '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
                </div>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: isActive ? 'bold' : 'normal',
                  color: isCompleted ? '#10b981' : isActive ? '#4f46e5' : '#6b7280'
                }}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '1rem', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            color: '#dc2626',
            marginBottom: '2rem'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            Select Class, Subject & Student
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                <GraduationCap size={18} />
                Select Class
              </label>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem' 
                }}
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

            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                <BookOpen size={18} />
                Select Subject
              </label>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem' 
                }}
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

            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                <User size={18} />
                Select Student
              </label>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem' 
                }}
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
          </div>

          {selectedClassData && selectedSubjectData && selectedStudentData && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '6px', 
              marginBottom: '2rem' 
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>Selected Information:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={16} />
                  <span>Class: {selectedClassData.class_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={16} />
                  <span>Subject: {selectedSubjectData.subject_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} />
                  <span>Student: {selectedStudentData.name} ({selectedStudentData.roll_number})</span>
                </div>
                {uploadResults.scriptId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} />
                    <span>Script ID: {uploadResults.scriptId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Section */}
          {selectedStudent && selectedSubject && currentStep === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #d1d5db', borderRadius: '8px' }}>
              <Upload size={48} style={{ color: '#6b7280', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>Upload Math Problem PDF</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>Select the PDF file containing mathematical problems for processing</p>
              
              <label style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                Choose PDF File
              </label>
              
              {pdfFile && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  marginTop: '1rem' 
                }}>
                  <FileText size={20} />
                  <span>{pdfFile.name}</span>
                  <span style={{ color: '#6b7280' }}>({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
              
              {pdfFile && (
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '1rem auto 0',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                  onClick={convertPdfToImages}
                >
                  <Upload size={20} />
                  Start Processing
                </button>
              )}
            </div>
          )}
        </div>

        {processing && (
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '3rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            textAlign: 'center' 
          }}>
            <Loader2 size={48} style={{ color: '#4f46e5', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {currentStep === 1 && "Converting PDF to images..."}
              {currentStep === 2 && "Saving images to database..."}
              {currentStep === 3 && "Converting images with MathFir API..."}
              {currentStep === 4 && "Restructuring data with MathRes API..."}
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
              {currentStep === 1 && "Converting your PDF document into high-quality images for processing..."}
              {currentStep === 2 && "Saving processed images to the database and creating script record..."}
              {currentStep === 3 && "Processing images through the MathFir conversion API..."}
              {currentStep === 4 && "Restructuring the processed data through the MathRes API..."}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '2rem', 
              fontSize: '0.875rem', 
              color: '#6b7280' 
            }}>
              <span>Subject ID: {selectedSubject}</span>
              {uploadResults.scriptId && <span>Script ID: {uploadResults.scriptId}</span>}
              <span>Student: {selectedStudentData?.name}</span>
              {uploadResults.images.length > 0 && <span>Images: {uploadResults.images.length} pages</span>}
            </div>
          </div>
        )}

        {/* Show uploaded images */}
        {uploadResults.images.length > 0 && !processing && (
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '2rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>Uploaded Images</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              {uploadResults.images.slice(0, 4).map((image, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <img
                    src={`data:image/jpeg;base64,${image.data}`}
                    alt={`Page ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover', 
                      borderRadius: '6px', 
                      border: '1px solid #e5e7eb' 
                    }}
                  />
                  <span style={{ 
                    display: 'block', 
                    marginTop: '0.5rem', 
                    fontSize: '0.875rem', 
                    color: '#6b7280' 
                  }}>
                    Page {index + 1}
                  </span>
                </div>
              ))}
              {uploadResults.images.length > 4 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '200px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '6px', 
                  border: '1px solid #e5e7eb' 
                }}>
                  <span style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                    +{uploadResults.images.length - 4} more
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button 
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
                onClick={resetForm}
              >
                Process Another Script
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MathProcessingPage;