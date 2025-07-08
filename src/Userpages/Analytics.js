import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, FileText, TrendingUp, Award, BookOpen, AlertCircle, CheckCircle, Target, Sparkles, Brain, ChevronRight } from 'lucide-react';

const StudentAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const parseMarksString = (marksString) => {
    // Handle different formats like "59.5/80", "6/8", etc.
    const match = marksString.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (match) {
      return {
        scored: parseFloat(match[1]),
        total: parseFloat(match[2])
      };
    }
    return { scored: 0, total: 0 };
  };

  const processData = (questionsArray, totalMarksString) => {
    const totalQuestions = questionsArray.length;
    
    // Parse the actual total marks from the summary string
    const actualMarks = parseMarksString(totalMarksString);
    const actualScoredMarks = actualMarks.scored;
    const actualTotalMarks = actualMarks.total;
    const actualPercentage = actualTotalMarks > 0 ? ((actualScoredMarks / actualTotalMarks) * 100) : 0;

    // Calculate marks from individual questions for comparison
    const calculatedTotalMarks = questionsArray.reduce((sum, item) => sum + (item.rubric_max_marks || 0), 0);
    const calculatedScoredMarks = questionsArray.reduce((sum, item) => sum + (item.final_marks_awarded || 0), 0);

    // Use actual marks if available, otherwise fall back to calculated
    const finalScoredMarks = actualScoredMarks || calculatedScoredMarks;
    const finalTotalMarks = actualTotalMarks || calculatedTotalMarks;
    const finalPercentage = finalTotalMarks > 0 ? ((finalScoredMarks / finalTotalMarks) * 100) : 0;

    // Performance by question
    const questionPerformance = questionsArray.map(item => {
      const scored = item.final_marks_awarded || 0;
      const total = item.rubric_max_marks || 1;
      const percentage = total > 0 ? ((scored / total) * 100) : 0;
      
      return {
        questionId: item.question_id || 'Unknown',
        scored: scored,
        total: total,
        percentage: percentage.toFixed(1),
        concept: item.concepts_covered ? item.concepts_covered.split(',')[0].trim() : 'General'
      };
    });

    // Performance distribution based on individual questions
    const performanceDistribution = [
      { name: 'Excellent', range: '90-100%', count: 0, color: '#10b981' },
      { name: 'Good', range: '70-89%', count: 0, color: '#3b82f6' },
      { name: 'Average', range: '50-69%', count: 0, color: '#f59e0b' },
      { name: 'Needs Work', range: '<50%', count: 0, color: '#ef4444' }
    ];

    questionPerformance.forEach(q => {
      const perc = parseFloat(q.percentage);
      if (perc >= 90) performanceDistribution[0].count++;
      else if (perc >= 70) performanceDistribution[1].count++;
      else if (perc >= 50) performanceDistribution[2].count++;
      else performanceDistribution[3].count++;
    });

    // Concepts analysis
    const conceptsMap = new Map();
    questionsArray.forEach(item => {
      if (!item.concepts_covered) return;
      
      const concepts = item.concepts_covered.split(',').map(c => c.trim()).filter(c => c);
      const scored = item.final_marks_awarded || 0;
      const total = item.rubric_max_marks || 0;
      
      concepts.forEach(concept => {
        if (!conceptsMap.has(concept)) {
          conceptsMap.set(concept, { total: 0, scored: 0, questions: [] });
        }
        const conceptData = conceptsMap.get(concept);
        conceptData.total += total;
        conceptData.scored += scored;
        conceptData.questions.push(item.question_id || 'Unknown');
      });
    });

    const conceptsAnalysis = Array.from(conceptsMap.entries()).map(([concept, data]) => ({
      concept,
      percentage: data.total > 0 ? ((data.scored / data.total) * 100).toFixed(1) : '0.0',
      questionsCount: data.questions.length,
      scored: data.scored,
      total: data.total
    })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    // Strengths and improvements based on individual question performance
    const strengths = questionPerformance.filter(q => parseFloat(q.percentage) >= 80);
    const needsImprovement = questionPerformance.filter(q => parseFloat(q.percentage) < 70);

    return {
      summary: {
        totalQuestions,
        totalMarks: finalTotalMarks,
        scoredMarks: finalScoredMarks,
        percentage: finalPercentage.toFixed(1),
        grade: getGrade(finalPercentage),
        originalMarksString: totalMarksString
      },
      questionPerformance,
      performanceDistribution,
      conceptsAnalysis,
      strengths,
      needsImprovement,
      detailedFeedback: questionsArray
    };
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'from-emerald-500 to-green-500', textColor: 'text-emerald-600' };
    if (percentage >= 85) return { grade: 'A', color: 'from-emerald-500 to-green-500', textColor: 'text-emerald-600' };
    if (percentage >= 80) return { grade: 'B+', color: 'from-green-500 to-emerald-500', textColor: 'text-green-600' };
    if (percentage >= 75) return { grade: 'B', color: 'from-blue-500 to-cyan-500', textColor: 'text-blue-600' };
    if (percentage >= 70) return { grade: 'C+', color: 'from-blue-500 to-cyan-500', textColor: 'text-blue-600' };
    if (percentage >= 65) return { grade: 'C', color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-600' };
    if (percentage >= 60) return { grade: 'D+', color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-600' };
    if (percentage >= 50) return { grade: 'D', color: 'from-orange-500 to-red-500', textColor: 'text-orange-600' };
    return { grade: 'F', color: 'from-red-500 to-pink-500', textColor: 'text-red-600' };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file.name);
    setIsLoading(true);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Validate JSON structure
      if (!jsonData.graded_output || !jsonData.graded_output.questions) {
        throw new Error('Invalid JSON structure. Expected graded_output.questions array.');
      }

      const questionsArray = jsonData.graded_output.questions;
      const totalMarksString = jsonData.graded_output.total_marks_of_student || '';

      // Add a small delay for better UX
      setTimeout(() => {
        setData(questionsArray);
        setAnalytics(processData(questionsArray, totalMarksString));
        setIsLoading(false);
      }, 800);
    } catch (error) {
      alert(Error reading file: ${error.message}\nPlease ensure it's a valid JSON file with the correct structure.);
      console.error('File reading error:', error);
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, delay = 0 }) => (
    <div 
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 border border-white/20 hover:scale-105 overflow-hidden"
      style={{
        animation: slideInUp 0.6s ease-out ${delay}s both
      }}
    >
      <div className={absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Processing your data...</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
          }
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl float-animation">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Student Analytics Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your assessment data into powerful insights with our advanced analytics platform
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/30 mb-8 hover:shadow-3xl transition-all duration-500">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl float-animation">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full animate-pulse"></div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Upload Your Assessment Data</h2>
              <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                Upload your JSON assessment file to unlock comprehensive performance analytics, insights, and personalized feedback
              </p>
              
              <label className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 transform">
                <FileText className="w-5 h-5 mr-3" />
                <span className="font-semibold">Choose JSON File</span>
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </label>
              
              {selectedFile && (
                <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-200 inline-block">
                  <p className="text-green-700 font-medium flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Selected: {selectedFile}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-indigo-600" />
              Expected JSON Format
            </h3>
            <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono leading-relaxed">
{`{
  "graded_output": {
    "questions": [
      {
        "question_id": "A1",
        "question_text": "Question text here",
        "rubric_max_marks": 1,
        "student_answer": "Student answer here",
        "reference_answer": "Reference answer here",
        "final_marks_awarded": 1,
        "concepts_covered": "Concept 1, Concept 2",
        "feedback": "Feedback text here"
      }
    ],
    "total_marks_of_student": "59.5/80"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pt-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Performance Analytics
            </h1>
            <p className="text-gray-600 text-lg">Comprehensive insights into your academic performance</p>
            {analytics.summary.originalMarksString && (
              <div className="mt-2 text-lg text-green-700 font-semibold">
                Total Marks: {analytics.summary.originalMarksString}
              </div>
            )}
          </div>
          <label className="group relative inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl cursor-pointer hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl border border-white/30">
            <Upload className="w-4 h-4 mr-2" />
            <span className="font-medium">Upload New File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 bg-white/60 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/30">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'concepts', label: 'Concepts', icon: Brain },
            { id: 'feedback', label: 'Feedback', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Overall Score"
                value={${analytics.summary.percentage}%}
                subtitle={${analytics.summary.scoredMarks}/${analytics.summary.totalMarks} marks}
                icon={Target}
                gradient="from-blue-500 to-indigo-600"
                delay={0}
              />
              <StatCard
                title="Grade"
                value={analytics.summary.grade.grade}
                subtitle="Based on percentage"
                icon={Award}
                gradient={analytics.summary.grade.color}
                delay={0.1}
              />
              <StatCard
                title="Questions"
                value={analytics.summary.totalQuestions}
                subtitle="Total attempted"
                icon={BookOpen}
                gradient="from-purple-500 to-pink-600"
                delay={0.2}
              />
              <StatCard
                title="Strong Areas"
                value={analytics.strengths.length}
                subtitle="Questions scored ≥80%"
                icon={CheckCircle}
                gradient="from-emerald-500 to-green-600"
                delay={0.3}
              />
            </div>

            {/* Performance Distribution */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30" style={{ animation: 'scaleIn 0.6s ease-out 0.4s both' }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-indigo-600" />
                Performance Distribution
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {analytics.performanceDistribution.map((item, index) => (
                  <div key={index} className="text-center p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg">
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: item.color }}>
                      {item.count}
                    </div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-8" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question Performance Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                  Question-wise Performance
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analytics.questionPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="questionId" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      formatter={(value) => [${value}%, 'Score']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Bar 
                      dataKey="percentage" 
                      fill="url(#blueGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Strengths and Improvements */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/30">
                  <h3 className="text-lg font-bold text-emerald-600 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Strong Performance
                  </h3>
                  {analytics.strengths.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {analytics.strengths.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                          <span className="font-medium text-gray-800">{item.questionId}</span>
                          <span className="text-emerald-600 font-bold">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No questions scored above 80%</p>
                  )}
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/30">
                  <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  {analytics.needsImprovement.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {analytics.needsImprovement.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                          <span className="font-medium text-gray-800">{item.questionId}</span>
                          <span className="text-orange-600 font-bold">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">All questions scored above 70%</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Concepts Tab */}
        {activeTab === 'concepts' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
              <Brain className="w-6 h-6 mr-3 text-purple-600" />
              Concepts Performance Analysis
            </h3>
            <div className="grid gap-4">
              {analytics.conceptsAnalysis.length > 0 ? (
                analytics.conceptsAnalysis.map((concept, index) => (
                  <div key={index} className="group p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-800">{concept.concept}</h4>
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                        parseFloat(concept.percentage) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        parseFloat(concept.percentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {concept.percentage}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{concept.questionsCount} questions</span>
                      <span>{concept.scored}/{concept.total} marks</span>
                    </div>
                    <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          parseFloat(concept.percentage) >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                          parseFloat(concept.percentage) >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: ${Math.min(parseFloat(concept.percentage), 100)}% }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-center py-8">No concept data available</p>
              )}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-indigo-600" />
                Detailed Question Feedback
              </h3>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {analytics.detailedFeedback.map((question, index) => (
                  <div key={index} className="p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">
                          Question {question.question_id || index + 1}
                        </h4>
                        <p className="text-gray-600 text-sm mb-3">
                          {question.question_text || 'Question text not available'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          (question.final_marks_awarded || 0) / (question.rubric_max_marks || 1) >= 0.8 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (question.final_marks_awarded || 0) / (question.rubric_max_marks || 1) >= 0.6 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {question.final_marks_awarded || 0}/{question.rubric_max_marks || 0}
                        </div>
                      </div>
                    </div>
                    
                    {question.student_answer && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Your Answer:</h5>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-gray-700 text-sm">{question.student_answer}</p>
                        </div>
                      </div>
                    )}
                    
                    {question.reference_answer && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Reference Answer:</h5>
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <p className="text-gray-700 text-sm">{question.reference_answer}</p>
                        </div>
                      </div>
                    )}
                    
                    {question.feedback && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Feedback:</h5>
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                          <p className="text-gray-700 text-sm">{question.feedback}</p>
                        </div>
                      </div>
                    )}
                    
                    {question.concepts_covered && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Concepts:</span>
                        <div className="flex flex-wrap gap-2">
                          {question.concepts_covered.split(',').map((concept, idx) => (
                            <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              {concept.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalyticsDashboard;