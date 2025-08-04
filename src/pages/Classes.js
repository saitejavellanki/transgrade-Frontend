import React, { useState, useEffect } from 'react';

// Apple-inspired styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .classes-body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    background-color: #f5f5f7;
    min-height: 100vh;
    padding: 40px 20px;
  }

  .classes-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .classes-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .classes-header h1 {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 52px;
    font-weight: 700;
    color: #1d1d1f;
    margin-bottom: 12px;
    letter-spacing: -0.03em;
    font-style: italic;
  }

  .classes-header p {
    font-size: 21px;
    color: #86868b;
    font-weight: 400;
  }

  .classes-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .classes-card {
    background: white;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .classes-form-title {
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 24px;
  }

  .classes-form-group {
    margin-bottom: 24px;
  }

  .classes-form-group label {
    font-size: 17px;
    font-weight: 500;
    color: #1d1d1f;
    margin-bottom: 8px;
    display: block;
  }

  .classes-form-group input {
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border: 1.5px solid #d2d2d7;
    border-radius: 12px;
    font-size: 17px;
    background-color: white;
    transition: all 0.2s ease;
  }

  .classes-form-group input:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }

  .classes-btn {
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

  .classes-btn:hover {
    background: #0056d6;
    transform: translateY(-1px);
  }

  .classes-btn:active {
    transform: translateY(0);
  }

  .classes-btn:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
    transform: none;
  }

  .classes-btn.secondary {
    background: #f5f5f7;
    color: #1d1d1f;
    border: 1px solid #d2d2d7;
    font-size: 15px;
    height: 36px;
    padding: 0 16px;
  }

  .classes-btn.secondary:hover {
    background: #e8e8ed;
    transform: translateY(-1px);
  }

  .classes-btn.secondary.active {
    background: #007aff;
    color: white;
    border-color: #007aff;
  }

  .classes-loading {
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

  .classes-message {
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 24px;
  }

  .classes-message.success {
    background-color: #d1fadf;
    color: #0d5520;
    border: 1px solid #a7f3d0;
  }

  .classes-message.error {
    background-color: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .classes-stats {
    margin-bottom: 32px;
  }

  .classes-stat-card {
    background: white;
    padding: 24px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
    max-width: 200px;
    margin: 0 auto;
  }

  .classes-stat-number {
    font-size: 32px;
    font-weight: 600;
    color: #007aff;
    margin-bottom: 4px;
  }

  .classes-stat-label {
    font-size: 15px;
    color: #86868b;
    font-weight: 400;
  }

  .classes-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .classes-list-title {
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
  }

  .classes-view-toggle {
    display: flex;
    gap: 8px;
  }

  .classes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .classes-class-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
  }

  .classes-class-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .classes-card-id {
    font-size: 13px;
    color: #86868b;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .classes-card-name {
    font-size: 20px;
    font-weight: 600;
    color: #1d1d1f;
  }

  .classes-table-container {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .classes-table {
    width: 100%;
    border-collapse: collapse;
  }

  .classes-table th {
    background: #f5f5f7;
    padding: 16px 20px;
    text-align: left;
    font-weight: 600;
    font-size: 15px;
    color: #1d1d1f;
    border-bottom: 1px solid #d2d2d7;
  }

  .classes-table td {
    padding: 16px 20px;
    border-bottom: 1px solid #f5f5f7;
    font-size: 17px;
    color: #1d1d1f;
  }

  .classes-table tr:hover {
    background-color: #fbfbfd;
  }

  .classes-table tr:last-child td {
    border-bottom: none;
  }

  .classes-empty {
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
    .classes-header h1 {
      font-size: 40px;
    }

    .classes-header p {
      font-size: 19px;
    }

    .classes-card {
      padding: 24px;
    }

    .classes-form-title,
    .classes-list-title {
      font-size: 24px;
    }

    .classes-list-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .classes-grid {
      grid-template-columns: 1fr;
    }

    .classes-table th,
    .classes-table td {
      padding: 12px 16px;
      font-size: 15px;
    }

    .classes-view-toggle {
      justify-content: center;
    }
  }
`;

function ClassesManagement() {
  const [className, setClassName] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

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

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

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

  const handleSubmit = async () => {
    if (!className.trim()) {
      setError('Please enter a class name');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/classes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_name: className.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class');
      }

      setMessage(`Class "${className}" created successfully! ID: ${data.class_id}`);
      setClassName('');
      
      // Refresh the classes list
      fetchClasses();

    } catch (err) {
      setError(err.message || 'An error occurred while creating the class');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="classes-body">
      <div className="classes-container">
        <div className="classes-header">
          <h1>Classes</h1>
          <p>Organize and manage your classes</p>
        </div>

        <div className="classes-content">
          {message && (
            <div className="classes-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="classes-message error">
              {error}
            </div>
          )}

          <div className="classes-card">
            <h3 className="classes-form-title">Add Class</h3>
            <div className="classes-form-group">
              <label htmlFor="className">Class Name</label>
              <input
                type="text"
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Grade 10, Class A, Computer Science 101"
              />
            </div>
            <button 
              className="classes-btn" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <div className="classes-loading"></div>}
              {loading ? 'Adding...' : 'Add Class'}
            </button>
          </div>

          <div className="classes-stats">
            <div className="classes-stat-card">
              <div className="classes-stat-number">{classes.length}</div>
              <div className="classes-stat-label">Total Classes</div>
            </div>
          </div>

          <div className="classes-card">
            <div className="classes-list-header">
              <h3 className="classes-list-title">All Classes</h3>
              <div className="classes-view-toggle">
                <button 
                  className={`classes-btn secondary ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </button>
                <button 
                  className={`classes-btn secondary ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
            </div>
            
            {classes.length > 0 ? (
              viewMode === 'cards' ? (
                <div className="classes-grid">
                  {classes.map((classItem) => (
                    <div key={classItem.class_id} className="classes-class-card">
                      <div className="classes-card-id">ID: {classItem.class_id}</div>
                      <div className="classes-card-name">{classItem.class_name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="classes-table-container">
                  <table className="classes-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Class Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((classItem) => (
                        <tr key={classItem.class_id}>
                          <td>{classItem.class_id}</td>
                          <td>{classItem.class_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="classes-empty">
                No classes yet. Add your first class above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassesManagement;