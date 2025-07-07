import React, { useState, useEffect } from 'react';
import '../csstemplates/Home.css';

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
  const API_BASE_URL = 'https://transgrade-lb-1-896147582.ap-south-1.elb.amazonaws.com';

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

      setMessage(
        `Student "${formData.name}" registered successfully!\n` +
        `Class: ${selectedClass?.class_name}\n` +
        `Subject: ${selectedSubject?.subject_name}\n` +
        `Student ID: ${studentData.student_id}\n` +
        `Script ID: ${scriptData.script_id}`
      );
      
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

  const isFormValid = formData.name.trim() && 
                     formData.rollNumber.trim() && 
                     formData.classId && 
                     formData.subjectId;

  return (
    <div className="student-form-body">
      <div className="student-form-container">
        <div className="student-form-header">
          <h1>Student Registration</h1>
          <p>Enter student details to register for the system</p>
        </div>

        <div className="student-form-content">
          {message && (
            <div className="student-form-message success">
              {message.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          {error && (
            <div className="student-form-message error">
              {error}
            </div>
          )}

          <div>
            <div className="student-form-group">
              <label htmlFor="name">
                Student Name <span className="student-form-required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter student full name"
              />
            </div>

            <div className="student-form-group">
              <label htmlFor="rollNumber">
                Roll Number <span className="student-form-required">*</span>
              </label>
              <input
                type="text"
                id="rollNumber"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter roll number"
              />
            </div>

            <div className="student-form-row">
              <div className="student-form-group">
                <label htmlFor="classId">
                  Class <span className="student-form-required">*</span>
                </label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  required
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
                <label htmlFor="subjectId">
                  Subject <span className="student-form-required">*</span>
                </label>
                <select
                  id="subjectId"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  disabled={!formData.classId}
                  required
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

            <button 
              type="button" 
              className="student-form-btn" 
              disabled={loading || !isFormValid}
              onClick={handleSubmit}
            >
              {loading && <div className="student-form-loading"></div>}
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentForm;