import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { adminService, PlatformStatistics, UserWithStats } from '../services/adminService';
import { UserRole } from '../types';
import {
    Users, FileText, Send, TrendingUp, Shield, Search,
    Ban, CheckCircle, X, AlertTriangle, Calendar, Mail,
    Award, Activity
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useApp();
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
    const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

    // Suspension modal
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [isSuspending, setIsSuspending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, filterRole, filterStatus, allUsers]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [stats, users] = await Promise.all([
                adminService.getStatistics(),
                adminService.getAllUsers()
            ]);

            setStatistics(stats);
            setAllUsers(users);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...allUsers];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(u =>
                u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Role filter
        if (filterRole !== 'ALL') {
            filtered = filtered.filter(u => u.role === filterRole);
        }

        // Status filter
        if (filterStatus === 'ACTIVE') {
            filtered = filtered.filter(u => !u.is_suspended);
        } else if (filterStatus === 'SUSPENDED') {
            filtered = filtered.filter(u => u.is_suspended);
        }

        setFilteredUsers(filtered);
    };

    const handleSuspendClick = (user: UserWithStats) => {
        setSelectedUser(user);
        setSuspensionReason('');
        setShowSuspendModal(true);
    };

    const handleSuspendConfirm = async () => {
        if (!selectedUser || !user) return;

        if (!suspensionReason.trim()) {
            alert('Please provide a reason for suspension');
            return;
        }

        setIsSuspending(true);
        try {
            await adminService.suspendUser(selectedUser.id, suspensionReason, user.id);
            alert('User suspended successfully');
            setShowSuspendModal(false);
            loadData(); // Reload data
        } catch (error: any) {
            alert(error.message || 'Failed to suspend user');
        } finally {
            setIsSuspending(false);
        }
    };

    const handleUnsuspend = async (userId: string) => {
        if (!window.confirm('Are you sure you want to unsuspend this user?')) return;

        try {
            await adminService.unsuspendUser(userId);
            alert('User unsuspended successfully');
            loadData(); // Reload data
        } catch (error: any) {
            alert(error.message || 'Failed to unsuspend user');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'OWNER': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'TEACHER': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'STUDENT': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPlanBadgeColor = (plan?: string) => {
        switch (plan) {
            case 'pro': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'school': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 pb-20">
            {/* Header */}
            <div className="mb-8 pt-6">
                <div className="flex items-center gap-3 mb-2">
                    <Shield size={32} className="text-purple-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                </div>
                <p className="text-slate-600">Platform management and user oversight</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics?.totalUsers || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">
                        {statistics?.totalTeachers || 0} Teachers • {statistics?.totalStudents || 0} Students
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText size={24} className="text-green-600" />
                        </div>
                        <Activity size={20} className="text-green-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Quizzes</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics?.totalQuizzes || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Created by teachers</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Send size={24} className="text-purple-600" />
                        </div>
                        <Award size={20} className="text-purple-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Submissions</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics?.totalSubmissions || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Total quiz attempts</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Activity size={24} className="text-amber-600" />
                        </div>
                        <CheckCircle size={20} className="text-green-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Active Users</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics?.activeUsers || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">Last 7 days</p>
                </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users size={20} className="text-primary-600" />
                        User Management
                    </h2>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="OWNER">Owner</option>
                            <option value="TEACHER">Teachers</option>
                            <option value="STUDENT">Students</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Quizzes</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-900">{u.full_name}</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    <Mail size={12} />
                                                    {u.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(u.role)}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPlanBadgeColor(u.subscription_tier)}`}>
                                                {u.subscription_tier || 'free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-700 font-medium">{u.quiz_count || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.is_suspended ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                                                    <Ban size={12} />
                                                    Suspended
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
                                                    <CheckCircle size={12} />
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {u.role !== 'OWNER' && (
                                                u.is_suspended ? (
                                                    <button
                                                        onClick={() => handleUnsuspend(u.id)}
                                                        className="text-green-600 hover:text-green-800 font-semibold text-sm"
                                                    >
                                                        Unsuspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSuspendClick(u)}
                                                        className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                                    >
                                                        Suspend
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Results Count */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{allUsers.length}</strong> users
                    </p>
                </div>
            </div>

            {/* Suspension Modal */}
            {showSuspendModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="text-red-600" size={24} />
                                Suspend User Account
                            </h3>
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-800 font-semibold mb-1">Warning</p>
                                <p className="text-sm text-red-700">
                                    This user will be immediately logged out and unable to access their account.
                                </p>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-semibold text-slate-700 mb-1">User:</p>
                                <p className="text-slate-900">{selectedUser.full_name}</p>
                                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Reason for Suspension <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={suspensionReason}
                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                    placeholder="Enter the reason for suspending this account..."
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                                disabled={isSuspending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspendConfirm}
                                disabled={isSuspending}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {isSuspending ? 'Suspending...' : 'Suspend Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
