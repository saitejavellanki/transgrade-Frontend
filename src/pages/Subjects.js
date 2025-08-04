import React, { useState, useEffect } from 'react';

// Apple-inspired styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .subjects-body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    background-color: #f5f5f7;
    min-height: 100vh;
    padding: 40px 20px;
  }

  .subjects-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .subjects-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .subjects-header h1 {
    font-size: 48px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .subjects-header p {
    font-size: 21px;
    color: #86868b;
    font-weight: 400;
  }

  .subjects-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .subjects-card {
    background: white;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .subjects-form-title {
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 24px;
  }

  .subjects-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  .subjects-form-group {
    display: flex;
    flex-direction: column;
  }

  .subjects-form-group label {
    font-size: 17px;
    font-weight: 500;
    color: #1d1d1f;
    margin-bottom: 8px;
  }

  .subjects-form-group input,
  .subjects-form-group select {
    height: 44px;
    padding: 0 16px;
    border: 1.5px solid #d2d2d7;
    border-radius: 12px;
    font-size: 17px;
    background-color: white;
    transition: all 0.2s ease;
    -webkit-appearance: none;
    appearance: none;
  }

  .subjects-form-group select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;
  }

  .subjects-form-group input:focus,
  .subjects-form-group select:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }

  .subjects-btn {
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
    align-self: flex-start;
  }

  .subjects-btn:hover {
    background: #0056d6;
    transform: translateY(-1px);
  }

  .subjects-btn:active {
    transform: translateY(0);
  }

  .subjects-btn:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
    transform: none;
  }

  .subjects-loading {
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

  .subjects-message {
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 24px;
  }

  .subjects-message.success {
    background-color: #d1fadf;
    color: #0d5520;
    border: 1px solid #a7f3d0;
  }

  .subjects-message.error {
    background-color: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .subjects-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .subjects-stat-card {
    background: white;
    padding: 24px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .subjects-stat-number {
    font-size: 32px;
    font-weight: 600;
    color: #007aff;
    margin-bottom: 4px;
  }

  .subjects-stat-label {
    font-size: 15px;
    color: #86868b;
    font-weight: 400;
  }

  .subjects-list-title {
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 20px;
  }

  .subjects-filter-section {
    margin-bottom: 20px;
  }

  .subjects-filter-group {
    max-width: 300px;
  }

  .subjects-table-container {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .subjects-table {
    width: 100%;
    border-collapse: collapse;
  }

  .subjects-table th {
    background: #f5f5f7;
    padding: 16px 20px;
    text-align: left;
    font-weight: 600;
    font-size: 15px;
    color: #1d1d1f;
    border-bottom: 1px solid #d2d2d7;
  }

  .subjects-table td {
    padding: 16px 20px;
    border-bottom: 1px solid #f5f5f7;
    font-size: 17px;
    color: #1d1d1f;
  }

  .subjects-table tr:hover {
    background-color: #fbfbfd;
  }

  .subjects-table tr:last-child td {
    border-bottom: none;
  }

  .subjects-empty {
    text-align: center;
    padding: 48px 20px;
    color: #86868b;
    font-size: 17px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 768px) {
    .subjects-header h1 {
      font-size: 36px;
    }

    .subjects-header p {
      font-size: 19px;
    }

    .subjects-card {
      padding: 24px;
    }

    .subjects-form-row {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .subjects-stats {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .subjects-form-title,
    .subjects-list-title {
      font-size: 24px;
    }

    .subjects-table th,
    .subjects-table td {
      padding: 12px 16px;
      font-size: 15px;
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
          <h1>Subjects</h1>
          <p>Manage subjects for your classes</p>
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

          <div className="subjects-card">
            <h3 className="subjects-form-title">Add Subject</h3>
            
            <div className="subjects-form-row">
              <div className="subjects-form-group">
                <label htmlFor="classSelect">Class</label>
                <select
                  id="classSelect"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Choose a class</option>
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
                  placeholder="Mathematics, Physics, etc."
                />
              </div>
            </div>

            <button 
              className="subjects-btn" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <div className="subjects-loading"></div>}
              {loading ? 'Adding...' : 'Add Subject'}
            </button>
          </div>

          <div className="subjects-stats">
            <div className="subjects-stat-card">
              <div className="subjects-stat-number">{getTotalSubjectsCount()}</div>
              <div className="subjects-stat-label">Total Subjects</div>
            </div>
            <div className="subjects-stat-card">
              <div className="subjects-stat-number">{getClassesWithSubjects()}</div>
              <div className="subjects-stat-label">Active Classes</div>
            </div>
            <div className="subjects-stat-card">
              <div className="subjects-stat-number">{classes.length}</div>
              <div className="subjects-stat-label">All Classes</div>
            </div>
          </div>

          <div className="subjects-card">
            <div className="subjects-filter-section">
              <div className="subjects-filter-group">
                <label htmlFor="filterClass">Filter by Class</label>
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
                ? `${classes.find(c => c.class_id == filterClassId)?.class_name || 'Selected Class'} Subjects`
                : 'All Subjects'
              }
            </h3>
            
            {getFilteredSubjects().length > 0 ? (
              <div className="subjects-table-container">
                <table className="subjects-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject</th>
                      <th>Class</th>
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
              </div>
            ) : (
              <div className="subjects-empty">
                {filterClassId 
                  ? 'No subjects found for this class'
                  : 'No subjects yet. Add your first subject above.'
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