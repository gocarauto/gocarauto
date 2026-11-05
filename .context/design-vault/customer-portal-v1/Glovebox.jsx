import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import {
    FolderLock,
    UploadCloud,
    FileText,
    Image as ImageIcon,
    Download,
    Trash2,
    ShieldCheck,
    FileCheck,
    AlertCircle,
    Eye,
    FileUp
} from 'lucide-react';

const Glovebox = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState('Registration');
    const [selectedFile, setSelectedFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/customer-documents');
            setDocuments(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setErrorMsg(isAr ? 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)' : 'File size exceeds 10MB limit');
            setSelectedFile(null);
            return;
        }

        setErrorMsg('');
        setSelectedFile(file);
        if (!title) {
            const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            setTitle(cleanName);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMsg(isAr ? 'يرجى اختيار ملف للرفع' : 'Please select a file to upload');
            return;
        }

        setUploading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', title);
            formData.append('documentType', documentType);

            await api.post('/customer-documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setTitle('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setSuccessMsg(isAr ? 'تم حفظ المستند بنجاح في خزنتك الرقمية' : 'Document stored securely in your vault');
            setTimeout(() => setSuccessMsg(''), 4000);
            await fetchDocuments();
        } catch (err) {
            console.error('Upload failed', err);
            setErrorMsg(err.response?.data?.error || (isAr ? 'فشل رفع المستند' : 'Failed to upload document'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا المستند نهائياً؟' : 'Are you sure you want to permanently delete this document?')) return;
        try {
            await api.delete(`/customer-documents/${id}`);
            await fetchDocuments();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const resolveFileUrl = (url) => {
        if (!url) return '';
        const token = localStorage.getItem('token');
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
        const target = url.startsWith('http') ? url : `${baseUrl}${url}`;
        if (token && token !== 'undefined' && token !== 'null') {
            const sep = target.includes('?') ? '&' : '?';
            return `${target}${sep}token=${encodeURIComponent(token)}`;
        }
        return target;
    };

    const openDocument = (url) => {
        const fullUrl = resolveFileUrl(url);
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>)}
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 max-w-6xl">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">
                        {isAr ? 'الدرج الرقمي (الخزنة)' : 'Digital Glovebox'}
                    </h2>
                    <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16} className="text-green-500" />
                        {isAr ? 'خزنة مستندات آمنة ومشفرة' : 'SECURE DOCUMENT VAULT'}
                    </p>
                </div>
            </header>

            {/* Upload Box */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-2xl">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                {isAr ? 'عنوان المستند' : 'Document Title'}
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={isAr ? 'مثال: رخصة القيادة ٢٠٢٦' : 'e.g. BMW Insurance 2026'}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-black dark:text-white transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                {isAr ? 'نوع المستند' : 'Document Type'}
                            </label>
                            <select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-black dark:text-white transition-all font-medium"
                            >
                                <option value="Registration">{isAr ? 'رخصة السيارة (Vehicle Registration)' : 'Vehicle Registration'}</option>
                                <option value="Insurance">{isAr ? 'وثيقة التأمين (Insurance Policy)' : 'Insurance Policy'}</option>
                                <option value="ID">{isAr ? 'رخصة القيادة / البطاقة (Driver ID)' : "Driver's License / ID"}</option>
                                <option value="Maintenance">{isAr ? 'تقرير صيانة (Service Report)' : 'Maintenance Record'}</option>
                                <option value="Other">{isAr ? 'أخرى (Other)' : 'Other'}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                {isAr ? 'الملف (PDF أو صورة)' : 'File (PDF, PNG, JPG)'}
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl py-3 px-5 bg-gray-50/50 dark:bg-white/5 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileUp size={20} className="text-primary shrink-0" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate font-semibold">
                                        {selectedFile ? selectedFile.name : (isAr ? 'اضغط لاختيار ملف...' : 'Choose file...')}
                                    </span>
                                </div>
                                {selectedFile && (
                                    <span className="text-[10px] text-gray-400 shrink-0 font-bold ml-2">
                                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                                    </span>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/20">
                            <FileCheck size={16} /> {successMsg}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="h-14 px-10 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all shrink-0 shadow-lg disabled:opacity-50"
                        >
                            <UploadCloud size={18} /> {uploading ? (isAr ? 'جاري التشفير والحفظ...' : 'STORING...') : (isAr ? 'تأمين في الخزنة' : 'SECURE VAULT')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {documents.map((doc, i) => {
                    const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf') || doc.document_type === 'Registration' || doc.document_type === 'Insurance';
                    return (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white dark:bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 group relative overflow-hidden shadow-xl hover:border-primary/30 transition-all"
                        >
                            <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openDocument(doc.file_url)}
                                    title={isAr ? 'معاينة / فتح' : 'View'}
                                    className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={() => openDocument(doc.file_url)}
                                    title={isAr ? 'تحميل' : 'Download'}
                                    className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-blue-500 hover:bg-blue-500/20 transition-colors"
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    title={isAr ? 'حذف' : 'Delete'}
                                    className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6">
                                {isPdf ? <FileText className="text-primary" size={26} /> : <ImageIcon className="text-primary" size={26} />}
                            </div>

                            <h3 className="text-lg font-black text-black dark:text-white tracking-tight leading-tight line-clamp-1">{doc.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-full">
                                    {doc.document_type}
                                </span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-50 dark:border-white/5">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck size={12} className="text-green-500" />
                                    {isAr ? 'مؤمن بتاريخ: ' : 'SECURED: '} {formatDate(doc.uploaded_at)}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}

                {documents.length === 0 && (
                    <div className="col-span-full p-20 text-center bg-white dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-gray-300 dark:text-gray-600">
                            <FolderLock size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">
                            {isAr ? 'الخزنة الرقمية فارغة' : 'Vault is Empty'}
                        </h3>
                        <p className="text-gray-400 max-w-sm mx-auto text-sm">
                            {isAr
                                ? 'احتفظ برخصة السيارة، وثيقة التأمين، وسجلات الفحص بأمان وسهولة في درجك الرقمي المشفر.'
                                : 'Store your vehicle registration, insurance, and critical documents securely in your digital glovebox.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Glovebox;
