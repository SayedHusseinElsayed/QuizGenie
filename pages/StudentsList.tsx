import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { dbService } from '../services/dbService';
import { Submission, Quiz } from '../types';
import { Users, Search, TrendingUp, TrendingDown, Mail, FileText, Award, ArrowRight, UserPlus, X } from 'lucide-react';

interface StudentData {
    id: string;
    name: string;
    email: string;
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    lastActivity: Date;
    isPending?: boolean;
}

const StudentsList = () => {
    const { t, user } = useApp();
    const navigate = useNavigate();
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'score' | 'activity'>('name');

    // Add Student Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentMobile, setNewStudentMobile] = useState('');
    const [newStudentParentName, setNewStudentParentName] = useState('');
    const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
    const [newStudentAddress, setNewStudentAddress] = useState('');
    const [newStudentNotes, setNewStudentNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleAddStudent = async () => {
        // Validate form
        setFormError('');

        if (!newStudentEmail.trim() || !newStudentName.trim()) {
            setFormError(t.messages.error.fill_all_fields);
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newStudentEmail)) {
            setFormError(t.messages.error.invalid_email_address);
            return;
        }

        // Check if student already exists
        if (students.some(s => s.email.toLowerCase() === newStudentEmail.toLowerCase())) {
            setFormError(t.messages.error.student_exists);
            return;
        }

        setIsSubmitting(true);

        try {
            const newStudent: StudentData = {
                id: `pending-${Date.now()}`,
                name: newStudentName.trim(),
                email: newStudentEmail.trim().toLowerCase(),
                totalQuizzes: 0,
                completedQuizzes: 0,
                averageScore: 0,
                lastActivity: new Date(),
                isPending: true
            };

            // Add to students list
            setStudents(prev => [...prev, newStudent]);

            // Store in localStorage for persistence
            const pendingStudents = JSON.parse(localStorage.getItem('pending_students') || '[]');
            pendingStudents.push({
                email: newStudent.email,
                name: newStudent.name,
                mobile_number: newStudentMobile.trim(),
                parent_name: newStudentParentName.trim(),
                parent_phone: newStudentParentPhone.trim(),
                address: newStudentAddress.trim(),
                notes: newStudentNotes.trim(),
                addedAt: new Date().toISOString(),
                teacherId: user?.id
            });
            localStorage.setItem('pending_students', JSON.stringify(pendingStudents));

            // Reset form and close modal
            setNewStudentEmail('');
            setNewStudentName('');
            setNewStudentMobile('');
            setNewStudentParentName('');
            setNewStudentParentPhone('');
            setNewStudentAddress('');
            setNewStudentNotes('');
            setShowAddModal(false);

            alert(t.messages.success.student_added);
        } catch (error) {
            console.error('Error adding student:', error);
            setFormError(t.messages.error.add_student_failed);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, [user]);

    const loadStudents = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Get all quizzes
            const quizzes = await dbService.getQuizzes();

            // Get all submissions from all quizzes
            const allSubmissions: Submission[] = [];
            for (const quiz of quizzes) {
                const subs = await dbService.getQuizSubmissions(quiz.id);
                allSubmissions.push(...subs);
            }

            // Group students by ID
            const studentMap = new Map<string, StudentData & { invitedQuizIds: Set<string>; completedQuizIds: Set<string> }>();

            // First, process all invitations to get total invited quizzes per student
            for (const quiz of quizzes) {
                if (quiz.invites && quiz.invites.length > 0) {
                    for (const invite of quiz.invites) {
                        const studentEmail = invite.email;

                        // Find student ID from submissions with this email
                        const studentSubmission = allSubmissions.find(s => s.student_email === studentEmail);
                        if (studentSubmission) {
                            const studentId = studentSubmission.student_id;
                            const studentName = studentSubmission.student_name || invite.name || 'Unknown Student';

                            if (!studentMap.has(studentId)) {
                                studentMap.set(studentId, {
                                    id: studentId,
                                    name: studentName,
                                    email: studentEmail || '',
                                    totalQuizzes: 0,
                                    completedQuizzes: 0,
                                    averageScore: 0,
                                    lastActivity: new Date(),
                                    invitedQuizIds: new Set<string>(),
                                    completedQuizIds: new Set<string>()
                                });
                            }

                            const student = studentMap.get(studentId)!;
                            student.invitedQuizIds.add(quiz.id);
                        }
                    }
                }
            }

            // Then, process submissions to track completed quizzes and activity
            for (const submission of allSubmissions) {
                const studentId = submission.student_id;
                const studentName = submission.student_name || 'Unknown Student';
                const studentEmail = submission.student_email || '';

                if (!studentMap.has(studentId)) {
                    studentMap.set(studentId, {
                        id: studentId,
                        name: studentName,
                        email: studentEmail,
                        totalQuizzes: 0,
                        completedQuizzes: 0,
                        averageScore: 0,
                        lastActivity: new Date(submission.submitted_at),
                        invitedQuizIds: new Set<string>(),
                        completedQuizIds: new Set<string>()
                    });
                }

                const student = studentMap.get(studentId)!;

                // Track completed quizzes (only count unique quiz IDs that are graded)
                if (submission.status === 'GRADED') {
                    student.completedQuizIds.add(submission.quiz_id);
                }

                // Update last activity
                const activityDate = new Date(submission.submitted_at);
                if (activityDate > student.lastActivity) {
                    student.lastActivity = activityDate;
                }
            }

            // Convert Sets to counts
            for (const [studentId, student] of studentMap.entries()) {
                student.totalQuizzes = student.invitedQuizIds.size;
                student.completedQuizzes = student.completedQuizIds.size;
            }

            // Calculate average scores (only count one submission per unique quiz)
            for (const [studentId, student] of studentMap.entries()) {
                // Get all graded submissions for this student
                const studentSubmissions = allSubmissions.filter(
                    s => s.student_id === studentId && s.status === 'GRADED'
                );

                // Group by quiz_id and keep only the latest submission per quiz
                const latestSubmissionPerQuiz = new Map<string, typeof studentSubmissions[0]>();
                for (const sub of studentSubmissions) {
                    const existing = latestSubmissionPerQuiz.get(sub.quiz_id);
                    if (!existing || new Date(sub.submitted_at) > new Date(existing.submitted_at)) {
                        latestSubmissionPerQuiz.set(sub.quiz_id, sub);
                    }
                }

                const uniqueSubmissions = Array.from(latestSubmissionPerQuiz.values());

                if (uniqueSubmissions.length > 0) {
                    const totalScore = uniqueSubmissions.reduce((sum, sub) => {
                        const quiz = quizzes.find(q => q.id === sub.quiz_id);
                        const maxScore = quiz?.questions.reduce((a, q) => a + q.points, 0) || 100;
                        const percentage = maxScore > 0 ? (sub.score / maxScore) * 100 : 0;
                        return sum + percentage;
                    }, 0);

                    student.averageScore = Math.round(totalScore / uniqueSubmissions.length);
                }
            }

            setStudents(Array.from(studentMap.values()));

            // Load pending students from localStorage
            const pendingStudents = JSON.parse(localStorage.getItem('pending_students') || '[]');
            const teacherPendingStudents = pendingStudents
                .filter((ps: any) => ps.teacherId === user?.id)
                .map((ps: any) => ({
                    id: `pending-${ps.email}`,
                    name: ps.name,
                    email: ps.email,
                    totalQuizzes: 0,
                    completedQuizzes: 0,
                    averageScore: 0,
                    lastActivity: new Date(ps.addedAt),
                    isPending: true
                }));

            // Merge with existing students (avoid duplicates)
            const allStudents: StudentData[] = Array.from(studentMap.values()).map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                totalQuizzes: s.totalQuizzes,
                completedQuizzes: s.completedQuizzes,
                averageScore: s.averageScore,
                lastActivity: s.lastActivity,
                isPending: s.isPending
            }));

            teacherPendingStudents.forEach((ps: StudentData) => {
                if (!allStudents.some(s => s.email.toLowerCase() === ps.email.toLowerCase())) {
                    allStudents.push(ps);
                }
            });

            setStudents(allStudents);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSortedStudents = useMemo(() => {
        let filtered = students.filter(student =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort students
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'score':
                    return b.averageScore - a.averageScore;
                case 'activity':
                    return b.lastActivity.getTime() - a.lastActivity.getTime();
                default:
                    return 0;
            }
        });

        return filtered;
    }, [students, searchQuery, sortBy]);

    const stats = useMemo(() => {
        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.completedQuizzes > 0).length;
        const avgScore = students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length)
            : 0;
        const totalCompletions = students.reduce((sum, s) => sum + s.completedQuizzes, 0);

        return { totalStudents, activeStudents, avgScore, totalCompletions };
    }, [students]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-slate-500">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 space-y-8 pt-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-primary-600" size={32} />
                        {t.students_list.title}
                    </h1>
                    <p className="text-slate-500 mt-2">{t.students_list.subtitle}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-600/20 transition-all"
                >
                    <UserPlus size={20} />
                    {t.students_list.add_student}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-500 bg-opacity-10 p-3 rounded-xl">
                            <Users size={24} className="text-blue-500" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">{stats.totalStudents}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Total Students</p>
                    <p className="text-xs text-slate-400 mt-2">{stats.activeStudents} active</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-green-500 bg-opacity-10 p-3 rounded-xl">
                            <Award size={24} className="text-green-500" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">{stats.avgScore}%</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Average Score</p>
                    <p className="text-xs text-slate-400 mt-2">across all students</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-500 bg-opacity-10 p-3 rounded-xl">
                            <FileText size={24} className="text-indigo-500" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">{stats.totalCompletions}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Total Completions</p>
                    <p className="text-xs text-slate-400 mt-2">quizzes completed</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-amber-500 bg-opacity-10 p-3 rounded-xl">
                            <TrendingUp size={24} className="text-amber-500" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">
                        {stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Engagement Rate</p>
                    <p className="text-xs text-slate-400 mt-2">students with completions</p>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder={t.students_list.search_placeholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-600">{t.students_list.sort_by}:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="name">{t.students_list.sort_name}</option>
                                <option value="score">{t.students_list.sort_score}</option>
                                <option value="activity">{t.students_list.sort_activity}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">{t.students_list.table_student}</th>
                                <th className="px-6 py-4">{t.students_list.table_email}</th>
                                <th className="px-6 py-4">{t.students_list.table_quizzes}</th>
                                <th className="px-6 py-4">{t.students_list.table_score}</th>
                                <th className="px-6 py-4">{t.students_list.table_activity}</th>
                                <th className="px-6 py-4 text-right">{t.students_list.table_actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAndSortedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Users size={48} className="mb-3 opacity-20" />
                                            <p className="font-medium">
                                                {searchQuery ? t.students_list.no_students_found : t.students_list.no_students_yet}
                                            </p>
                                            <p className="text-sm mt-1">
                                                {searchQuery ? t.students_list.try_different_search : t.students_list.students_will_appear}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/student/${student.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${student.isPending ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center text-white font-bold`}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900">{student.name}</p>
                                                        {student.isPending && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                                                {t.students_list.pending}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        {student.isPending ? t.students_list.not_registered : `ID: ${student.id.substring(0, 8)}...`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="text-sm">{student.email || 'No email'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {student.completedQuizzes}/{student.totalQuizzes}
                                                </span>
                                                <span className="text-xs text-slate-500">{t.students_list.completed_count}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${student.averageScore >= 80
                                                    ? 'bg-green-100 text-green-700'
                                                    : student.averageScore >= 60
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : student.averageScore >= 40
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {student.averageScore >= 60 ? (
                                                        <TrendingUp size={12} />
                                                    ) : (
                                                        <TrendingDown size={12} />
                                                    )}
                                                    {student.averageScore}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {student.lastActivity.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/student/${student.id}`);
                                                }}
                                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {t.students_list.view_profile}
                                                <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredAndSortedStudents.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            {t.students_list.showing_students} {filteredAndSortedStudents.length} {t.students_list.of_students} {students.length} {t.students_list.students}
                        </p>
                    </div>
                )}
            </div>


            {/* Add Student Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white p-6 border-b border-slate-200 rounded-t-2xl z-10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        <UserPlus size={24} className="text-primary-600" />
                                        {t.students_list.add_modal_title}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setNewStudentEmail('');
                                            setNewStudentName('');
                                            setFormError('');
                                        }}
                                        className="text-slate-400 hover:text-slate-600 transition"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Student Information Section */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Student Information</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    {t.students_list.full_name} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newStudentName}
                                                    onChange={(e) => setNewStudentName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    {t.students_list.student_email} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    value={newStudentEmail}
                                                    onChange={(e) => setNewStudentEmail(e.target.value)}
                                                    placeholder="student@example.com"
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Mobile Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={newStudentMobile}
                                                    onChange={(e) => setNewStudentMobile(e.target.value)}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent/Guardian Section */}
                                    <div className="border-t border-slate-200 pt-6">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Parent/Guardian Information</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Parent Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newStudentParentName}
                                                    onChange={(e) => setNewStudentParentName(e.target.value)}
                                                    placeholder="Jane Doe"
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Parent Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={newStudentParentPhone}
                                                    onChange={(e) => setNewStudentParentPhone(e.target.value)}
                                                    placeholder="+1 (555) 987-6543"
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information Section */}
                                    <div className="border-t border-slate-200 pt-6">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Additional Information</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Address
                                                </label>
                                                <textarea
                                                    value={newStudentAddress}
                                                    onChange={(e) => setNewStudentAddress(e.target.value)}
                                                    placeholder="123 Main St, City, State, ZIP"
                                                    rows={2}
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Notes
                                                </label>
                                                <textarea
                                                    value={newStudentNotes}
                                                    onChange={(e) => setNewStudentNotes(e.target.value)}
                                                    placeholder="Any additional notes about the student..."
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {formError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                            {formError}
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                                        <p className="font-semibold mb-1">{t.students_list.note}</p>
                                        <p>{t.students_list.pending_note}</p>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setNewStudentEmail('');
                                                setNewStudentName('');
                                                setNewStudentMobile('');
                                                setNewStudentParentName('');
                                                setNewStudentParentPhone('');
                                                setNewStudentAddress('');
                                                setNewStudentNotes('');
                                                setFormError('');
                                            }}
                                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                                            disabled={isSubmitting}
                                        >
                                            {t.common.cancel}
                                        </button>
                                        <button
                                            onClick={handleAddStudent}
                                            disabled={isSubmitting}
                                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? t.students_list.adding : t.students_list.add_student}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default StudentsList;
