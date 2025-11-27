import React, { useState } from 'react';
import { useApp } from '../App';
import { Mail, FileText, Paperclip, Send, CheckCircle, AlertCircle } from 'lucide-react';

const Support = () => {
    const { user, t } = useApp();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!subject || !description || !email) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        // Simulate API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In a real app, we would send this data to a backend
            console.log('Support Inquiry:', {
                to: 'sayed.hussein.elsayed@gmail.com',
                from: email,
                subject,
                description,
                attachment: attachment ? attachment.name : 'None'
            });

            setIsSuccess(true);
            setSubject('');
            setDescription('');
            setAttachment(null);
        } catch (err) {
            setError('Failed to send inquiry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Inquiry Sent Successfully!</h2>
                <p className="text-slate-600 mb-8">
                    Thank you for contacting support. We have received your message and will get back to you at <strong>{email}</strong> shortly.
                </p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Mail className="text-primary-600" size={28} />
                        Contact Support
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Have an issue or suggestion? Fill out the form below and our team will assist you.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Issue with Quiz Generation"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Your Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            placeholder="Please describe your issue in detail..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Attachment <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:border-primary-500 hover:bg-slate-50 cursor-pointer transition text-slate-600"
                            >
                                <Paperclip size={20} className="text-slate-400" />
                                {attachment ? (
                                    <span className="text-primary-600 font-medium">{attachment.name}</span>
                                ) : (
                                    <span>Click to attach a file (Image, PDF)</span>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>Sending...</>
                            ) : (
                                <>
                                    Send Inquiry <Send size={18} />
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-4">
                            This inquiry will be sent directly to our support team at sayed.hussein.elsayed@gmail.com
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Support;
