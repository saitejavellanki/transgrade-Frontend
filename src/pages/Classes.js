import React, { useState, useEffect } from 'react';

// CSS styles for classes management
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .classes-body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    min-height: 100vh;
    padding: 20px;
  }

  .classes-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .classes-header {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }

  .classes-header h1 {
    font-size: 28px;
    margin-bottom: 10px;
    font-weight: 700;
  }

  .classes-header p {
    font-size: 16px;
    opacity: 0.9;
  }

  .classes-content {
    padding: 40px 30px;
  }

  .classes-form-section {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 30px;
    border-left: 4px solid #e74c3c;
  }

  .classes-form-title {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 20px;
  }

  .classes-form-group {
    margin-bottom: 20px;
  }

  .classes-form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }

  .classes-form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
    background-color: white;
  }

  .classes-form-group input:focus {
    outline: none;
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  .classes-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .classes-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
  }

  .classes-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .classes-loading {
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

  .classes-message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
  }

  .classes-message.success {
    background-color: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .classes-message.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .classes-list-section {
    margin-top: 30px;
  }

  .classes-list-title {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 20px;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
  }

  .classes-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .classes-table th,
  .classes-table td {
    padding: 15px 20px;
    text-align: left;
    border-bottom: 1px solid #ecf0f1;
  }

  .classes-table th {
    background: #34495e;
    color: white;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .classes-table tr:hover {
    background-color: #f8f9fa;
  }

  .classes-table tr:last-child td {
    border-bottom: none;
  }

  .classes-empty {
    text-align: center;
    padding: 40px;
    color: #6c757d;
    font-style: italic;
  }

  .classes-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 15px;
  }

  .classes-stat-card {
    flex: 1;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }

  .classes-stat-number {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .classes-stat-label {
    font-size: 14px;
    opacity: 0.9;
  }

  .classes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .classes-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #e74c3c;
    transition: transform 0.2s ease;
  }

  .classes-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .classes-card-id {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 5px;
    font-weight: 500;
  }

  .classes-card-name {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
  }

  @media (max-width: 600px) {
    .classes-container {
      margin: 10px;
      border-radius: 8px;
    }

    .classes-header {
      padding: 20px;
    }

    .classes-header h1 {
      font-size: 24px;
    }

    .classes-content {
      padding: 30px 20px;
    }

    .classes-form-section {
      padding: 20px;
    }

    .classes-stats {
      flex-direction: column;
    }

    .classes-grid {
      grid-template-columns: 1fr;
    }

    .classes-table {
      font-size: 14px;
    }

    .classes-table th,
    .classes-table td {
      padding: 10px 15px;
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
          <h1>Classes Management</h1>
          <p>Add and manage classes in your system</p>
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

          <div className="classes-form-section">
            <h3 className="classes-form-title">Add New Class</h3>
            <div className="classes-form-group">
              <label htmlFor="className">Class Name</label>
              <input
                type="text"
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter class name (e.g., Grade 10, Class A, Computer Science 101)"
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

          <div className="classes-list-section">
            <div className="classes-stats">
              <div className="classes-stat-card">
                <div className="classes-stat-number">{classes.length}</div>
                <div className="classes-stat-label">Total Classes</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="classes-list-title">All Classes</h3>
              <div>
                <button 
                  className={`classes-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  style={{ marginRight: '10px', padding: '8px 16px', fontSize: '12px' }}
                >
                  Cards View
                </button>
                <button 
                  className={`classes-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Table View
                </button>
              </div>
            </div>
            
            {classes.length > 0 ? (
              viewMode === 'cards' ? (
                <div className="classes-grid">
                  {classes.map((classItem) => (
                    <div key={classItem.class_id} className="classes-card">
                      <div className="classes-card-id">ID: {classItem.class_id}</div>
                      <div className="classes-card-name">{classItem.class_name}</div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )
            ) : (
              <div className="classes-empty">
                No classes found. Add your first class above!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassesManagement;