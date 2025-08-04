import React, { useState, useEffect } from 'react';
import { User, BookOpen, GraduationCap, ArrowLeft, CheckCircle, AlertCircle, Loader2, UserPlus } from 'lucide-react';

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
              Student Registration
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
              Register new students and assign them to classes and subjects
            </p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        {/* Success Message */}
        {message && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.75rem', 
            padding: '1.5rem', 
            backgroundColor: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            borderRadius: '8px', 
            marginBottom: '2rem'
          }}>
            <CheckCircle size={24} style={{ color: '#10b981', marginTop: '0.125rem', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#059669' }}>
                Registration Successful!
              </h3>
              <div style={{ fontSize: '0.875rem', color: '#065f46', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Student:</strong> {message.name}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Class:</strong> {message.className}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Subject:</strong> {message.subjectName}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Student ID:</strong> {message.studentId}
                </div>
                <div>
                  <strong>Script ID:</strong> {message.scriptId}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
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

        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            Student Information
          </h2>
          
          {/* Basic Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
              Basic Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
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
                  Student Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter student full name"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
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
                  <UserPlus size={18} />
                  Roll Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder="Enter roll number"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
              Academic Assignment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
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
                  Class <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
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
                  Subject <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  disabled={!formData.classId}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    opacity: !formData.classId ? 0.6 : 1
                  }}
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
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '6px', 
              marginBottom: '2rem' 
            }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: '600' }}>Preview Registration:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} />
                  <span><strong>Student:</strong> {formData.name} ({formData.rollNumber})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={16} />
                  <span><strong>Class:</strong> {selectedClassData.class_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={16} />
                  <span><strong>Subject:</strong> {selectedSubjectData.subject_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            {(formData.name || formData.rollNumber || formData.classId || formData.subjectId) && (
              <button 
                type="button" 
                onClick={resetForm}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#fff',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Reset Form
              </button>
            )}
            
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: loading || !isFormValid ? '#9ca3af' : '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              {loading && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentForm;