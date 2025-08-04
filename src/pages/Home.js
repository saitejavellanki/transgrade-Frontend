import React, { useState, useEffect } from 'react';
import { User, BookOpen, GraduationCap, ArrowLeft, CheckCircle, AlertCircle, Loader2, UserPlus } from 'lucide-react';

// Apple-inspired styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .student-body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    background-color: #f5f5f7;
    min-height: 100vh;
    padding: 40px 20px;
  }

  .student-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .student-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .student-header h1 {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 52px;
    font-weight: 700;
    color: #1d1d1f;
    margin-bottom: 12px;
    letter-spacing: -0.03em;
    font-style: italic;
  }

  .student-header p {
    font-size: 21px;
    color: #86868b;
    font-weight: 400;
  }

  .student-back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #007aff;
    font-size: 17px;
    font-weight: 500;
    margin-bottom: 32px;
    padding: 8px 0;
    transition: all 0.2s ease;
  }

  .student-back-btn:hover {
    opacity: 0.7;
  }

  .student-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .student-card {
    background: white;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .student-form-title {
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 24px;
  }

  .student-section-title {
    font-size: 22px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 20px;
  }

  .student-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .student-form-group {
    display: flex;
    flex-direction: column;
  }

  .student-form-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 500;
    color: #1d1d1f;
    margin-bottom: 8px;
  }

  .student-required {
    color: #ff3b30;
  }

  .student-form-group input,
  .student-form-group select {
    height: 44px;
    padding: 0 16px;
    border: 1.5px solid #d2d2d7;
    border-radius: 12px;
    font-size: 17px;
    background-color: white;
    transition: all 0.2s ease;
  }

  .student-form-group input:focus,
  .student-form-group select:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }

  .student-form-group select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f5f5f7;
  }

  .student-preview-card {
    padding: 20px;
    background-color: #f5f5f7;
    border-radius: 12px;
    margin-bottom: 32px;
  }

  .student-preview-title {
    font-size: 20px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 12px;
  }

  .student-preview-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #1d1d1f;
    margin-bottom: 6px;
  }

  .student-preview-item:last-child {
    margin-bottom: 0;
  }

  .student-btn {
    height: 44px;
    padding: 0 24px;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 17px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .student-btn:hover {
    background: #0056d6;
    transform: translateY(-1px);
  }

  .student-btn:active {
    transform: translateY(0);
  }

  .student-btn:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
    transform: none;
  }

  .student-btn.secondary {
    background: #f5f5f7;
    color: #1d1d1f;
    border: 1px solid #d2d2d7;
  }

  .student-btn.secondary:hover {
    background: #e8e8ed;
    transform: translateY(-1px);
  }

  .student-btn.secondary:disabled:hover {
    background: #f5f5f7;
    transform: none;
  }

  .student-loading {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .student-message {
    padding: 20px 24px;
    border-radius: 12px;
    margin-bottom: 32px;
  }

  .student-message.success {
    background-color: #d1fadf;
    color: #0d5520;
    border: 1px solid #a7f3d0;
  }

  .student-message.error {
    background-color: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .student-message-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .student-message-content {
    flex: 1;
  }

  .student-message-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .student-message-details {
    font-size: 15px;
    line-height: 1.5;
  }

  .student-message-detail {
    margin-bottom: 4px;
  }

  .student-message-detail:last-child {
    margin-bottom: 0;
  }

  .student-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    align-items: center;
  }

  @media (max-width: 768px) {
    .student-header h1 {
      font-size: 40px;
    }

    .student-header p {
      font-size: 19px;
    }

    .student-card {
      padding: 24px;
    }

    .student-form-title {
      font-size: 24px;
    }

    .student-section-title {
      font-size: 20px;
    }

    .student-form-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .student-actions {
      flex-direction: column;
      gap: 12px;
    }

    .student-btn,
    .student-btn.secondary {
      width: 100%;
    }
  }
`;

function StudentForm() {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    classId: '',
    subjectId: ''
  });
  
  const [classes, setClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Backend URL - adjust this to match your Django server
  const API_BASE_URL = 'https://transback.transpoze.ai';

  // Inject styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Fetch classes and subjects on component mount
  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  // Filter subjects when class changes
  useEffect(() => {
    if (formData.classId) {
      const filtered = allSubjects.filter(subject => 
        subject.class_id === parseInt(formData.classId)
      );
      setFilteredSubjects(filtered);
      
      // Reset subject selection if current subject is not available for selected class
      if (formData.subjectId && !filtered.some(subject => subject.subject_id === parseInt(formData.subjectId))) {
        setFormData(prev => ({
          ...prev,
          subjectId: ''
        }));
      }
    } else {
      setFilteredSubjects([]);
      setFormData(prev => ({
        ...prev,
        subjectId: ''
      }));
    }
  }, [formData.classId, allSubjects]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/`);
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/`);
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      const data = await response.json();
      setAllSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.rollNumber.trim()) {
      setError('Roll number is required');
      return false;
    }
    if (!formData.classId) {
      setError('Please select a class');
      return false;
    }
    if (!formData.subjectId) {
      setError('Please select a subject');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // First, create the student
      const studentResponse = await fetch(`${API_BASE_URL}/students/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          roll_number: formData.rollNumber.trim(),
          class_id: parseInt(formData.classId)
        })
      });

      const studentData = await studentResponse.json();

      if (!studentResponse.ok) {
        throw new Error(studentData.error || studentData.detail || 'Failed to create student');
      }

      // Then, create the script linking student and subject
      const scriptResponse = await fetch(`${API_BASE_URL}/scripts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentData.student_id,
          subject_id: parseInt(formData.subjectId)
        })
      });

      const scriptData = await scriptResponse.json();

      if (!scriptResponse.ok) {
        throw new Error(scriptData.error || scriptData.detail || 'Failed to create script');
      }

      const selectedClass = classes.find(cls => cls.class_id === parseInt(formData.classId));
      const selectedSubject = filteredSubjects.find(sub => sub.subject_id === parseInt(formData.subjectId));

      setMessage({
        name: formData.name,
        className: selectedClass?.class_name,
        subjectName: selectedSubject?.subject_name,
        studentId: studentData.student_id,
        scriptId: scriptData.script_id
      });
      
      // Reset form
      setFormData({
        name: '',
        rollNumber: '',
        classId: '',
        subjectId: ''
      });

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An error occurred while submitting the form');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rollNumber: '',
      classId: '',
      subjectId: ''
    });
    setMessage('');
    setError('');
  };

  const isFormValid = formData.name.trim() && 
                     formData.rollNumber.trim() && 
                     formData.classId && 
                     formData.subjectId;

  const selectedClassData = classes.find(c => c.class_id === parseInt(formData.classId));
  const selectedSubjectData = filteredSubjects.find(s => s.subject_id === parseInt(formData.subjectId));

  return (
    <div className="student-body">
      <div className="student-container">
        <button 
          onClick={() => window.history.back()} 
          className="student-back-btn"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="student-header">
          <h1>Student Registration</h1>
          <p>Register new students and assign them to classes and subjects</p>
        </div>

        <div className="student-content">
          {/* Success Message */}
          {message && (
            <div className="student-message success">
              <div className="student-message-header">
                <CheckCircle size={24} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div className="student-message-content">
                  <div className="student-message-title">Registration Successful!</div>
                  <div className="student-message-details">
                    <div className="student-message-detail">
                      <strong>Student:</strong> {message.name}
                    </div>
                    <div className="student-message-detail">
                      <strong>Class:</strong> {message.className}
                    </div>
                    <div className="student-message-detail">
                      <strong>Subject:</strong> {message.subjectName}
                    </div>
                    <div className="student-message-detail">
                      <strong>Student ID:</strong> {message.studentId}
                    </div>
                    <div className="student-message-detail">
                      <strong>Script ID:</strong> {message.scriptId}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="student-message error">
              <div className="student-message-header">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="student-card">
            <h2 className="student-form-title">Student Information</h2>
            
            {/* Basic Information */}
            <div>
              <h3 className="student-section-title">Basic Details</h3>
              <div className="student-form-grid">
                <div className="student-form-group">
                  <label>
                    <User size={18} />
                    Student Name <span className="student-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter student full name"
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    <UserPlus size={18} />
                    Roll Number <span className="student-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    placeholder="Enter roll number"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="student-section-title">Academic Assignment</h3>
              <div className="student-form-grid">
                <div className="student-form-group">
                  <label>
                    <GraduationCap size={18} />
                    Class <span className="student-required">*</span>
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="student-form-group">
                  <label>
                    <BookOpen size={18} />
                    Subject <span className="student-required">*</span>
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    disabled={!formData.classId}
                  >
                    <option value="">
                      {!formData.classId ? "Select Class First" : "Select Subject"}
                    </option>
                    {filteredSubjects.map((subject) => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Selected Information Preview */}
            {selectedClassData && selectedSubjectData && formData.name && formData.rollNumber && (
              <div className="student-preview-card">
                <h3 className="student-preview-title">Preview Registration:</h3>
                <div className="student-preview-item">
                  <User size={16} />
                  <span><strong>Student:</strong> {formData.name} ({formData.rollNumber})</span>
                </div>
                <div className="student-preview-item">
                  <GraduationCap size={16} />
                  <span><strong>Class:</strong> {selectedClassData.class_name}</span>
                </div>
                <div className="student-preview-item">
                  <BookOpen size={16} />
                  <span><strong>Subject:</strong> {selectedSubjectData.subject_name}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="student-actions">
              {(formData.name || formData.rollNumber || formData.classId || formData.subjectId) && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="student-btn secondary"
                >
                  Reset Form
                </button>
              )}
              
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading || !isFormValid}
                className="student-btn"
              >
                {loading && <div className="student-loading"></div>}
                {loading ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentForm;