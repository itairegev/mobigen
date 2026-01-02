import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { User, Mail, GraduationCap, Calendar, TrendingUp, LogOut, Settings } from 'lucide-react-native';
import { useSubjects } from '../../hooks/useSubjects';
import { useGPA } from '../../hooks/useGrades';

export default function ProfileScreen() {
  const { data: subjects } = useSubjects();
  const { data: gpa } = useGPA();

  // Mock student data
  const student = {
    name: 'Alex Johnson',
    email: 'alex.johnson@school.edu',
    studentId: 'S2024-1234',
    grade: '10th Grade',
    avatar: '👤',
  };

  const attendance = {
    present: 156,
    absent: 3,
    tardy: 2,
    total: 161,
    percentage: 96.9,
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-600 px-4 pt-8 pb-12">
        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-3">
            <Text className="text-5xl">{student.avatar}</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">{student.name}</Text>
          <Text className="text-primary-100 text-sm">{student.grade}</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View className="px-4 -mt-8 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <TrendingUp size={20} className="text-green-600 mb-2" />
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {gpa?.toFixed(2) || '0.00'}
            </Text>
            <Text className="text-xs text-gray-600">GPA</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <Calendar size={20} className="text-blue-600 mb-2" />
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {attendance.percentage}%
            </Text>
            <Text className="text-xs text-gray-600">Attendance</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <GraduationCap size={20} className="text-purple-600 mb-2" />
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {subjects?.length || 0}
            </Text>
            <Text className="text-xs text-gray-600">Courses</Text>
          </View>
        </View>
      </View>

      {/* Student Information */}
      <View className="px-4 mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Student Information</Text>
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <User size={20} className="text-gray-400 mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Student ID</Text>
              <Text className="text-sm text-gray-900">{student.studentId}</Text>
            </View>
          </View>

          <View className="flex-row items-center p-4 border-b border-gray-100">
            <Mail size={20} className="text-gray-400 mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Email</Text>
              <Text className="text-sm text-gray-900">{student.email}</Text>
            </View>
          </View>

          <View className="flex-row items-center p-4">
            <GraduationCap size={20} className="text-gray-400 mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Grade Level</Text>
              <Text className="text-sm text-gray-900">{student.grade}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Attendance Details */}
      <View className="px-4 mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Attendance</Text>
        <View className="bg-white p-4 rounded-lg border border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-600">Overall Attendance</Text>
            <Text className="text-lg font-bold text-green-600">
              {attendance.percentage}%
            </Text>
          </View>

          <View className="h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
            <View
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${attendance.percentage}%` }}
            />
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Present</Text>
              <Text className="text-sm font-medium text-gray-900">{attendance.present} days</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Absent</Text>
              <Text className="text-sm font-medium text-gray-900">{attendance.absent} days</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Tardy</Text>
              <Text className="text-sm font-medium text-gray-900">{attendance.tardy} days</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="px-4 pb-8">
        <Pressable className="flex-row items-center justify-between p-4 bg-white rounded-lg border border-gray-200 mb-2">
          <View className="flex-row items-center gap-3">
            <Settings size={20} className="text-gray-600" />
            <Text className="text-gray-900">Settings</Text>
          </View>
          <Text className="text-gray-400">›</Text>
        </Pressable>

        <Pressable className="flex-row items-center justify-between p-4 bg-white rounded-lg border border-red-200">
          <View className="flex-row items-center gap-3">
            <LogOut size={20} className="text-red-600" />
            <Text className="text-red-600">Sign Out</Text>
          </View>
          <Text className="text-red-400">›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
