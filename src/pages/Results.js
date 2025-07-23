import React, { useState, useEffect } from 'react';
import { User, BarChart3, ArrowLeft } from 'lucide-react';

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
        results: matchingResults
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 size={32} />
            Student Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            {selectedStudent ? `Raw Analytics for ${selectedStudent.name}` : `Total Students: ${students.length}`}
          </p>
        </div>

        {!selectedStudent ? (
          /* Students List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleStudentClick(student)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">Roll: {student.roll_number}</p>
                    <p className="text-sm text-gray-600">Class: {student.class_name}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Analytics View */
          <div>
            <button 
              onClick={handleBackClick} 
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <ArrowLeft size={20} />
              Back to Students
            </button>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              </div>
            ) : analytics ? (
              <>
                {/* Student Info */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={32} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{analytics.student.name}</h2>
                      <p className="text-gray-600">Roll Number: {analytics.student.roll_number}</p>
                      <p className="text-gray-600">Class: {analytics.student.class_name}</p>
                    </div>
                  </div>
                </div>

                {/* Raw Analytics Data */}
                {analytics.results.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Raw Analytics Data</h3>
                    <div className="space-y-6">
                      {analytics.results.map((result, index) => (
                        <div key={result.result_id} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h4 className="font-medium text-gray-900 mb-3">
                            Result {index + 1} - {result.subject_name} ({new Date(result.created_at).toLocaleDateString()})
                          </h4>
                          <div className="bg-gray-50 rounded p-4">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <p className="text-gray-600">No analytics data available for this student.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">No analytics data available for this student.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalyticsDashboard;