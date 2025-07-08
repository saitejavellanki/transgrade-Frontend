import React, { useState, useEffect } from 'react';

// CSS styles for class-specific subjects management
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .subjects-body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
  }

  .subjects-container {
    max-width: 1000px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .subjects-header {
    background: linear-gradient(135deg, #16a085 0%, #2ecc71 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }

  .subjects-header h1 {
    font-size: 28px;
    margin-bottom: 10px;
    font-weight: 700;
  }

  .subjects-header p {
    font-size: 16px;
    opacity: 0.9;
  }

  .subjects-content {
    padding: 40px 30px;
  }

  .subjects-form-section {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 30px;
    border-left: 4px solid #16a085;
  }

  .subjects-form-title {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 20px;
  }

  .subjects-form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }

  .subjects-form-group {
    flex: 1;
    margin-bottom: 20px;
  }

  .subjects-form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }

  .subjects-form-group input,
  .subjects-form-group select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
    background-color: white;
  }

  .subjects-form-group input:focus,
  .subjects-form-group select:focus {
    outline: none;
    border-color: #16a085;
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
  }

  .subjects-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #16a085 0%, #2ecc71 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .subjects-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(22, 160, 133, 0.3);
  }

  .subjects-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .subjects-loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .subjects-message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
  }

  .subjects-message.success {
    background-color: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .subjects-message.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .subjects-list-section {
    margin-top: 30px;
  }

  .subjects-filter-section {
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .subjects-filter-group {
    flex: 1;
  }

  .subjects-list-title {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 20px;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
  }

  .subjects-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .subjects-table th,
  .subjects-table td {
    padding: 15px 20px;
    text-align: left;
    border-bottom: 1px solid #ecf0f1;
  }

  .subjects-table th {
    background: #34495e;
    color: white;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .subjects-table tr:hover {
    background-color: #f8f9fa;
  }

  .subjects-table tr:last-child td {
    border-bottom: none;
  }

  .subjects-empty {
    text-align: center;
    padding: 40px;
    color: #6c757d;
    font-style: italic;
  }

  .subjects-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 15px;
  }

  .subjects-stat-card {
    flex: 1;
    background: linear-gradient(135deg, #16a085 0%, #2ecc71 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }

  .subjects-stat-number {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .subjects-stat-label {
    font-size: 14px;
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    .subjects-form-row {
      flex-direction: column;
      gap: 0;
    }

    .subjects-filter-section {
      flex-direction: column;
      align-items: stretch;
    }

    .subjects-stats {
      flex-direction: column;
    }

    .subjects-table {
      font-size: 14px;
    }

    .subjects-table th,
    .subjects-table td {
      padding: 10px 15px;
    }
  }
`;

function SubjectsManagement() {
  const [subjectName, setSubjectName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
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

  // Fetch subjects when filter changes
  useEffect(() => {
    fetchSubjects();
  }, [filterClassId]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/`);
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const url = filterClassId 
        ? `${API_BASE_URL}/subjects/?class_id=${filterClassId}`
        : `${API_BASE_URL}/subjects/`;
      
      const response = await fetch(url);
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  const handleSubmit = async () => {
    if (!subjectName.trim()) {
      setError('Please enter a subject name');
      return;
    }

    if (!selectedClassId) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/subjects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_name: subjectName.trim(),
          class_id: selectedClassId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }

      setMessage(`Subject "${subjectName}" created successfully for ${data.class_name}!`);
      setSubjectName('');
      setSelectedClassId('');
      
      // Refresh the subjects list
      fetchSubjects();

    } catch (err) {
      setError(err.message || 'An error occurred while creating the subject');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getFilteredSubjects = () => {
    return subjects;
  };

  const getTotalSubjectsCount = () => {
    return subjects.length;
  };

  const getClassesWithSubjects = () => {
    const classMap = new Map();
    subjects.forEach(subject => {
      const className = subject.class_name;
      if (!classMap.has(className)) {
        classMap.set(className, 0);
      }
      classMap.set(className, classMap.get(className) + 1);
    });
    return classMap.size;
  };

  return (
    <div className="subjects-body">
      <div className="subjects-container">
        <div className="subjects-header">
          <h1>Class-Specific Subjects Management</h1>
          <p>Add and manage subjects for specific classes</p>
        </div>

        <div className="subjects-content">
          {message && (
            <div className="subjects-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="subjects-message error">
              {error}
            </div>
          )}

          <div className="subjects-form-section">
            <h3 className="subjects-form-title">Add New Subject to Class</h3>
            
            <div className="subjects-form-row">
              <div className="subjects-form-group">
                <label htmlFor="classSelect">Select Class</label>
                <select
                  id="classSelect"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="subjects-form-group">
                <label htmlFor="subjectName">Subject Name</label>
                <input
                  type="text"
                  id="subjectName"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter subject name (e.g., Mathematics, Physics)"
                />
              </div>
            </div>

            <button 
              className="subjects-btn" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <div className="subjects-loading"></div>}
              {loading ? 'Adding...' : 'Add Subject to Class'}
            </button>
          </div>

          <div className="subjects-list-section">
            <div className="subjects-stats">
              <div className="subjects-stat-card">
                <div className="subjects-stat-number">{getTotalSubjectsCount()}</div>
                <div className="subjects-stat-label">Total Subjects</div>
              </div>
              <div className="subjects-stat-card">
                <div className="subjects-stat-number">{getClassesWithSubjects()}</div>
                <div className="subjects-stat-label">Classes with Subjects</div>
              </div>
              <div className="subjects-stat-card">
                <div className="subjects-stat-number">{classes.length}</div>
                <div className="subjects-stat-label">Total Classes</div>
              </div>
            </div>

            <div className="subjects-filter-section">
              <div className="subjects-filter-group">
                <label htmlFor="filterClass">Filter by Class:</label>
                <select
                  id="filterClass"
                  value={filterClassId}
                  onChange={(e) => setFilterClassId(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="subjects-list-title">
              {filterClassId 
                ? `Subjects for ${classes.find(c => c.class_id == filterClassId)?.class_name || 'Selected Class'}`
                : 'All Subjects'
              }
            </h3>
            
            {getFilteredSubjects().length > 0 ? (
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Subject ID</th>
                    <th>Subject Name</th>
                    <th>Class Name</th>
                    <th>Class ID</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredSubjects().map((subject) => (
                    <tr key={`${subject.subject_id}-${subject.class_id}`}>
                      <td>{subject.subject_id}</td>
                      <td>{subject.subject_name}</td>
                      <td>{subject.class_name}</td>
                      <td>{subject.class_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="subjects-empty">
                {filterClassId 
                  ? 'No subjects found for the selected class. Add some subjects above!'
                  : 'No subjects found. Add your first subject above!'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectsManagement;