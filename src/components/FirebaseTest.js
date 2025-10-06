import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import { classroomAPI } from '../services/api';
import { sectionAPI } from '../firebase/sectionService';
import { subjectAPI } from '../firebase/subjectService';

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    const results = [];

    try {
      // Test 1: Create a test classroom
      results.push('Testing classroom creation...');
      const testClassroom = {
        roomName: 'Test Room',
        roomCode: 'TEST001',
        roomType: 'Lecture Hall',
        capacity: 30,
        location: 'Building A',
        description: 'Test classroom for Firestore connection'
      };
      
      const classroomResult = await classroomAPI.create(testClassroom);
      results.push(`✅ Classroom created with ID: ${classroomResult.data.id}`);
      
      // Test 2: Create a test subject
      results.push('Testing subject creation...');
      const testSubject = {
        name: 'Test Mathematics',
        code: 'MATH001',
        description: 'Test subject for Firestore connection',
        category: 'Mathematics',
        requiredRoomType: 'Lecture Hall',
        durationPerWeek: '3'
      };
      
      const subjectResult = await subjectAPI.create(testSubject);
      results.push(`✅ Subject created with ID: ${subjectResult.data.id}`);
      
      // Test 3: Create a test section
      results.push('Testing section creation...');
      const testSection = {
        sectionName: 'Test STEM 1',
        sectionCode: 'STEM1',
        track: 'STEM',
        gradeLevel: 'Grade 11',
        maxStudents: 25,
        selectedSubjects: [subjectResult.data.id],
        description: 'Test section for Firestore connection'
      };
      
      const sectionResult = await sectionAPI.create(testSection);
      results.push(`✅ Section created with ID: ${sectionResult.data.id}`);
      
      // Test 4: Fetch all data
      results.push('Testing data retrieval...');
      const [classrooms, subjects, sections] = await Promise.all([
        classroomAPI.getAll(),
        subjectAPI.getAll(),
        sectionAPI.getAll()
      ]);
      
      results.push(`✅ Retrieved ${classrooms.data.length} classrooms`);
      results.push(`✅ Retrieved ${subjects.data.length} subjects`);
      results.push(`✅ Retrieved ${sections.data.length} sections`);
      
      results.push('🎉 All Firestore tests passed! Your database is connected and working.');
      
    } catch (error) {
      results.push(`❌ Error: ${error.message}`);
      console.error('Firestore test error:', error);
    }
    
    setTestResults(results);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Firebase Firestore Connection Test
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Firestore Connection
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            This will test if your Firestore database is properly connected and working.
            It will create test data and verify that it can be saved and retrieved.
          </Typography>
          <Button 
            variant="contained" 
            onClick={runTests}
            disabled={loading}
          >
            {loading ? 'Running Tests...' : 'Run Firestore Tests'}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Results:
            </Typography>
            {testResults.map((result, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                {result}
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FirebaseTest;

