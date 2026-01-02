import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { FileText, Video, Link as LinkIcon, Image as ImageIcon, Download } from 'lucide-react-native';

// Mock resources data
const MOCK_RESOURCES = [
  {
    id: 'res-1',
    title: 'Algebra II Study Guide',
    description: 'Comprehensive study guide for quadratic equations',
    type: 'pdf' as const,
    url: 'https://example.com/algebra-guide.pdf',
    subjectId: 'math-101',
    subjectName: 'Algebra II',
    subjectColor: '#6366f1',
    uploadedBy: 'Mrs. Johnson',
    uploadedAt: '2024-01-15T10:00:00Z',
    fileSize: 2450000,
    downloads: 45,
  },
  {
    id: 'res-2',
    title: 'To Kill a Mockingbird - Discussion Questions',
    description: 'Questions for chapter discussions',
    type: 'doc' as const,
    url: 'https://example.com/mockingbird-questions.docx',
    subjectId: 'eng-101',
    subjectName: 'English Literature',
    subjectColor: '#ec4899',
    uploadedBy: 'Mr. Peterson',
    uploadedAt: '2024-01-14T14:30:00Z',
    fileSize: 125000,
    downloads: 32,
  },
  {
    id: 'res-3',
    title: 'Cell Biology Lecture Recording',
    description: 'Video recording of last week\'s lecture on cell structure',
    type: 'video' as const,
    url: 'https://example.com/cell-biology-lecture.mp4',
    subjectId: 'sci-101',
    subjectName: 'Biology',
    subjectColor: '#10b981',
    uploadedBy: 'Dr. Martinez',
    uploadedAt: '2024-01-12T09:00:00Z',
    fileSize: 156000000,
    downloads: 78,
  },
  {
    id: 'res-4',
    title: 'World War II Timeline',
    description: 'Interactive timeline of major WWII events',
    type: 'link' as const,
    url: 'https://example.com/wwii-timeline',
    subjectId: 'hist-101',
    subjectName: 'World History',
    subjectColor: '#f59e0b',
    uploadedBy: 'Ms. Davis',
    uploadedAt: '2024-01-10T16:00:00Z',
    downloads: 56,
  },
  {
    id: 'res-5',
    title: 'JavaScript Cheat Sheet',
    description: 'Quick reference for JavaScript syntax',
    type: 'pdf' as const,
    url: 'https://example.com/js-cheatsheet.pdf',
    subjectId: 'cs-101',
    subjectName: 'Computer Science',
    subjectColor: '#3b82f6',
    uploadedBy: 'Mr. Anderson',
    uploadedAt: '2024-01-08T11:00:00Z',
    fileSize: 890000,
    downloads: 92,
  },
];

export default function ResourcesScreen() {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'presentation':
      case 'spreadsheet':
        return <FileText size={24} className="text-blue-600" />;
      case 'video':
        return <Video size={24} className="text-purple-600" />;
      case 'link':
        return <LinkIcon size={24} className="text-green-600" />;
      case 'image':
        return <ImageIcon size={24} className="text-amber-600" />;
      default:
        return <FileText size={24} className="text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Study Resources</Text>

        {MOCK_RESOURCES.map((resource) => (
          <Pressable
            key={resource.id}
            className="bg-white p-4 rounded-lg border border-gray-200 mb-3"
            testID={`resource-${resource.id}`}
          >
            <View className="flex-row gap-3">
              <View className="mt-1">{getResourceIcon(resource.type)}</View>

              <View className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>
                  {resource.title}
                </Text>

                {resource.description && (
                  <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                    {resource.description}
                  </Text>
                )}

                <View
                  className="px-2 py-0.5 rounded mb-2"
                  style={{
                    backgroundColor: resource.subjectColor + '20',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: resource.subjectColor }}>
                    {resource.subjectName}
                  </Text>
                </View>

                <View className="flex-row items-center gap-4 flex-wrap">
                  <Text className="text-xs text-gray-500">
                    By {resource.uploadedBy}
                  </Text>

                  {resource.fileSize && (
                    <>
                      <Text className="text-xs text-gray-400">•</Text>
                      <Text className="text-xs text-gray-500">
                        {formatFileSize(resource.fileSize)}
                      </Text>
                    </>
                  )}

                  <Text className="text-xs text-gray-400">•</Text>
                  <View className="flex-row items-center gap-1">
                    <Download size={12} className="text-gray-500" />
                    <Text className="text-xs text-gray-500">{resource.downloads}</Text>
                  </View>
                </View>

                <Pressable className="mt-3 bg-primary-50 px-4 py-2 rounded-lg">
                  <Text className="text-primary-700 font-medium text-sm text-center">
                    {resource.type === 'link' ? 'Open Link' : 'Download'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
