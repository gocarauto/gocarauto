import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
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
    FileUp,
    Plus,
    X,
    Loader2
} from 'lucide-react';

const Glovebox = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const [documents, setDocuments] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_glovebox_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(() => {
        try {
            return !sessionStorage.getItem('gocar_glovebox_cache');
        } catch {
            return true;
        }
    });

    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState('Registration');
    const [selectedFile, setSelectedFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showUploadModal && !uploading) setShowUploadModal(false);
                if (docToDelete && !deleting) setDocToDelete(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showUploadModal, uploading, docToDelete, deleting]);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/customer-documents');
            const docs = response.data?.data || [];
            setDocuments(docs);
            try {
                sessionStorage.setItem('gocar_glovebox_cache', JSON.stringify(docs));
            } catch {
                // ignore quota
            }
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
            setShowUploadModal(false);
            await fetchDocuments();
        } catch (err) {
            console.error('Upload failed', err);
            setErrorMsg(err.response?.data?.error || (isAr ? 'فشل رفع المستند' : 'Failed to upload document'));
        } finally {
            setUploading(false);
        }
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/customer-documents/${docToDelete.id}`);
            setDocToDelete(null);
            await fetchDocuments();
        } catch (err) {
            console.error('Delete failed', err);
            setErrorMsg(isAr ? 'فشل حذف المستند' : 'Failed to delete document');
        } finally {
            setDeleting(false);
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

    const getDocTypeBadge = (type) => {
        switch (type) {
            case 'Registration':
                return { label: isAr ? 'رخصة تسيير' : 'Registration', cls: 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20' };
            case 'Insurance':
                return { label: isAr ? 'وثيقة تأمين' : 'Insurance', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
            case 'ID':
                return { label: isAr ? 'هوية / رخصة قيادة' : 'Driver ID', cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
            case 'Maintenance':
                return { label: isAr ? 'تقرير صيانة' : 'Inspection', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
            default:
                return { label: isAr ? 'مستند رسمي' : 'Document', cls: 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/[0.08]' };
        }
    };

    return (
        <div className="space-y-6 pb-16 max-w-5xl">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                        {isAr ? 'الدرج الرقمي (خزنة المستندات)' : 'Digital Glovebox'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>{isAr ? 'حفظ رخص وسجلات المركبات مشفرة سحابياً' : 'Encrypted cloud vault for vehicle licenses, insurance, and records'}</span>
                    </p>
                </div>

                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
                >
                    <Plus size={16} />
                    <span>{isAr ? 'رفع مستند جديد' : 'Upload Document'}</span>
                </button>
            </header>

            {/* Notifications */}
            {successMsg && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                    <FileCheck size={16} />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Documents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, i) => {
                    const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf') || doc.document_type === 'Registration' || doc.document_type === 'Insurance';
                    const badge = getDocTypeBadge(doc.document_type);

                    return (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, delay: i * 0.04 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                        {isPdf ? <FileText size={20} className="text-amber-500" /> : <ImageIcon size={20} className="text-sky-500" />}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.cls}`}>
                                        {badge.label}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white truncate" title={doc.title}>
                                        {doc.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {formatDate(doc.uploaded_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions toolbar */}
                            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openDocument(doc.file_url)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                        title={isAr ? 'معاينة المستند' : 'Preview Document'}
                                    >
                                        <Eye size={15} />
                                    </button>
                                    <button
                                        onClick={() => openDocument(doc.file_url)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                        title={isAr ? 'تحميل المستند' : 'Download Document'}
                                    >
                                        <Download size={15} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setDocToDelete(doc)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title={isAr ? 'حذف من الخزنة' : 'Delete Document'}
                                    aria-label={isAr ? `حذف ${doc.title}` : `Delete ${doc.title}`}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}

                {loading && documents.length === 0 ? (
                    <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-44 bg-slate-200 dark:bg-white/[0.04] rounded-3xl" />
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="col-span-full py-16 px-6 text-center bg-white dark:bg-[#0c0d12] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-3">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                            <FolderLock size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-950 dark:text-white">
                            {isAr ? 'خزنتك الرقمية فارغة' : 'Vault is Empty'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            {isAr
                                ? 'احتفظ برخص المركبات، وثائق التأمين، وسجلات الفحص في درجك الرقمي لسرعة الوصول إليها أثناء الصيانة.'
                                : 'Store your vehicle registration cards, insurance policies, and inspection reports in your secure vault.'}
                        </p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
                        >
                            <Plus size={15} />
                            <span>{isAr ? 'إضافة أول مستند' : 'Upload First Document'}</span>
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div
                    onClick={(e) => e.target === e.currentTarget && !uploading && setShowUploadModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                            <h3 className="text-base font-bold text-slate-950 dark:text-white">
                                {isAr ? 'رفع وتأمين مستند جديد' : 'Upload Document to Vault'}
                            </h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4 text-xs">
                            <div>
                                <label htmlFor="vault-doc-title" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    {isAr ? 'عنوان المستند' : 'Document Title'}
                                </label>
                                <input
                                    id="vault-doc-title"
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={isAr ? 'مثال: رخصة قيادة ٢٠٢٦' : 'e.g. BMW Registration 2026'}
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>

                            <div>
                                <label htmlFor="vault-doc-category" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    {isAr ? 'تصنيف المستند' : 'Document Category'}
                                </label>
                                <select
                                    id="vault-doc-category"
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                >
                                    <option value="Registration">{isAr ? 'رخصة تسيير المركبة' : 'Vehicle Registration'}</option>
                                    <option value="Insurance">{isAr ? 'وثيقة التأمين' : 'Insurance Policy'}</option>
                                    <option value="ID">{isAr ? 'رخصة القيادة / بطاقة الهوية' : "Driver's License / ID"}</option>
                                    <option value="Maintenance">{isAr ? 'تقرير صيانة وفحص' : 'Maintenance Record'}</option>
                                    <option value="Other">{isAr ? 'مستندات أخرى' : 'Other'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    {isAr ? 'الملف (PDF أو صورة، بحد أقصى ١٠ ميجابايت)' : 'File (PDF, PNG, JPG - max 10MB)'}
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-400 rounded-xl py-3 px-4 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileUp size={18} className="text-amber-500 shrink-0" />
                                        <span className="text-slate-600 dark:text-slate-300 truncate font-medium">
                                            {selectedFile ? selectedFile.name : (isAr ? 'اضغط لاختيار ملف...' : 'Choose file...')}
                                        </span>
                                    </div>
                                    {selectedFile && (
                                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
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

                            {errorMsg && (
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                                    <AlertCircle size={15} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                    className="py-2 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="py-2 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>{isAr ? 'جاري الرفع...' : 'Uploading...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud size={15} />
                                            <span>{isAr ? 'حفظ في الخزنة' : 'Save to Vault'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {docToDelete && (
                <div
                    onClick={(e) => e.target === e.currentTarget && !deleting && setDocToDelete(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full max-w-md bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                                    {isAr ? 'تأكيد حذف المستند' : 'Confirm Document Deletion'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isAr ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه.' : 'This action cannot be undone.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl text-xs space-y-1">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {docToDelete.title}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                                {docToDelete.document_type || 'Document'} • {formatDate(docToDelete.created_at, lang)}
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => setDocToDelete(null)}
                                disabled={deleting}
                                className="py-2 px-4 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>{isAr ? 'جاري الحذف...' : 'Deleting...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        <span>{isAr ? 'حذف نهائياً' : 'Delete Permanently'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default Glovebox;
