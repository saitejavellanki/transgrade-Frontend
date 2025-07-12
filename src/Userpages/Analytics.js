import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, TrendingUp, Award, BookOpen, AlertCircle, CheckCircle, Target, Search } from 'lucide-react';
import '../csstemplates/dashboard.css';

const CompactAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [scriptId, setScriptId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (id) => {
    if (!id) {
      setError('Please enter a script ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://transback.transpoze.ai/results/?script_id=${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // If multiple results, take the first one
        const result = data[0];
        if (result.analytics && Object.keys(result.analytics).length > 0) {
          setAnalytics(result.analytics);
        } else {
          setError('No analytics data found for this script');
        }
      } else {
        setError('No results found for this script ID');
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnalytics(scriptId);
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'grade-a-plus' };
    if (percentage >= 85) return { grade: 'A', color: 'grade-a' };
    if (percentage >= 80) return { grade: 'B+', color: 'grade-b-plus' };
    if (percentage >= 75) return { grade: 'B', color: 'grade-b' };
    if (percentage >= 70) return { grade: 'C+', color: 'grade-c-plus' };
    if (percentage >= 65) return { grade: 'C', color: 'grade-c' };
    if (percentage >= 60) return { grade: 'D+', color: 'grade-d-plus' };
    if (percentage >= 50) return { grade: 'D', color: 'grade-d' };
    return { grade: 'F', color: 'grade-f' };
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="stat-card">
      <div className="stat-header">
        <Icon className={`stat-icon ${color}`} />
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Analytics Dashboard</h1>
          <p className="dashboard-description">Enter a script ID to view performance analytics</p>
        </div>

        {/* Search Form */}
        <div className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={scriptId}
              onChange={(e) => setScriptId(e.target.value)}
              placeholder="Enter Script ID"
              className="search-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
            <button
              onClick={handleSubmit}
              className="search-button"
            >
              <Search className="search-icon" />
              Fetch Analytics
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Analytics Content */}
        {analytics && (
          <div className="analytics-content">
            {/* Summary Stats */}
            {analytics.summary && (
              <div className="stats-grid">
                <StatCard
                  title="Overall Score"
                  value={`${analytics.summary.percentage}%`}
                  subtitle={`${analytics.summary.scoredMarks}/${analytics.summary.totalMarks} marks`}
                  icon={Target}
                  color="icon-blue"
                />
                <StatCard
                  title="Grade"
                  value={getGrade(parseFloat(analytics.summary.percentage)).grade}
                  subtitle="Based on percentage"
                  icon={Award}
                  color={getGrade(parseFloat(analytics.summary.percentage)).color}
                />
                <StatCard
                  title="Questions"
                  value={analytics.summary.totalQuestions}
                  subtitle="Total attempted"
                  icon={BookOpen}
                  color="icon-purple"
                />
                <StatCard
                  title="Strong Areas"
                  value={analytics.strengths?.length || 0}
                  subtitle="Questions scored ≥80%"
                  icon={CheckCircle}
                  color="icon-green"
                />
              </div>
            )}

            {/* Performance Chart */}
            {analytics.questionPerformance && (
              <div className="chart-container">
                <h3 className="chart-title">
                  <TrendingUp className="chart-icon" />
                  Question Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.questionPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="questionId" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Bar dataKey="percentage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Concepts Analysis */}
            {analytics.conceptsAnalysis && analytics.conceptsAnalysis.length > 0 && (
              <div className="concepts-container">
                <h3 className="concepts-title">Concepts Performance</h3>
                <div className="concepts-list">
                  {analytics.conceptsAnalysis.map((concept, index) => (
                    <div key={index} className="concept-item">
                      <div className="concept-info">
                        <h4 className="concept-name">{concept.concept}</h4>
                        <p className="concept-questions">{concept.questionsCount} questions</p>
                      </div>
                      <div className="concept-score">
                        <div className={`score-badge ${
                          parseFloat(concept.percentage) >= 80 ? 'score-good' :
                          parseFloat(concept.percentage) >= 60 ? 'score-medium' :
                          'score-poor'
                        }`}>
                          {concept.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {analytics.needsImprovement && analytics.needsImprovement.length > 0 && (
              <div className="improvement-container">
                <h3 className="improvement-title">
                  <AlertCircle className="improvement-icon" />
                  Areas for Improvement
                </h3>
                <div className="improvement-grid">
                  {analytics.needsImprovement.map((item, index) => (
                    <div key={index} className="improvement-item">
                      <span className="improvement-question">{item.questionId}</span>
                      <span className="improvement-score">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactAnalyticsDashboard;