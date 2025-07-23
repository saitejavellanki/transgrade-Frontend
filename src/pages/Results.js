import React, { useState, useEffect } from 'react';
import { User, BarChart3, BookOpen, Award, TrendingUp, Clock, FileText, ArrowLeft } from 'lucide-react';
import '../csstemplates/StudentDashboard.css';

const API_BASE_URL = 'https://transback.transpoze.ai';

const StudentAnalyticsDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/students/`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnalytics = async (studentId) => {
    try {
      setAnalyticsLoading(true);
      // Fetch all results and filter by student
      const response = await fetch(`${API_BASE_URL}/results/`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const allResults = await response.json();
      
      // Filter results for the selected student
      const student = students.find(s => s.student_id === studentId);
      const matchingResults = allResults.filter(result => 
        result.student_name === student?.name || 
        result.student_roll_number === student?.roll_number
      );
      
      setAnalytics({
        student: student,
        results: matchingResults,
        totalScripts: matchingResults.length
      });
    } catch (err) {
      setError('Failed to load analytics: ' + err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    fetchStudentAnalytics(student.student_id);
  };

  const handleBackClick = () => {
    setSelectedStudent(null);
    setAnalytics(null);
  };

  const renderAnalyticsCard = (title, value, icon, colorClass = 'blue') => (
    <div className={`analytics-card ${colorClass}`}>
      <div className="card-content">
        <div className="card-text">
          <p className="card-title">{title}</p>
          <p className="card-value">{value}</p>
        </div>
        <div className="card-icon">
          {icon}
        </div>
      </div>
    </div>
  );

  const calculateAverageScore = (results) => {
    if (!results || results.length === 0) return '0';
    
    let totalScore = 0;
    let validScores = 0;
    
    results.forEach(result => {
      if (result.scored && typeof result.scored === 'object') {
        Object.values(result.scored).forEach(score => {
          if (typeof score === 'number') {
            totalScore += score;
            validScores++;
          }
        });
      }
    });
    
    return validScores > 0 ? (totalScore / validScores).toFixed(1) : '0';
  };

  const getLatestGrade = (results) => {
    if (!results || results.length === 0) return 'N/A';
    
    const latestResult = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    if (latestResult.graded && typeof latestResult.graded === 'object') {
      const grades = Object.values(latestResult.graded);
      return grades.length > 0 ? grades[0] : 'N/A';
    }
    
    return 'N/A';
  };

  const getSubjectsCount = (results) => {
    if (!results || results.length === 0) return 0;
    const subjects = new Set(results.map(result => result.subject_name));
    return subjects.size;
  };

  const getPerformanceTrend = (results) => {
    if (!results || results.length < 2) return 'stable';
    
    const sortedResults = results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstScore = Object.values(sortedResults[0].scored || {})[0] || 0;
    const lastScore = Object.values(sortedResults[sortedResults.length - 1].scored || {})[0] || 0;
    
    if (lastScore > firstScore) return 'improving';
    if (lastScore < firstScore) return 'declining';
    return 'stable';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="header-card">
          <h1 className="header-title">
            <BarChart3 size={32} />
            Student Analytics Dashboard
          </h1>
          <p className="header-subtitle">
            {selectedStudent ? `Analytics for ${selectedStudent.name}` : `Total Students: ${students.length}`}
          </p>
        </div>

        {!selectedStudent ? (
          /* Students List */
          <div className="students-grid">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="student-card"
                onClick={() => handleStudentClick(student)}
              >
                <div className="student-avatar">
                  <User size={24} />
                </div>
                <div className="student-info">
                  <h3 className="student-name">{student.name}</h3>
                  <p className="student-roll">Roll: {student.roll_number}</p>
                  <p className="student-class">Class: {student.class_name}</p>
                </div>
                <div className="student-arrow">→</div>
              </div>
            ))}
          </div>
        ) : (
          /* Analytics View */
          <div className="analytics-container">
            <button onClick={handleBackClick} className="back-button">
              <ArrowLeft size={20} />
              Back to Students
            </button>

            {analyticsLoading ? (
              <div className="analytics-loading">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
              </div>
            ) : analytics ? (
              <>
                {/* Student Info Card */}
                <div className="student-detail-card">
                  <div className="student-detail-avatar">
                    <User size={48} />
                  </div>
                  <div className="student-detail-info">
                    <h2>{analytics.student.name}</h2>
                    <p>Roll Number: {analytics.student.roll_number}</p>
                    <p>Class: {analytics.student.class_name}</p>
                  </div>
                </div>

                {/* Analytics Cards */}
                <div className="analytics-grid">
                  {renderAnalyticsCard(
                    'Total Scripts',
                    analytics.totalScripts,
                    <FileText size={24} />,
                    'blue'
                  )}
                  {renderAnalyticsCard(
                    'Average Score',
                    calculateAverageScore(analytics.results),
                    <Award size={24} />,
                    'green'
                  )}
                  {renderAnalyticsCard(
                    'Latest Grade',
                    getLatestGrade(analytics.results),
                    <BookOpen size={24} />,
                    'purple'
                  )}
                  {renderAnalyticsCard(
                    'Subjects',
                    getSubjectsCount(analytics.results),
                    <TrendingUp size={24} />,
                    'orange'
                  )}
                </div>

                {/* Recent Results */}
                {analytics.results.length > 0 && (
                  <div className="results-section">
                    <h3 className="results-title">Recent Results</h3>
                    <div className="results-list">
                      {analytics.results.slice(0, 5).map((result, index) => (
                        <div key={result.result_id} className="result-item">
                          <div className="result-info">
                            <h4>{result.subject_name}</h4>
                            <p className="result-date">
                              {new Date(result.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="result-score">
                            <span className="score-value">
                              {Object.values(result.scored || {})[0] || 'N/A'}
                            </span>
                            <span className="grade-value">
                              {Object.values(result.graded || {})[0] || 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics Data */}
                {analytics.results.length > 0 && analytics.results[0].analytics && (
                  <div className="detailed-analytics">
                    <h3 className="analytics-title">Detailed Analytics</h3>
                    <div className="analytics-data">
                      <pre>{JSON.stringify(analytics.results[0].analytics, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data">
                <p>No analytics data available for this student.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalyticsDashboard;