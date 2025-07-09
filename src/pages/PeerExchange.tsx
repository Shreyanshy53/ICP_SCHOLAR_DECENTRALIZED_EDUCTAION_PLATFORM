import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  CurrencyDollarIcon, 
  ChatBubbleLeftIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { agentService } from '../services/agent';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface PeerNote {
  id: string;
  course_id: string;
  author: string;
  author_name: string;
  content: string;
  note_type: 'Question' | 'Answer' | 'Study Note' | 'Tip';
  created_at: number;
  tips_received: number;
}

const PeerExchange: React.FC = () => {
  const [notes, setNotes] = useState<PeerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNote, setNewNote] = useState({
    course_id: '',
    content: '',
    note_type: 'Study Note' as const,
  });
  const { isAuthenticated, principal } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        if (agentService.peer) {
          // Fetch all notes from shared storage
          const notesData = await agentService.peer.get_all_notes();
          setNotes(notesData);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to load peer notes');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotes();
      
      // Listen for global data updates
      const handleGlobalUpdate = () => {
        fetchNotes();
      };
      
      window.addEventListener('globalDataUpdate', handleGlobalUpdate);
      
      return () => {
        window.removeEventListener('globalDataUpdate', handleGlobalUpdate);
      };
    }
  }, [isAuthenticated]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim() || !newNote.course_id.trim()) return;

    try {
      if (agentService.peer) {
        await agentService.peer.create_peer_note(
          newNote.course_id,
          'Anonymous User', // In a real app, get from profile
          newNote.content,
          { [newNote.note_type]: null }
        );
        toast.success('Note created successfully!');
        setShowCreateModal(false);
        setNewNote({ course_id: '', content: '', note_type: 'Study Note' });
        // Refresh all notes
        const notesData = await agentService.peer.get_all_notes();
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleTipNote = async (noteId: string, amount: number) => {
    try {
      if (agentService.peer) {
        await agentService.peer.tip_peer_note(noteId, amount, 'Great contribution!');
        toast.success('Tip sent successfully!');
        // Refresh all notes to show updated tip count
        const notesData = await agentService.peer.get_all_notes();
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error tipping note:', error);
      toast.error('Failed to send tip');
    }
  };

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'Question':
        return QuestionMarkCircleIcon;
      case 'Answer':
        return ChatBubbleLeftIcon;
      case 'Tip':
        return LightBulbIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getNoteColor = (type: string) => {
    switch (type) {
      case 'Question':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
      case 'Answer':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
      case 'Tip':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access the peer exchange
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Peer Exchange
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Share knowledge, ask questions, and tip helpful peers
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Note
            </button>
          </div>
        </motion.div>

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notes...</p>
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-6">
            {notes.map((note, index) => {
              const Icon = getNoteIcon(note.note_type);
              const colorClass = getNoteColor(note.note_type);
              
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {note.author_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                            {note.note_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            {note.tips_received} tips
                          </div>
                          <button
                            onClick={() => handleTipNote(note.id, 10)}
                            className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200"
                          >
                            Tip 10 tokens
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Course: {note.course_id}</span>
                        <span>{new Date(note.created_at / 1000000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <ChatBubbleLeftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to share knowledge or ask a question!
            </p>
          </motion.div>
        )}

        {/* Create Note Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Note
              </h3>
              <form onSubmit={handleCreateNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course ID
                  </label>
                  <input
                    type="text"
                    value={newNote.course_id}
                    onChange={(e) => setNewNote({ ...newNote, course_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter course ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note Type
                  </label>
                  <select
                    value={newNote.note_type}
                    onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Study Note">Study Note</option>
                    <option value="Question">Question</option>
                    <option value="Answer">Answer</option>
                    <option value="Tip">Tip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Write your note here..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors duration-200"
                  >
                    Create Note
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerExchange;