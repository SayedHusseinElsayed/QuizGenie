import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { dbService } from '../services/dbService';
import { StudentProfile as StudentProfileType, StudentDetails } from '../types';
import { ArrowLeft, User, Mail, Calendar, Phone, MapPin, Users, FileText, TrendingUp, Award, Edit2, Save, X } from 'lucide-react';

const CircleProgress = ({ percentage }: { percentage: number }) => {
    const size = 40;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    let color = 'text-primary-600';
    if (percentage >= 80) color = 'text-green-500';
    else if (percentage < 50) color = 'text-amber-500';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle className="text-slate-100" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                <circle
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius} cx={size / 2} cy={size / 2}
                />
            </svg>
            <span className={`absolute text-[10px] font-bold ${color}`}>{Math.round(percentage)}%</span>
        </div>
    );
};

const StudentProfile = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { t, user } = useApp();
    const [profile, setProfile] = useState<StudentProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState<Partial<StudentDetails>>({});

    useEffect(() => {
        loadProfile();
    }, [studentId]);

    const loadProfile = async () => {
        if (!studentId || !user) return;

        setLoading(true);
        const data = await dbService.getStudentProfile(studentId, user.id);
        setProfile(data);
        if (data?.details) {
            setEditedDetails(data.details);
        }
        setLoading(false);
    };

    const handleSaveDetails = async () => {
        if (!studentId || !user) return;

        try {
            await dbService.updateStudentDetails(studentId, user.id, editedDetails);
            await loadProfile();
            setIsEditing(false);
            alert(t.messages.success.student_updated);
        } catch (error) {
            console.error('Error updating student details:', error);
            alert(t.messages.error.update_failed);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-slate-500">{t.messages.info.loading}</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-12 text-center text-red-500">
                <p>Student not found</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    const { user: student, details, quizHistory, stats } = profile;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
                </div>

                {/* Student Overview Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                            {student.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900">{student.full_name}</h2>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail size={16} />
                                    <span className="text-sm">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <User size={16} />
                                    <span className="text-sm">{student.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileText size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalInvited}</p>
                                <p className="text-xs text-slate-500">Quizzes Invited</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Award size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalCompleted}</p>
                                <p className="text-xs text-slate-500">Completed</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <TrendingUp size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.averageScore}%</p>
                                <p className="text-xs text-slate-500">Avg. Score</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Users size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.completionRate}%</p>
                                <p className="text-xs text-slate-500">Completion Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Edit2 size={14} /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveDetails}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    <Save size={14} /> Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedDetails(details || {});
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                                >
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editedDetails.phone || ''}
                                    onChange={(e) => setEditedDetails({ ...editedDetails, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Student phone number"
                                />
                            ) : (
                                <p className="text-slate-900">{details?.phone || 'Not provided'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.address || ''}
                                    onChange={(e) => setEditedDetails({ ...editedDetails, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Student address"
                                />
                            ) : (
                                <p className="text-slate-900">{details?.address || 'Not provided'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedDetails.parent_name || ''}
                                    onChange={(e) => setEditedDetails({ ...editedDetails, parent_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Parent/Guardian name"
                                />
                            ) : (
                                <p className="text-slate-900">{details?.parent_name || 'Not provided'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editedDetails.parent_email || ''}
                                    onChange={(e) => setEditedDetails({ ...editedDetails, parent_email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Parent/Guardian email"
                                />
                            ) : (
                                <p className="text-slate-900">{details?.parent_email || 'Not provided'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editedDetails.parent_phone || ''}
                                    onChange={(e) => setEditedDetails({ ...editedDetails, parent_phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Parent/Guardian phone"
                                />
                            ) : (
                                <p className="text-slate-900">{details?.parent_phone || 'Not provided'}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teacher Notes</label>
                            {isEditing ? (
                                <textarea
                                    value={editedDetails.notes || ''}
                                    onChange={(e) => setEditedDetails({ ...editedDetails, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    rows={3}
                                    placeholder="Add notes about this student..."
                                />
                            ) : (
                                <p className="text-slate-900 whitespace-pre-wrap">{details?.notes || 'No notes'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quiz History */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-900">Quiz History</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Quiz Title</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Invited</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quizHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No quiz history available
                                    </td>
                                </tr>
                            ) : (
                                quizHistory.map((item) => (
                                    <tr key={item.quiz_id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.quiz_title}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(item.invited_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status === 'PENDING' ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                    Pending
                                                </span>
                                            ) : item.status === 'COMPLETED' ? (
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                    Graded
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status === 'GRADED' && item.score !== undefined && item.max_score ? (
                                                <div className="flex items-center gap-3">
                                                    <CircleProgress percentage={(item.score / item.max_score) * 100} />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {item.score}/{item.max_score}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
