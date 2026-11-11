import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
    Bot,
    Send,
    AlertCircle,
    Wrench,
    CheckCircle,
    ArrowRight,
    Sparkles,
    ShieldAlert,
    Gauge,
    Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';

const KNOWLEDGE_BASE = [
    {
        keywords: ['فرامل', 'تيل', 'طنابير', 'صفار', 'صفارة', 'brake', 'pad', 'rotor', 'squeak', 'stopping'],
        severity: 'critical',
        en: {
            reply: 'Squeaking, grinding, or soft brake pedal usually indicates worn brake pads or warped rotors. Driving with severely worn pads can score the brake discs, damage the calipers, and significantly increase stopping distance.',
            action: 'Brake System Inspection & Pad/Rotor Replacement',
            urgency: 'High Priority (Safety Critical)'
        },
        ar: {
            reply: 'صوت صفارة أو احتكاك عند الضغط على الفرامل يشير غالباً لتآكل تيل الفرامل أو حاجة الطنابير للمسح أو التغيير. إهمال التيل يؤدي لتلف الطنابير والماستر وزيادة مسافة التوقف مما يهدد أمان السيارة.',
            action: 'فحص وتغيير تيل وطنابير الفرامل',
            urgency: 'أولوية قصوى (مرتبط بالأمان والسلامة)'
        }
    },
    {
        keywords: ['عفشة', 'مساعد', 'مساعدين', 'مقص', 'مقصات', 'مطبات', 'خبط', 'suspension', 'strut', 'shock', 'bump', 'clunk'],
        severity: 'medium',
        en: {
            reply: 'Knocking or clunking sounds over road imperfections typically stem from worn suspension components such as shock absorbers, control arm bushings, or stabilizer end-links.',
            action: 'Underbody & Suspension Multi-Point Inspection',
            urgency: 'Medium Priority'
        },
        ar: {
            reply: 'أصوات التخبيط أو القرقرة مع المطبات والمدقات تدل على مشكلة في العفشة: كبوش أو جلب المقصات، أو تلف المساعدين أو بيض الطرف ومسامير الميزان.',
            action: 'فحص شامل للعفشة ونظام التعليق',
            urgency: 'أولوية متوسطة'
        }
    },
    {
        keywords: ['حرارة', 'سخونة', 'ردياتير', 'قربة', 'مروحة', 'مياه', 'overheat', 'temp', 'radiator', 'coolant', 'boil'],
        severity: 'critical',
        en: {
            reply: 'Elevated engine temperatures or dropping coolant levels pose an immediate danger of blowing the head gasket or warping cylinder heads. Avoid driving until coolant leaks and fan actuation are diagnosed.',
            action: 'Cooling System Pressure Test & Thermostat Check',
            urgency: 'Immediate Attention Required'
        },
        ar: {
            reply: 'ارتفاع مؤشر الحرارة أو نقص مياه الردياتير خطر داهم قد يؤدي لتلف جوان وش السلندر أو اعوجاج رأس المحرك. يُرجى التوقف فوراً وفحص دورة التبريد والمروحة وطلمبة المياه.',
            action: 'اختبار ضغط دورة التبريد وفحص الردياتير والثرموستات',
            urgency: 'خطر فوري - يستدعي التوقف'
        }
    },
    {
        keywords: ['فتيس', 'نقلات', 'نتعة', 'ترزيع', 'زيت فتيس', 'gearbox', 'transmission', 'jerk', 'shifting', 'clutch'],
        severity: 'high',
        en: {
            reply: 'Delayed shifting, hard jerks between gears, or transmission slippage usually indicate degraded transmission fluid, a failing solenoid body, or clutch plate wear.',
            action: 'Transmission Diagnostic & Fluid Service',
            urgency: 'High Priority'
        },
        ar: {
            reply: 'تأخر النقلات أو وجود نتعة وترزيع في الفتيس يشير إلى انخفاض جودة أو مستوى زيت الفتيس، أو خلل في بلف الفتيس (عقل الفتيس / Solenoids) أو حساسات السرعة.',
            action: 'كشف كمبيوتر على الفتيس وفحص/تغيير زيت الفلتر',
            urgency: 'أولوية عالية'
        }
    },
    {
        keywords: ['رعشة', 'غربلة', 'دركسيون', 'ترصيص', 'زوايا', 'vibrat', 'shake', 'steering', 'alignment', 'wobble'],
        severity: 'medium',
        en: {
            reply: 'Steering wheel shake or chassis vibration at speeds above 80-100 km/h is commonly caused by out-of-balance wheels or uneven tire wear. Pulling to one side requires laser alignment.',
            action: 'Dynamic Wheel Balancing & 4-Wheel Laser Alignment',
            urgency: 'Medium Priority'
        },
        ar: {
            reply: 'الرعشة أو الغربلة في الدركسيون على سرعات أعلى من ٨٠ كم/ساعة سببها الأساسي عدم اتزان الإطارات (تحتاج ترصيص). أما انحراف السيارة جانباً فيحتاج ضبط زوايا كمبيوتر.',
            action: 'ترصيص ديناميكي للإطارات وضبط زوايا ليزر',
            urgency: 'أولوية متوسطة'
        }
    },
    {
        keywords: ['تكييف', 'سقعة', 'فريون', 'كمبروسر', 'تلاجة', 'ac', 'air condition', 'cooling', 'blows warm', 'compressor'],
        severity: 'low',
        en: {
            reply: 'Warm air coming from vents or weak cooling suggests a slow refrigerant leak, clogged cabin air filter, or failing compressor magnetic clutch.',
            action: 'A/C Evacuation, Leak Detection & Refrigerant Recharge',
            urgency: 'Comfort Priority'
        },
        ar: {
            reply: 'خروج هواء دافئ من فتحات التكييف أو ضعف التبريد ينتج عن تسريب في غاز الفريون، أو انسداد فلتر التكييف الداخلي، أو ضعف ضاغط التكييف (الكومبروسر).',
            action: 'كشف تسريب الفريون وشحن تكييف وتغيير الفلتر',
            urgency: 'أولوية راحة'
        }
    },
    {
        keywords: ['بطارية', 'دينامو', 'مارش', 'تدوير', 'مش بتدور', 'battery', 'starter', 'alternator', 'crank', 'dead'],
        severity: 'high',
        en: {
            reply: 'Clicking upon turning the key or sluggish engine crank points to a drained battery, corroded terminals, or an undercharging alternator not supplying 13.8V - 14.4V.',
            action: 'Battery State-of-Health & Alternator Charging Test',
            urgency: 'High Priority'
        },
        ar: {
            reply: 'صعوبة تدوير المحرك أو صوت طقطقة من المارش يدل على ضعف شحن البطارية أو انتهاء عمرها الافتراضي، أو عدم شحن الدينامو بشكل كافٍ.',
            action: 'فحص جهد البطارية واختبار كفاءة الدينامو والمارش',
            urgency: 'أولوية عالية'
        }
    },
    {
        keywords: ['زيت', 'موتور', 'محرك', 'صوت عالي', 'تكتكة', 'oil', 'engine', 'smoke', 'ticking', 'check engine'],
        severity: 'high',
        en: {
            reply: 'Low engine oil or an illuminated check engine lamp warrants an OBD2 diagnostic scan. Running low on lubricant risks rapid friction wear on pistons, cams, and crankshaft bearings.',
            action: 'Engine OBD-II Diagnostic Scan & Synthetic Oil Service',
            urgency: 'High Priority'
        },
        ar: {
            reply: 'إضاءة لمبة فحص المحرك (Check Engine) أو نقص زيت الموتور يستدعي فحص الكمبيوتر لقراءة كود العطل فوراً لتجنب إجهاد أجزاء المحرك الداخلية وعمود الكامات.',
            action: 'فحص أعطال المحرك بالكمبيوتر وتغيير الزيت والفلتر',
            urgency: 'أولوية عالية'
        }
    }
];

