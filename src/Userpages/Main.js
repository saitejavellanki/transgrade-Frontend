// MainPage.jsx
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ChevronDown, Users, BookOpen, GraduationCap, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import '../csstemplates/Main.css';

const MainPage = () => {
  const history = useHistory();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API base URL - replace with your actual Django backend URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://transback.transpoze.ai';

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch subjects and students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass);
      fetchStudents(selectedClass);
    } else {
      setSubjects([]);
      setStudents([]);
    }
    setSelectedSubject('');
    setSelectedStudent('');
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/classes/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setClasses(data);
      
    } catch (err) {
      setError(`Unable to load classes: ${err.message}`);
      setClasses([]);
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/subjects/?class_id=${classId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subjects: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSubjects(data);
      
    } catch (err) {
      setError(`Unable to load subjects: ${err.message}`);
      setSubjects([]);
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/students/?class_id=${classId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStudents(data);
      
    } catch (err) {
      setError(`Unable to load students: ${err.message}`);
      setStudents([]);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedClass && selectedSubject && selectedStudent) {
      const selectedClassData = classes.find(c => c.class_id == selectedClass);
      const selectedSubjectData = subjects.find(s => s.subject_id == selectedSubject);
      const selectedStudentData = students.find(s => s.student_id == selectedStudent);
      
      const selectionData = {
        class: selectedClassData,
        subject: selectedSubjectData,
        student: selectedStudentData
      };
      
      console.log('Selected Data:', selectionData);
      
      // Store selection in sessionStorage for the upload page
      sessionStorage.setItem('selectedData', JSON.stringify(selectionData));
      
      // Navigate to upload page using React Router
      history.push('/upload');
    }
  };

  const handleRetry = () => {
    setError('');
    fetchClasses();
    if (selectedClass) {
      fetchSubjects(selectedClass);
      fetchStudents(selectedClass);
    }
  };

  const isNextDisabled = !selectedClass || !selectedSubject || !selectedStudent;

  // Get selected data for display
  const selectedClassData = classes.find(c => c.class_id == selectedClass);
  const selectedSubjectData = subjects.find(s => s.subject_id == selectedSubject);
  const selectedStudentData = students.find(s => s.student_id == selectedStudent);

  return (
    <div className="main-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <h1 className="header-title">TransGrade.</h1>
          <p className="header-subtitle">Select class, subject, and student to upload answer scripts</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} style={{ marginRight: '0.5rem' }} />
            {error}
            <button 
              onClick={handleRetry} 
              className="retry-button"
              style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Selection Cards */}
        <div className="selection-grid">
          {/* Class Selection */}
          <div className="selection-card">
            <div className="card-header">
              <GraduationCap className="icon-class" size={24} />
              <h3 className="card-title">Select Class</h3>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="select-dropdown"
                disabled={loading || classes.length === 0}
              >
                <option value="">
                  {classes.length === 0 ? 'No classes available' : 'Choose a class...'}
                </option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="chevron-icon" size={20} />
            </div>
          </div>

          {/* Subject Selection */}
          <div className="selection-card">
            <div className="card-header">
              <BookOpen className="icon-subject" size={24} />
              <h3 className="card-title">Select Subject</h3>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="select-dropdown focus-green"
                disabled={!selectedClass || loading || subjects.length === 0}
              >
                <option value="">
                  {!selectedClass 
                    ? 'Select a class first' 
                    : subjects.length === 0 
                      ? 'No subjects available' 
                      : 'Choose a subject...'
                  }
                </option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="chevron-icon" size={20} />
            </div>
          </div>

          {/* Student Selection */}
          <div className="selection-card">
            <div className="card-header">
              <Users className="icon-student" size={24} />
              <h3 className="card-title">Select Student</h3>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="select-dropdown focus-purple"
                disabled={!selectedClass || loading || students.length === 0}
              >
                <option value="">
                  {!selectedClass 
                    ? 'Select a class first' 
                    : students.length === 0 
                      ? 'No students in this class' 
                      : 'Choose a student...'
                  }
                </option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.name} - {student.roll_number}
                  </option>
                ))}
              </select>
              <ChevronDown className="chevron-icon" size={20} />
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {(selectedClassData || selectedSubjectData || selectedStudentData) && (
          <div className="summary-card">
            <h3 className="summary-title">
              <CheckCircle className="icon-class" size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Current Selection
            </h3>
            <div className="summary-grid">
              {selectedClassData && (
                <div className="summary-item">
                  <GraduationCap className="summary-item-icon icon-class" size={20} />
                  <div className="summary-item-content">
                    <div className="summary-item-label">Class</div>
                    <div className="summary-item-value">{selectedClassData.class_name}</div>
                  </div>
                </div>
              )}
              {selectedSubjectData && (
                <div className="summary-item">
                  <BookOpen className="summary-item-icon icon-subject" size={20} />
                  <div className="summary-item-content">
                    <div className="summary-item-label">Subject</div>
                    <div className="summary-item-value">{selectedSubjectData.subject_name}</div>
                  </div>
                </div>
              )}
              {selectedStudentData && (
                <div className="summary-item">
                  <Users className="summary-item-icon icon-student" size={20} />
                  <div className="summary-item-content">
                    <div className="summary-item-label">Student</div>
                    <div className="summary-item-value">{selectedStudentData.name} ({selectedStudentData.roll_number})</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Button */}
        <div className="next-button-container">
          <button
            onClick={handleNext}
            disabled={isNextDisabled || loading}
            className="next-button"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
              </>
            ) : (
              <>
                Proceed to Upload
                <ArrowRight className="next-button-icon" size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPage;