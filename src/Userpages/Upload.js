// import React, { useState, useEffect } from 'react';
// import { Upload, FileText, Image, Eye, Download, Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, User, BookOpen, GraduationCap } from 'lucide-react';
// import '../csstemplates/UploadPage.css';

// const UploadPage = () => {
//   const [selectedData, setSelectedData] = useState(null);
//   const [pdfFile, setPdfFile] = useState(null);
//   const [processing, setProcessing] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [keyOcrData, setKeyOcrData] = useState(null);
//   const [results, setResults] = useState({
//     images: [],
//     ocrResults: [],
//     restructuredOutput: null,
//     scriptId: null
//   });
//   const [error, setError] = useState('');

//   const API_BASE = 'http://localhost:5015'; // Your Flask server URL
//   const DJANGO_API_BASE = 'http://localhost:8000'; // Your Django server URL
//   const CORRECTION_API_BASE = 'https://92cb-115-108-34-139.ngrok-free.app'; // OCR Correction API

//   const steps = [
//     { name: 'Upload PDF', icon: Upload },
//     { name: 'Convert to Images', icon: Image },
//     { name: 'Save Images', icon: CheckCircle },
//     { name: 'Extract Text (OCR)', icon: FileText },
//     { name: 'Restructure Data', icon: RefreshCw },
//     { name: 'Save to Database', icon: CheckCircle },
//     { name: 'Correct OCR Data', icon: RefreshCw },
//     { name: 'View Results', icon: Eye }
//   ];

//   // Load selected data from sessionStorage and fetch key OCR
//   useEffect(() => {
//     const savedData = sessionStorage.getItem('selectedData');
//     if (savedData) {
//       const parsedData = JSON.parse(savedData);
//       setSelectedData(parsedData);
      
//       // Fetch key OCR data for the selected subject
//       if (parsedData.subject && parsedData.subject.subject_id) {
//         fetchKeyOcr(parsedData.subject.subject_id);
//       }
//     }
//   }, []);

//   const fetchKeyOcr = async (subjectId) => {
//     try {
//       const response = await fetch(`${DJANGO_API_BASE}/key-ocr/?subject_id=${subjectId}`);
      
//       if (response.ok) {
//         const keyOcrData = await response.json();
//         setKeyOcrData(keyOcrData);
//         console.log('Key OCR data loaded:', keyOcrData);
//       } else if (response.status === 404) {
//         console.warn('No key OCR found for this subject');
//         setKeyOcrData(null);
//       } else {
//         const errorData = await response.json();
//         console.error('Failed to fetch key OCR:', errorData);
//         setError(`Warning: Could not load answer key data - ${errorData.error}`);
//       }
//     } catch (err) {
//       console.error('Network error fetching key OCR:', err);
//       setError('Warning: Could not connect to database for answer key data');
//     }
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (file && file.type === 'application/pdf') {
//       setPdfFile(file);
//       setError('');
//       setResults({ images: [], ocrResults: [], restructuredOutput: null, scriptId: null });
//       setCurrentStep(0);
//     } else {
//       setError('Please select a valid PDF file');
//     }
//   };

//   const convertPdfToImages = async () => {
//     if (!pdfFile) return;

//     setProcessing(true);
//     setCurrentStep(1);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('pdf', pdfFile);

//       const response = await fetch(`${API_BASE}/convert-pdf`, {
//         method: 'POST',
//         body: formData
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setResults(prev => ({ ...prev, images: data.images }));
//         setCurrentStep(2);
//         // Automatically proceed to save images to database
//         await saveImagesToDatabase(data.images);
//       } else {
//         setError(data.error || 'Failed to convert PDF');
//       }
//     } catch (err) {
//       setError('Network error: ' + err.message);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const saveImagesToDatabase = async (imageData) => {
//     setCurrentStep(2);
//     setProcessing(true);

//     try {
//       // First, create the script record
//       const scriptData = {
//         student_id: selectedData.student.student_id,
//         subject_id: selectedData.subject.subject_id
//       };

//       const scriptResponse = await fetch(`${DJANGO_API_BASE}/scripts/`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(scriptData)
//       });

//       let scriptId;
//       if (scriptResponse.ok) {
//         const scriptResult = await scriptResponse.json();
//         scriptId = scriptResult.script_id;
//       } else if (scriptResponse.status === 400) {
//         // Script might already exist due to unique constraint
//         const errorResponse = await scriptResponse.json();
//         if (errorResponse.error && errorResponse.error.includes('already exists')) {
//           // Try to find existing script
//           const existingScriptsResponse = await fetch(
//             `${DJANGO_API_BASE}/scripts/?student_id=${selectedData.student.student_id}&subject_id=${selectedData.subject.subject_id}`
//           );
          
//           if (existingScriptsResponse.ok) {
//             const existingScripts = await existingScriptsResponse.json();
//             const existingScript = existingScripts.find(
//               script => script.student_id === selectedData.student.student_id && 
//                        script.subject_id === selectedData.subject.subject_id
//             );
            
//             if (existingScript) {
//               scriptId = existingScript.script_id;
//             } else {
//               throw new Error('Failed to find existing script record');
//             }
//           } else {
//             throw new Error('Failed to retrieve existing script record');
//           }
//         } else {
//           throw new Error(`Failed to create script record: ${errorResponse.error}`);
//         }
//       } else {
//         const errorResponse = await scriptResponse.json();
//         throw new Error(`Failed to create script record: ${errorResponse.error || 'Unknown error'}`);
//       }

//       // **FIX: Update results state with scriptId immediately**
//       setResults(prev => ({ 
//         ...prev, 
//         scriptId
//       }));

//       // Save each image to ScriptImage model
//       const savedImages = [];
//       for (let i = 0; i < imageData.length; i++) {
//         const imageRecord = {
//           script_id: scriptId,
//           page_number: i + 1,
//           image_data: imageData[i].data, // Base64 encoded image data
//           image_filename: imageData[i].filename,
//           image_path: imageData[i].path || ''
//         };

//         const imageResponse = await fetch(`${DJANGO_API_BASE}/script-images/`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(imageRecord)
//         });

//         if (imageResponse.ok) {
//           const savedImage = await imageResponse.json();
//           savedImages.push(savedImage);
//           console.log(`Image saved for page ${i + 1}:`, savedImage);
//         } else {
//           const errorData = await imageResponse.json();
//           console.error(`Failed to save image for page ${i + 1}:`, errorData);
//           // Continue with other images even if one fails
//         }
//       }

//       // Update results with saved images info
//       setResults(prev => ({ 
//         ...prev, 
//         savedImages 
//       }));

//       setCurrentStep(3);
//       // Automatically proceed to OCR with the scriptId
//       await extractTextFromImages(imageData, scriptId);
      
//     } catch (err) {
//       setError('Failed to save images to database: ' + err.message);
//       console.error('Image save error:', err);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // **FIX: Pass scriptId as parameter to ensure it's available**
//   const extractTextFromImages = async (imageData, scriptId) => {
//     setCurrentStep(3);
//     setProcessing(true);
//     const ocrResults = [];

//     try {
//       for (let i = 0; i < imageData.length; i++) {
//         const response = await fetch(`${API_BASE}/extract-text`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             image_data: imageData[i].data
//           })
//         });

//         if (response.ok) {
//           const result = await response.json();
//           ocrResults.push({
//             page: i + 1,
//             imagePath: imageData[i].path,
//             filename: imageData[i].filename,
//             data: result
//           });
//         } else {
//           const errorData = await response.json();
//           throw new Error(`OCR failed for page ${i + 1}: ${errorData.error || 'Unknown error'}`);
//         }
//       }

//       setResults(prev => ({ ...prev, ocrResults }));
//       setCurrentStep(4);
      
//       // Automatically proceed to restructuring with scriptId
//       await restructureData(ocrResults, scriptId);
      
//     } catch (err) {
//       setError('OCR processing failed: ' + err.message);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // **FIX: Pass scriptId as parameter**
//   const restructureData = async (ocrResults, scriptId) => {
//     setCurrentStep(4);
//     setProcessing(true);

//     try {
//       // Check if we have key OCR data
//       if (!keyOcrData || !keyOcrData.key_json) {
//         throw new Error('No answer key data available for this subject. Please upload the answer key first.');
//       }

//       // Create FormData to send JSON files
//       const formData = new FormData();
      
//       // Use the key OCR data from database for key file
//       const keyJsonBlob = new Blob([JSON.stringify(keyOcrData.key_json, null, 2)], {
//         type: 'application/json'
//       });
      
//       // Use student OCR results for student file
//       const studentJsonBlob = new Blob([JSON.stringify(ocrResults, null, 2)], {
//         type: 'application/json'
//       });
      
//       formData.append('key', keyJsonBlob, 'key.json');
//       formData.append('student', studentJsonBlob, 'student.json');

//       const response = await fetch(`${API_BASE}/restructure-answers`, {
//         method: 'POST',
//         body: formData
//       });

//       if (response.ok) {
//         const restructuredText = await response.text();
//         setResults(prev => ({ ...prev, restructuredOutput: restructuredText }));
//         setCurrentStep(5);
        
//         // Automatically proceed to save OCR data to database with scriptId
//         await saveOcrDataToDatabase(ocrResults, restructuredText, scriptId);
//       } else {
//         const errorData = await response.json();
//         setError(errorData.error || 'Failed to restructure data');
//       }
//     } catch (err) {
//       setError('Restructuring failed: ' + err.message);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // **FIX: Accept scriptId as parameter instead of trying to get it from results**
//   const saveOcrDataToDatabase = async (ocrResults, restructuredOutput, scriptId) => {
//     setCurrentStep(5);
//     setProcessing(true);

//     try {
//       // **FIX: Use the passed scriptId parameter**
//       if (!scriptId) {
//         throw new Error('No script ID available. Images may not have been saved properly.');
//       }

//       // Process and structure the restructured output properly
//       let structuredJson;
//       try {
//         // Try to parse as JSON first
//         structuredJson = JSON.parse(restructuredOutput);
//       } catch (e) {
//         // If it's not valid JSON, create a structured format
//         structuredJson = {
//           processed_text: restructuredOutput,
//           processing_timestamp: new Date().toISOString(),
//           student_info: {
//             name: selectedData.student.name,
//             roll_number: selectedData.student.roll_number,
//             class_name: selectedData.class.class_name
//           },
//           subject_info: {
//             name: selectedData.subject.subject_name,
//             class_name: selectedData.subject.class_name || selectedData.class.class_name
//           },
//           key_ocr_info: keyOcrData ? {
//             key_ocr_id: keyOcrData.key_ocr_id,
//             created_at: keyOcrData.created_at,
//             updated_at: keyOcrData.updated_at
//           } : null,
//           metadata: {
//             total_pages: ocrResults.length,
//             upload_timestamp: new Date().toISOString(),
//             processing_status: 'completed',
//             has_answer_key: !!keyOcrData
//           }
//         };
//       }

//       // Save OCR data for each page with correct field names
//       const savedOcrData = [];
//       for (const ocrResult of ocrResults) {
//         const ocrData = {
//           script_id: scriptId,
//           page_number: ocrResult.page,
//           ocr_json: ocrResult.data,
//           structured_json: structuredJson,
//           context: `Answer script OCR data - Page ${ocrResult.page} - Student: ${selectedData.student.name} (${selectedData.student.roll_number}) - Subject: ${selectedData.subject.subject_name} - Class: ${selectedData.class.class_name}${keyOcrData ? ' - Answer key used for processing' : ' - No answer key available'}`
//         };

//         const ocrResponse = await fetch(`${DJANGO_API_BASE}/ocr/`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(ocrData)
//         });

//         if (ocrResponse.ok) {
//           const savedOcr = await ocrResponse.json();
//           savedOcrData.push(savedOcr);
//         } else {
//           const errorData = await ocrResponse.json();
//           console.error(`Failed to save OCR data for page ${ocrResult.page}:`, errorData);
//           throw new Error(`Failed to save OCR data for page ${ocrResult.page}: ${errorData.error || 'Unknown error'}`);
//         }
//       }

//       setResults(prev => ({ 
//         ...prev, 
//         savedOcrData 
//       }));
      
//       setCurrentStep(6);
//       // Automatically proceed to OCR correction
//       await correctOcrData(selectedData.subject.subject_id, scriptId);
      
//     } catch (err) {
//       setError('Database save failed: ' + err.message);
//       console.error('Database save error:', err);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // **NEW: OCR Correction API call**
//   const correctOcrData = async (subjectId, scriptId) => {
//     setCurrentStep(6);
//     setProcessing(true);

//     try {
//       console.log(`Calling OCR correction API for subject ${subjectId} and script ${scriptId}`);
      
//       const response = await fetch(`${CORRECTION_API_BASE}/correct_ocr/${subjectId}/${scriptId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
//         }
//       });

//       if (response.ok) {
//         const correctionResult = await response.json();
//         console.log('OCR correction completed successfully:', correctionResult);
        
//         // Update results with correction info
//         setResults(prev => ({ 
//           ...prev, 
//           correctionResult 
//         }));
        
//         setCurrentStep(7); // Move to final step (View Results)
//       } else {
//         const errorData = await response.json();
//         console.error('OCR correction failed:', errorData);
//         // Don't throw error, just log warning and continue to results
//         console.warn(`OCR correction failed but continuing: ${errorData.error || 'Unknown error'}`);
//         setCurrentStep(7); // Still move to results even if correction fails
//       }
//     } catch (err) {
//       console.error('OCR correction network error:', err);
//       // Don't throw error, just log warning and continue to results
//       console.warn(`OCR correction network error but continuing: ${err.message}`);
//       setCurrentStep(7); // Still move to results even if correction fails
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const downloadJSON = () => {
//     if (results.ocrResults.length > 0) {
//       const dataStr = JSON.stringify(results.ocrResults, null, 2);
//       const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
//       const exportFileDefaultName = `ocr_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      
//       const linkElement = document.createElement('a');
//       linkElement.setAttribute('href', dataUri);
//       linkElement.setAttribute('download', exportFileDefaultName);
//       linkElement.click();
//     }
//   };

//   const downloadRestructuredOutput = () => {
//     if (results.restructuredOutput) {
//       const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(results.restructuredOutput);
      
//       const exportFileDefaultName = `restructured_output_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.txt`;
      
//       const linkElement = document.createElement('a');
//       linkElement.setAttribute('href', dataUri);
//       linkElement.setAttribute('download', exportFileDefaultName);
//       linkElement.click();
//     }
//   };

//   const resetProcess = () => {
//     setPdfFile(null);
//     setResults({ images: [], ocrResults: [], restructuredOutput: null, scriptId: null });
//     setCurrentStep(0);
//     setError('');
//     setProcessing(false);
//   };

//   const goBack = () => {
//     // In a real app with routing, you would use navigate(-1) or similar
//     window.history.back();
//   };

//   return (
//     <div className="upload-page">
//       {/* Header with Back Button and Selection Info */}
//       <header className="upload-header">
//         <div className="container">
//           <button onClick={goBack} className="back-button">
//             <ArrowLeft size={20} />
//             Back to Selection
//           </button>
          
//           <div className="upload-title-section">
//             <h1 className="upload-title">Upload Answer Script</h1>
//             <p className="upload-subtitle">Process PDF documents using advanced OCR technology</p>
//           </div>

//           {/* Selected Data Display */}
//           {selectedData && (
//             <div className="selection-info">
//               <div className="selection-item">
//                 <GraduationCap size={16} />
//                 <span>{selectedData.class?.class_name}</span>
//               </div>
//               <div className="selection-item">
//                 <BookOpen size={16} />
//                 <span>{selectedData.subject?.subject_name}</span>
//                 {keyOcrData && <span className="key-indicator">✓ Answer Key Available</span>}
//                 {!keyOcrData && <span className="no-key-indicator">⚠ No Answer Key</span>}
//               </div>
//               <div className="selection-item">
//                 <User size={16} />
//                 <span>{selectedData.student?.name} ({selectedData.student?.roll_number})</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </header>

//       <main className="upload-main">
//         <div className="container">
//           {/* Progress Steps */}
//           <div className="progress-steps">
//             {steps.map((step, index) => {
//               const Icon = step.icon;
//               const isActive = currentStep === index;
//               const isCompleted = currentStep > index;
              
//               return (
//                 <div key={index} className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
//                   <div className="step-icon">
//                     {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
//                   </div>
//                   <span className="step-name">{step.name}</span>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Answer Key Status */}
//           {selectedData && (
//             <div className={`key-status ${keyOcrData ? 'key-available' : 'key-missing'}`}>
//               {keyOcrData ? (
//                 <div className="key-status-content">
//                   <CheckCircle size={20} />
//                   <span>Answer key loaded for {selectedData.subject.subject_name}</span>
//                   <small>Last updated: {new Date(keyOcrData.updated_at).toLocaleDateString()}</small>
//                 </div>
//               ) : (
//                 <div className="key-status-content">
//                   <AlertCircle size={20} />
//                   <span>No answer key available for {selectedData.subject.subject_name}</span>
//                   <small>Processing will continue without answer key comparison</small>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Error Display */}
//           {error && (
//             <div className="error-message">
//               <AlertCircle size={20} />
//               <span>{error}</span>
//             </div>
//           )}

//           {/* Upload Section */}
//           {currentStep === 0 && (
//             <div className="upload-section">
//               <div className="upload-card">
//                 <Upload size={48} className="upload-icon" />
//                 <h2>Upload Answer Script PDF</h2>
//                 <p>Select the answer script PDF file for {selectedData?.student?.name || 'the selected student'}</p>
                
//                 <label className="file-input-label">
//                   <input
//                     type="file"
//                     accept=".pdf"
//                     onChange={handleFileUpload}
//                     className="file-input"
//                   />
//                   Choose PDF File
//                 </label>
                
//                 {pdfFile && (
//                   <div className="file-info">
//                     <FileText size={20} />
//                     <span>{pdfFile.name}</span>
//                     <span className="file-size">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
//                   </div>
//                 )}
//               </div>
              
//               {pdfFile && (
//                 <button className="process-btn" onClick={convertPdfToImages}>
//                   Start Processing
//                 </button>
//               )}
//             </div>
//           )}

//           {/* Processing Section */}
//           {processing && (
//             <div className="processing-section">
//               <div className="processing-card">
//                 <Loader2 size={48} className="spinner" />
//                 <h2>Processing Answer Script</h2>
//                 <p>
//                   {currentStep === 1 && "Converting PDF to images..."}
//                   {currentStep === 2 && "Saving images to database..."}
//                   {currentStep === 3 && "Extracting text using OCR..."}
//                   {currentStep === 4 && `Restructuring answer data${keyOcrData ? ' with answer key comparison' : ' without answer key'}...`}
//                   {currentStep === 5 && "Saving OCR data to database..."}
//                   {currentStep === 6 && "Correcting OCR data with AI..."}
//                 </p>
//                 <div className="processing-info">
//                   <span>Student: {selectedData?.student?.name}</span>
//                   <span>Subject: {selectedData?.subject?.subject_name}</span>
//                   {keyOcrData && <span>Answer Key: Available ✓</span>}
//                   {results.scriptId && <span>Script ID: {results.scriptId}</span>}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Results Section */}
//           {currentStep === 7 && (
//             <div className="results-section">
//               <div className="results-header">
//                 <h2>Processing Complete</h2>
//                 <div className="student-info">
//                   <p>Answer script processed and saved for <strong>{selectedData?.student?.name}</strong> - {selectedData?.subject?.subject_name}</p>
//                   {results.scriptId && (
//                     <p className="script-id">Script ID: {results.scriptId}</p>
//                   )}
//                   {keyOcrData && (
//                     <p className="key-info">✓ Processed with answer key comparison</p>
//                   )}
//                   <p className="images-info">✓ {results.images.length} images saved to database</p>
//                   {results.correctionResult && (
//                     <p className="correction-info">✓ OCR data corrected with AI</p>
//                   )}
//                 </div>
//                 <div className="results-actions">
//                   <button className="download-btn primary" onClick={downloadRestructuredOutput}>
//                     <Download size={20} />
//                     Download Processed Answers
//                   </button>
//                   <button className="download-btn secondary" onClick={downloadJSON}>
//                     <Download size={20} />
//                     Download Raw OCR Data
//                   </button>
//                   <button className="reset-btn" onClick={resetProcess}>
//                     Process Another Script
//                   </button>
//                 </div>
//               </div>

//               {/* OCR Results Summary */}
//               <div className="results-summary">
//                 <h3>Processing Summary</h3>
//                 <div className="summary-stats">
//                   <div className="stat">
//                     <span className="stat-number">{results.ocrResults.length}</span>
//                     <span className="stat-label">Pages Processed</span>
//                   </div>
//                   <div className="stat">
//                     <span className="stat-number">{results.images.length}</span>
//                     <span className="stat-label">Images Saved</span>
//                   </div>
//                   <div className="stat">
//                     <span className="stat-number">{selectedData?.subject?.subject_name || 'N/A'}</span>
//                     <span className="stat-label">Subject</span>
//                   </div>
//                   <div className="stat">
//                     <span className="stat-number">{selectedData?.student?.roll_number || 'N/A'}</span>
//                     <span className="stat-label">Roll Number</span>
//                   </div>
//                   <div className="stat">
//                     <span className="stat-number">✓ Saved</span>
//                     <span className="stat-label">Database Status</span>
//                   </div>
//                   <div className="stat">
//                     <span className="stat-number">{keyOcrData ? '✓ Used' : '✗ N/A'}</span>
//                     <span className="stat-label">Answer Key</span>
//                   </div>
//                   <div className="stat">
//                     <span className="stat-number">{results.correctionResult ? '✓ Corrected' : '✗ N/A'}</span>
//                     <span className="stat-label">AI Correction</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Restructured Output */}
//               {results.restructuredOutput && (
//                 <div className="restructured-section">
//                   <h3>Processed Answer Script{keyOcrData ? ' (with Answer Key)' : ''}</h3>
//                   <div className="restructured-output">
//                     <pre className="output-text">
//                       {results.restructuredOutput}
//                     </pre>
//                   </div>
//                 </div>
//               )}

//               {/* OCR Results Grid (Collapsed by default) */}
//               <details className="ocr-details">
//                 <summary>View Raw OCR Data</summary>
//                 <div className="results-grid">
//                   {results.ocrResults.map((result, index) => (
//                     <div key={index} className="result-card">
//                       <h4>Page {result.page}</h4>
//                       <div className="result-preview">
//                         <pre className="json-preview">
//                           {JSON.stringify(result.data, null, 2).substring(0, 200)}
//                           {JSON.stringify(result.data, null, 2).length > 200 && '...'}
//                         </pre>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </details>
//             </div>
//           )}
//         </div>
//       </main>

//       <footer className="upload-footer">
//         <div className="container">
//           <p>&copy; 2025 OCR Script Management System. Advanced answer script processing.</p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default UploadPage;


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

  const API_BASE = 'http://localhost:5015'; // Your Flask server URL
  const DJANGO_API_BASE = 'http://localhost:8000'; // Your Django server URL
  const TEXTRACT_API_BASE = 'http://localhost:5000'; // Your Textract Flask server URL
  const CORRECTION_API_BASE = 'https://9bb4-115-108-34-139.ngrok-free.app'; // OCR Correction API

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

  // Load selected data from sessionStorage and fetch key OCR
  useEffect(() => {
    const savedData = sessionStorage.getItem('selectedData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setSelectedData(parsedData);
      
      // Fetch key OCR data for the selected subject
      if (parsedData.subject && parsedData.subject.subject_id) {
        fetchKeyOcr(parsedData.subject.subject_id);
      }
    }
  }, []);

    // Add this helper function for image compression


  const fetchKeyOcr = async (subjectId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/key-ocr/?subject_id=${subjectId}`);
      
      if (response.ok) {
        const keyOcrData = await response.json();
        setKeyOcrData(keyOcrData);
        console.log('Key OCR data loaded:', keyOcrData);
      } else if (response.status === 404) {
        console.warn('No key OCR found for this subject');
        setKeyOcrData(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch key OCR:', errorData);
        setError(`Warning: Could not load answer key data - ${errorData.error}`);
      }
    } catch (err) {
      console.error('Network error fetching key OCR:', err);
      setError('Warning: Could not connect to database for answer key data');
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
        // Automatically proceed to save images to database
        await saveImagesToDatabase(data.images);
      } else {
        setError(data.error || 'Failed to convert PDF');
      }
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
      // First, create the script record
      const scriptData = {
        student_id: selectedData.student.student_id,
        subject_id: selectedData.subject.subject_id
      };

      const scriptResponse = await fetch(`${DJANGO_API_BASE}/scripts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scriptData)
      });

      let scriptId;
      if (scriptResponse.ok) {
        const scriptResult = await scriptResponse.json();
        scriptId = scriptResult.script_id;
      } else if (scriptResponse.status === 400) {
        // Script might already exist due to unique constraint
        const errorResponse = await scriptResponse.json();
        if (errorResponse.error && errorResponse.error.includes('already exists')) {
          // Try to find existing script
          const existingScriptsResponse = await fetch(
            `${DJANGO_API_BASE}/scripts/?student_id=${selectedData.student.student_id}&subject_id=${selectedData.subject.subject_id}`
          );
          
          if (existingScriptsResponse.ok) {
            const existingScripts = await existingScriptsResponse.json();
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
            throw new Error('Failed to retrieve existing script record');
          }
        } else {
          throw new Error(`Failed to create script record: ${errorResponse.error}`);
        }
      } else {
        const errorResponse = await scriptResponse.json();
        throw new Error(`Failed to create script record: ${errorResponse.error || 'Unknown error'}`);
      }

      // Update results state with scriptId immediately
      setResults(prev => ({ 
        ...prev, 
        scriptId
      }));

      // Save each image to ScriptImage model
      const savedImages = [];
      for (let i = 0; i < imageData.length; i++) {
        const imageRecord = {
          script_id: scriptId,
          page_number: i + 1,
          image_data: imageData[i].data, // Base64 encoded image data
          image_filename: imageData[i].filename,
          image_path: imageData[i].path || ''
        };

        const imageResponse = await fetch(`${DJANGO_API_BASE}/script-images/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageRecord)
        });

        if (imageResponse.ok) {
          const savedImage = await imageResponse.json();
          savedImages.push(savedImage);
          console.log(`Image saved for page ${i + 1}:`, savedImage);
        } else {
          const errorData = await imageResponse.json();
          console.error(`Failed to save image for page ${i + 1}:`, errorData);
          // Continue with other images even if one fails
        }
      }

      // Update results with saved images info
      setResults(prev => ({ 
        ...prev, 
        savedImages 
      }));

      setCurrentStep(3);
      // Automatically proceed to OCR with the scriptId
      await extractTextFromImages(imageData, scriptId);
      
    } catch (err) {
      setError('Failed to save images to database: ' + err.message);
      console.error('Image save error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Extract text from images using regular OCR
  const extractTextFromImages = async (imageData, scriptId) => {
    setCurrentStep(3);
    setProcessing(true);
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

      // Update state with OCR results
      setResults(prev => ({ ...prev, ocrResults }));
      
      setCurrentStep(4);
      
      // Process with Textract first, then save all data together
      await processWithTextract(scriptId, ocrResults);
      
    } catch (err) {
      setError('OCR processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Process with Textract OCR
  const processWithTextract = async (scriptId, ocrResults) => {
    setCurrentStep(4);
    setProcessing(true);

    try {
      console.log(`Starting Textract processing for script ID: ${scriptId}`);
      
      // Start Textract processing
      const response = await fetch(`${TEXTRACT_API_BASE}/process-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_id: scriptId,
          use_api: true,
          force_process: false
        })
      });

      if (response.ok) {
        const startResult = await response.json();
        console.log('Textract processing started:', startResult);
        
        // Poll for completion
        await pollTextractStatus(scriptId, ocrResults);
      } else {
        const errorData = await response.json();
        console.error('Textract processing failed:', errorData);
        // Even if Textract fails, save the regular OCR data
        await saveOcrDataToDatabase(ocrResults, null, scriptId);
      }
    } catch (err) {
      console.error('Textract processing error:', err);
      // Even if Textract fails, save the regular OCR data
      await saveOcrDataToDatabase(ocrResults, null, scriptId);
    } finally {
      setProcessing(false);
    }
  };

  // Poll Textract processing status
  const pollTextractStatus = async (scriptId, ocrResults) => {
    const maxAttempts = 60; // Poll for up to 5 minutes
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await fetch(`${TEXTRACT_API_BASE}/process-status/${scriptId}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`Textract status (${attempts + 1}):`, statusData.status);
          
          if (statusData.status === 'completed') {
            // Get full results
            const resultsResponse = await fetch(`${TEXTRACT_API_BASE}/process-results/${scriptId}`);
            if (resultsResponse.ok) {
              const textractResults = await resultsResponse.json();
              setResults(prev => ({ ...prev, textractResults }));
              
              // Save both regular OCR and Textract results to database
              await saveOcrDataToDatabase(ocrResults, textractResults, scriptId);
              return;
            }
          } else if (statusData.status === 'failed') {
            console.error('Textract processing failed:', statusData.error);
            // Even if Textract fails, save the regular OCR data
            await saveOcrDataToDatabase(ocrResults, null, scriptId);
            return;
          }
          
          // Continue polling if still processing
          if (statusData.status === 'processing') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            attempts++;
            continue;
          }
        } else {
          throw new Error('Failed to check Textract status');
        }
      } catch (err) {
        console.error('Error polling Textract status:', err);
        // Even if polling fails, save the regular OCR data
        await saveOcrDataToDatabase(ocrResults, null, scriptId);
        return;
      }
    }
    
    console.warn('Textract processing timed out, saving regular OCR data only');
    await saveOcrDataToDatabase(ocrResults, null, scriptId);
  };

  // FIXED: Save OCR data properly with correct parameters
  const saveOcrDataToDatabase = async (ocrResults, textractResults, scriptId) => {
    setCurrentStep(5);
    setProcessing(true);

    try {
      if (!scriptId) {
        throw new Error('No script ID available. Images may not have been saved properly.');
      }
      
      if (!ocrResults || ocrResults.length === 0) {
        throw new Error('No OCR results available to save.');
      }

      console.log('Saving OCR data to database:', {
        scriptId,
        totalPages: ocrResults.length,
        hasTextractResults: !!textractResults
      });

      // Create the overall metadata
      const overallMetadata = {
        textract_results: textractResults, // Store Textract results separately
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

      // Save each page's individual OCR data
      const savedOcrData = [];
      for (const ocrResult of ocrResults) {
        console.log(`Processing page ${ocrResult.page} OCR data:`, {
          page: ocrResult.page,
          hasOcrData: !!ocrResult.data,
          ocrDataKeys: ocrResult.data ? Object.keys(ocrResult.data) : [],
          filename: ocrResult.filename
        });

        const ocrData = {
          script_id: scriptId,
          page_number: ocrResult.page,
          
          // Store the ACTUAL individual page OCR data in ocr_json
          ocr_json: ocrResult.data, // This contains the EasyOCR/Tesseract results for THIS specific page
          
          // Store structured data with page-specific context
          structured_json: {
            // Overall metadata
            ...overallMetadata,
            
            // Page-specific information
            page_specific: {
              page_number: ocrResult.page,
              filename: ocrResult.filename,
              imagePath: ocrResult.imagePath,
              processing_timestamp: new Date().toISOString()
            }
          },
          
          // Context description
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

        // Log what we're about to save
        console.log(`Saving OCR data for page ${ocrResult.page}:`, {
          script_id: scriptId,
          page_number: ocrResult.page,
          ocr_json_preview: JSON.stringify(ocrResult.data).substring(0, 200) + '...',
          has_structured_json: !!ocrData.structured_json,
          context_length: ocrData.context.length
        });

        const ocrResponse = await fetch(`${DJANGO_API_BASE}/ocr/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ocrData)
        });

        if (ocrResponse.ok) {
          const savedOcr = await ocrResponse.json();
          savedOcrData.push(savedOcr);
          console.log(`✓ OCR data saved successfully for page ${ocrResult.page}:`, {
            ocr_id: savedOcr.ocr_id,
            script_id: savedOcr.script_id,
            page_number: savedOcr.page_number,
            created_at: savedOcr.created_at
          });
        } else {
          const errorData = await ocrResponse.json();
          console.error(`❌ Failed to save OCR data for page ${ocrResult.page}:`, errorData);
          throw new Error(`Failed to save OCR data for page ${ocrResult.page}: ${errorData.error || 'Unknown error'}`);
        }
      }

      console.log(`✅ All OCR data saved successfully:`, {
        totalPages: savedOcrData.length,
        scriptId: scriptId,
        savedOcrIds: savedOcrData.map(ocr => ocr.ocr_id)
      });

      setResults(prev => ({ 
        ...prev, 
        savedOcrData,
        ocrSaveSuccess: true
      }));
      
      setCurrentStep(6);
      // Automatically proceed to OCR correction
      await correctOcrData(selectedData.subject.subject_id, scriptId);
      
    } catch (err) {
      console.error('❌ Database save error:', err);
      setError('Database save failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // OCR Correction API call
  const correctOcrData = async (subjectId, scriptId) => {
    setCurrentStep(6);
    setProcessing(true);

    try {
      console.log(`Calling OCR correction API for subject ${subjectId} and script ${scriptId}`);
      
      const response = await fetch(`${CORRECTION_API_BASE}/correct_ocr/${subjectId}/${scriptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
        }
      });

      if (response.ok) {
        const correctionResult = await response.json();
        console.log('OCR correction completed successfully:', correctionResult);
        
        // Update results with correction info
        setResults(prev => ({ 
          ...prev, 
          correctionResult 
        }));
        
        setCurrentStep(7); // Move to final step (View Results)
      } else {
        const errorData = await response.json();
        console.error('OCR correction failed:', errorData);
        // Don't throw error, just log warning and continue to results
        console.warn(`OCR correction failed but continuing: ${errorData.error || 'Unknown error'}`);
        setCurrentStep(7); // Still move to results even if correction fails
      }
    } catch (err) {
      console.error('OCR correction network error:', err);
      // Don't throw error, just log warning and continue to results
      console.warn(`OCR correction network error but continuing: ${err.message}`);
      setCurrentStep(7); // Still move to results even if correction fails
    } finally {
      setProcessing(false);
    }
  };

  const downloadJSON = () => {
    if (results.ocrResults.length > 0) {
      const dataStr = JSON.stringify(results.ocrResults, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ocr_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const downloadTextractResults = () => {
    if (results.textractResults) {
      const dataStr = JSON.stringify(results.textractResults, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `textract_results_${selectedData?.student?.name || 'student'}_${selectedData?.subject?.subject_name || 'subject'}_${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const resetProcess = () => {
    setPdfFile(null);
    setResults({ images: [], ocrResults: [], textractResults: null, scriptId: null });
    setCurrentStep(0);
    setError('');
    setProcessing(false);
  };

  const goBack = () => {
    // In a real app with routing, you would use navigate(-1) or similar
    window.history.back();
  };

  return (
    <div className="upload-page">
      {/* Header with Back Button and Selection Info */}
      <header className="upload-header">
        <div className="container">
          <button onClick={goBack} className="back-button">
            <ArrowLeft size={20} />
            Back to Selection
          </button>
          
          <div className="upload-title-section">
            <h1 className="upload-title">Upload Answer Script</h1>
            <p className="upload-subtitle">Process PDF documents using advanced OCR and Textract technology</p>
          </div>

          {/* Selected Data Display */}
          {selectedData && (
            <div className="selection-info">
              <div className="selection-item">
                <GraduationCap size={16} />
                <span>{selectedData.class?.class_name}</span>
              </div>
              <div className="selection-item">
                <BookOpen size={16} />
                <span>{selectedData.subject?.subject_name}</span>
                {keyOcrData && <span className="key-indicator">✓ Answer Key Available</span>}
                {!keyOcrData && <span className="no-key-indicator">⚠ No Answer Key</span>}
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

          {/* Answer Key Status */}
          {selectedData && (
            <div className={`key-status ${keyOcrData ? 'key-available' : 'key-missing'}`}>
              {keyOcrData ? (
                <div className="key-status-content">
                  <CheckCircle size={20} />
                  <span>Answer key loaded for {selectedData.subject.subject_name}</span>
                  <small>Last updated: {new Date(keyOcrData.updated_at).toLocaleDateString()}</small>
                </div>
              ) : (
                <div className="key-status-content">
                  <AlertCircle size={20} />
                  <span>No answer key available for {selectedData.subject.subject_name}</span>
                  <small>Processing will continue with Textract OCR processing</small>
                </div>
              )}
            </div>
          )}

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

          {/* Processing Section */}
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

          {/* Results Section */}
          {currentStep === 7 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Processing Complete</h2>
                <div className="student-info">
                  <p>Answer script processed and saved for <strong>{selectedData?.student?.name}</strong> - {selectedData?.subject?.subject_name}</p>
                  {results.scriptId && (
                    <p className="script-id">Script ID: {results.scriptId}</p>
                  )}
                  {keyOcrData && (
                    <p className="key-info">✓ Processed with answer key comparison</p>
                  )}
                  <p className="images-info">✓ {results.images.length} images saved to database</p>
                  <p className="ocr-info">✓ {results.ocrResults.length} pages processed with regular OCR</p>
                  {results.textractResults && (
                    <p className="textract-info">✓ {results.textractResults.successfully_processed || 0} pages processed with Textract</p>
                  )}
                  {results.correctionResult && (
                    <p className="correction-info">✓ OCR data corrected with AI</p>
                  )}
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

              {/* OCR Results Summary */}
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

              {/* Textract Results */}
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

              {/* OCR Results Grid (Collapsed by default) */}
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

      <footer className="upload-footer">
        <div className="container">
          <p>&copy; 2025 OCR Script Management System. Advanced answer script processing with Textract integration.</p>
        </div>
      </footer>
    </div>
  );
};

export default UploadPage;
                       