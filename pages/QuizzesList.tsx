import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { dbService } from '../services/dbService';
import { Quiz } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Plus, BookOpen, Share2, Trash2, X } from 'lucide-react';

const QuizzesList = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [location]); // Reload when location changes (navigating back)

  const loadQuizzes = async () => {
    const data = await dbService.getQuizzes();
    setQuizzes(data);
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickShare = (id: string) => {
    const link = `${window.location.origin}/#/share/${id}`;
    navigator.clipboard.writeText(link);
    alert(t.messages.success.link_copied);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuizzes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuizzes.map(q => q.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      // Delete all selected quizzes
      await Promise.all(
        Array.from(selectedIds).map((id: string) => dbService.deleteQuiz(id))
      );

      // Reload quizzes
      await loadQuizzes();

      // Clear selection
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);

      alert(t.messages.success.quiz_deleted);
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`${t.messages.error.delete_failed}: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const selectedQuizzes = quizzes.filter(q => selectedIds.has(q.id));

  return (
    <div className="container mx-auto max-w-[1600px] px-4 lg:px-8">
      <div className="flex items-center justify-between mb-8 pt-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.quizzes_list.title}</h1>
        <button
          onClick={() => navigate('/create-quiz')}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition shadow-sm"
        >
          <Plus size={20} />
          {t.dashboard.create_quiz}
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {selectedIds.size}
            </div>
            <span className="font-semibold text-slate-900">
              {selectedIds.size} quiz{selectedIds.size > 1 ? 'zes' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              <Trash2 size={18} />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition border border-slate-200"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={t.quizzes_list.search_placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredQuizzes.length && filteredQuizzes.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.quizzes_list.columns.title}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.quizzes_list.columns.questions}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.quizzes_list.columns.created}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.quizzes_list.columns.status}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t.quizzes_list.columns.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No quizzes found matching your criteria.
                  </td>
                </tr>
              ) : filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.has(quiz.id) ? 'bg-primary-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(quiz.id)}
                      onChange={() => handleSelectOne(quiz.id)}
                      className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{quiz.title}</p>
                        <p className="text-xs text-slate-500 max-w-[200px] truncate">{quiz.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{quiz.questions.length} Qs</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${quiz.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                      }`}>
                      {quiz.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleQuickShare(quiz.id)}
                        className="text-slate-400 hover:text-primary-600 p-2 hover:bg-slate-100 rounded-lg transition"
                        title="Copy Public Link"
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/quiz-manager/${quiz.id}`)}
                        className="text-primary-600 hover:text-primary-700 font-bold text-sm hover:bg-primary-50 px-3 py-1.5 rounded-lg transition"
                      >
                        {t.quizzes_list.manage_btn}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Delete Quizzes?</h2>
            </div>

            <p className="text-slate-600 mb-4">
              Are you sure you want to delete {selectedIds.size} quiz{selectedIds.size > 1 ? 'zes' : ''}? This action cannot be undone.
            </p>

            <div className="bg-slate-50 rounded-lg p-3 mb-6 max-h-32 overflow-y-auto">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Quizzes to be deleted:</p>
              <ul className="space-y-1">
                {selectedQuizzes.map(q => (
                  <li key={q.id} className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {q.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesList;
