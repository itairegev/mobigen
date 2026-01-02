import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { PlusCircle, X } from 'lucide-react-native';
import { LessonNote } from '@/types';

interface NotesEditorProps {
  notes: LessonNote[];
  onAddNote: (content: string, timestamp: number) => void;
  onDeleteNote: (noteId: string) => void;
  currentTimestamp?: number;
  testID?: string;
}

export function NotesEditor({
  notes,
  onAddNote,
  onDeleteNote,
  currentTimestamp = 0,
  testID,
}: NotesEditorProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = () => {
    if (noteContent.trim()) {
      onAddNote(noteContent.trim(), currentTimestamp);
      setNoteContent('');
      setIsAdding(false);
    }
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-white dark:bg-slate-800 p-4" testID={testID}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Lesson Notes
        </Text>
        {!isAdding && (
          <TouchableOpacity
            onPress={() => setIsAdding(true)}
            className="flex-row items-center"
            testID="add-note-button"
          >
            <PlusCircle size={20} color="#6366f1" />
            <Text className="text-primary-600 dark:text-primary-400 ml-1 font-semibold">
              Add Note
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isAdding && (
        <View className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            At {formatTimestamp(currentTimestamp)}
          </Text>
          <TextInput
            value={noteContent}
            onChangeText={setNoteContent}
            placeholder="Write your note..."
            placeholderTextColor="#94a3b8"
            multiline
            className="bg-white dark:bg-slate-600 p-3 rounded-lg text-gray-900 dark:text-white mb-2 min-h-[80px]"
            testID="note-input"
          />
          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={() => {
                setNoteContent('');
                setIsAdding(false);
              }}
              className="px-4 py-2 mr-2"
            >
              <Text className="text-gray-600 dark:text-gray-400">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddNote}
              className="px-4 py-2 bg-primary-600 rounded-lg"
              testID="save-note-button"
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView className="max-h-64">
        {notes.length === 0 ? (
          <Text className="text-center text-gray-500 dark:text-gray-400 py-8">
            No notes yet. Add notes to remember key points!
          </Text>
        ) : (
          notes.map((note) => (
            <View
              key={note.id}
              className="mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
              testID={`note-${note.id}`}
            >
              <View className="flex-row items-start justify-between mb-1">
                <Text className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                  {formatTimestamp(note.timestamp)}
                </Text>
                <TouchableOpacity
                  onPress={() => onDeleteNote(note.id)}
                  testID={`delete-note-${note.id}`}
                >
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-900 dark:text-white">{note.content}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {note.createdAt.toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