const QUICK_PROMPTS = [
    { ar: 'صفارة أو احتكاك في الفرامل', en: 'Squeaking brake noise' },
    { ar: 'خبط مع المطبات في العفشة', en: 'Knocking over road bumps' },
    { ar: 'حرارة المحرك بترتفع', en: 'Engine temperature is rising' },
    { ar: 'رعشة في الدركسيون فوق 90', en: 'Steering shakes over 90 km/h' },
    { ar: 'نتعة في نقلات الفتيس', en: 'Jerky transmission shifts' },
    { ar: 'التكييف مش بيسقع', en: 'A/C is blowing warm air' }
];

const AIAdvisor = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const msgIdRef = useRef(1);

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: isAr
                ? 'أهلاً بك! أنا مستشارك الذكي لصيانة GoCar Auto. صف لي أي صوت غير طبيعي، أو عطل، أو استفسر عن صيانة دورية وسأقوم بتشخيص الحالة فوراً مع توصية عملية بالحل.'
                : 'Hello! I am your GoCar Auto AI Service Advisor. Describe any unusual symptoms, noises, or maintenance questions, and I will diagnose it for you with expert recommendations.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const performDiagnosis = (text) => {
        const lower = text.toLowerCase();
        let matched = null;

        for (const item of KNOWLEDGE_BASE) {
            if (item.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
                matched = item;
                break;
            }
        }

        if (matched) {
            const localeData = isAr ? matched.ar : matched.en;
            return {
                text: localeData.reply,
                recommendation: localeData.action,
                urgency: localeData.urgency,
                severity: matched.severity
            };
        }

        return {
            text: isAr
                ? 'بناءً على وصفك، نوصي بحجز فحص شامل في مركز GoCar Auto ليقوم مهندسونا بفحص السيارة بدقة بأحدث أجهزة التشخيص.'
                : 'Based on your description, we recommend scheduling a comprehensive multi-point inspection at GoCar Auto so our master technicians can diagnose it with dedicated scan tools.',
            recommendation: isAr ? 'فحص شامل بالكمبيوتر ومعاينة فنية' : 'Multi-Point Inspection & Diagnostic Scan',
            urgency: isAr ? 'فحص موصى به' : 'Recommended Inspection',
            severity: 'medium'
        };
    };

    const handleSend = (textToSend) => {
        const query = typeof textToSend === 'string' ? textToSend : input;
        if (!query.trim()) return;

        const userMsg = { id: ++msgIdRef.current, sender: 'user', text: query.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const diagnosis = performDiagnosis(query);
            const aiMsg = {
                id: ++msgIdRef.current,
                sender: 'ai',
                ...diagnosis
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 800);
    };

    return (
        <div className="space-y-6 pb-16 max-w-4xl mx-auto h-[82vh] flex flex-col">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#fbbf24] flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
                            <Bot size={22} />
                        </div>
                        {isAr ? 'المستشار الفني الذكي' : 'AI Service Advisor'}
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-[#fbbf24]" />
                        {isAr ? 'تشخيص ذكي للأعطال والأصوات غير الطبيعية' : 'Instant Symptom Analysis & Technical Diagnosis'}
                    </p>
                </div>
            </header>

            {/* Quick Prompts Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSend(isAr ? qp.ar : qp.en)}
                        className="px-4 py-2 bg-white dark:bg-[#0a0a0a] hover:bg-[#fbbf24] dark:hover:bg-[#fbbf24] hover:text-black dark:hover:text-black text-gray-700 dark:text-gray-300 rounded-full border border-gray-100 dark:border-white/5 text-xs font-bold whitespace-nowrap transition-all shadow-sm shrink-0"
                    >
                        {isAr ? qp.ar : qp.en}
                    </button>
                ))}
            </div>

            {/* Chat Box */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl flex flex-col overflow-hidden flex-1 relative">
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex flex-col ${msg.sender === 'user' ? (isAr ? 'items-start' : 'items-end') : (isAr ? 'items-end' : 'items-start')}`}
                        >
                            <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm ${
                                msg.sender === 'user'
                                    ? 'bg-[#fbbf24] text-black font-semibold'
                                    : 'bg-gray-50 dark:bg-white/5 text-black dark:text-white border border-gray-100 dark:border-white/5'
                            }`}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                            
                            {msg.recommendation && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="mt-3 bg-black dark:bg-[#111] border border-white/10 rounded-2xl p-5 max-w-[85%] w-full shadow-2xl"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            msg.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-[#fbbf24]/20 text-[#fbbf24]'
                                        }`}>
                                            {msg.severity === 'critical' ? <Flame size={20} /> : <Wrench size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                    {isAr ? 'الإجراء الفني المقترح' : 'Recommended Action'}
                                                </h4>
                                                {msg.urgency && (
                                                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                                                        msg.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {msg.urgency}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white font-black text-sm tracking-tight mt-1">{msg.recommendation}</p>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/book-service?notes=${encodeURIComponent(msg.recommendation || '')}`}
                                        className="w-full h-11 bg-white hover:bg-[#fbbf24] text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <CheckCircle size={15} />
                                        {isAr ? 'حجز موعد لهذه الخدمة فوراً' : 'Book this Service Now'}
                                    </Link>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                    
                    {isTyping && (
                        <div className={`flex ${isAr ? 'justify-end' : 'justify-start'}`}>
                            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/5 flex gap-1.5 items-center">
                                <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse"></span>
                                <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isAr ? 'اكتب ما تلاحظه هنا... (مثال: عندي صوت خبط في العفشة مع المطبات)' : "Describe symptoms... (e.g. 'Squeaking brake pads when stopping')"}
                            aria-label={isAr ? 'وصف أعطال أو أعراض السيارة' : 'Describe vehicle symptoms'}
                            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-full py-4 px-6 ltr:pr-14 rtl:pl-14 text-sm font-medium outline-none focus:ring-2 focus:ring-[#fbbf24]/30 text-black dark:text-white transition-all shadow-sm"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            aria-label={isAr ? 'إرسال الاستفسار' : 'Send symptom description'}
                            className={`absolute w-10 h-10 bg-[#fbbf24] hover:bg-[#d97706] text-black rounded-full flex items-center justify-center transition-all disabled:opacity-40 shadow-md ${
                                isAr ? 'left-2.5' : 'right-2.5'
                            }`}
                        >
                            <Send size={16} className={isAr ? 'rotate-180' : ''} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIAdvisor;
