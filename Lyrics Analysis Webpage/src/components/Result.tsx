import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles, Share2, Check, Music2, Quote, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../lib/api';
import { Skeleton } from './ui/Skeleton';
import { LyricsInterpretation } from './LyricsInterpretation';
import { EmotionRadar } from './EmotionRadar';

type EmotionItem = { label: string; score: number };
type HighlightItem = { line: string; meaning: string; why: string };
type WordEmotionItem = { word: string; emotion: string; score: number; explanation: string };

interface AnalysisResult {
    id: string;
    createdAt: string;
    emotions: EmotionItem[];
    result?: {
        summary?: string[];
        themes?: string[];
        highlights?: HighlightItem[];
        word_emotions?: WordEmotionItem[];
    } | null;
}

type LocationState = {
    lyrics?: string;
    emotions?: EmotionItem[];
    createdAt?: string;
    result?: AnalysisResult['result'];
} | null;

export function Result() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    const [data, setData] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [lyrics, setLyrics] = useState<string>('');

    const formattedDate = useMemo(() => {
        if (!data?.createdAt) return '';
        const d = new Date(data.createdAt);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }, [data?.createdAt]);

    // 오로라 배경 효과를 위한 스타일
    const auroraBg = `
        relative overflow-hidden bg-slate-50
        before:absolute before:top-[-10%] before:right-[-5%] before:w-[500px] before:h-[500px] 
        before:bg-purple-300/30 before:rounded-full before:blur-[80px] before:animate-pulse
        after:absolute after:bottom-[-10%] after:left-[-10%] after:w-[600px] after:h-[600px] 
        after:bg-indigo-300/30 after:rounded-full after:blur-[100px] after:animate-pulse
    `;

    useEffect(() => {
        if (state?.lyrics) setLyrics(state.lyrics);

        // 디버깅: state 확인
        console.log('=== Result Debug ===');
        console.log('state:', state);
        console.log('state.result:', state?.result);
        console.log('word_emotions:', state?.result?.word_emotions);
        console.log('highlights:', state?.result?.highlights);

        if (state?.emotions?.length) {
            setData({
                id: id ?? 'unknown',
                createdAt: state.createdAt ?? new Date().toISOString(),
                emotions: state.emotions.map(e => ({ label: e.label, score: normalizeScore(e.score) })),
                result: state.result ?? null,
            });
            setIsLoading(false);
            return;
        }

        const fetchResult = async () => {
            if (!id) { setIsLoading(false); return; }
            try {
                const [response] = await Promise.all([
                    fetch(apiUrl(`/api/v1/analysis/${id}`)),
                    new Promise(resolve => setTimeout(resolve, 1200)) // 로딩 효과를 위해 조금 더 대기
                ]);

                if (!response.ok) throw new Error('Failed');
                const result = await response.json();
                const emotions = (result.emotions ?? result.result?.emotions ?? []) as EmotionItem[];

                setData({
                    id: String(result.id ?? id),
                    createdAt: result.createdAt ?? new Date().toISOString(),
                    emotions: emotions.map(e => ({ label: e.label, score: normalizeScore(e.score) })),
                    result: result.result ?? null,
                });
            } catch (err) {
                console.error(err);
                alert('결과를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchResult();
    }, [id, state]);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (e) { console.error(e); }
    };

    if (isLoading) return <LoadingSkeleton />;
    if (!data) return <NotFound navigate={navigate} />;

    const radarData = data.emotions.map(e => ({
        label: e.label,
        score: e.score,
        fullMark: 100
    }));

    return (
        <div className={`min-h-screen ${auroraBg} pb-24`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
                {/* 상단 네비게이션 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-8"
                >
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm transition-all text-slate-600 font-medium shadow-sm hover:shadow"
                    >
                        <ArrowLeft className="w-4 h-4" /> 뒤로가기
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        {isCopied ? '복사됨' : '공유하기'}
                    </button>
                </motion.div>

                {/* 메인 타이틀 & 날짜 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center p-3 mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-200 text-white">
                        <Music2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">감정 분석 리포트</h1>
                    <p className="text-slate-500 font-medium">{formattedDate}</p>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* 왼쪽 컬럼: 레이더 차트 + 요약 */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 감정 레이더 차트 카드 */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl border border-indigo-50/50"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-indigo-500 rounded-full" /> 감정 분포
                            </h2>
                            <div className="flex justify-center -ml-4">
                                <EmotionRadar data={radarData} />
                            </div>
                        </motion.div>

                        {/* 3줄 요약 카드 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden"
                        >
                            <Lightbulb className="absolute top-4 right-4 text-white/20 w-12 h-12 rotate-12" />
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                                <Sparkles className="w-5 h-5" /> 3줄 요약
                            </h2>
                            <div className="space-y-3 relative z-10">
                                {data.result?.summary?.map((line, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-sm sm:text-base leading-relaxed border border-white/10"
                                    >
                                        {line}
                                    </motion.div>
                                ))}
                                {!data.result?.summary && <p className="text-white/60 text-center py-4">요약 정보가 없습니다.</p>}
                            </div>
                        </motion.div>
                    </div>

                    {/* 오른쪽 컬럼: 하이라이트 + 단어 분석 + 테마 */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 주요 테마 (Chips) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap gap-3"
                        >
                            {data.result?.themes?.map((theme, i) => (
                                <motion.span
                                    key={i}
                                    whileHover={{ scale: 1.05, rotate: -1 }}
                                    className="px-4 py-2 bg-white/80 backdrop-blur shadow-sm border border-indigo-100 rounded-full text-indigo-600 font-bold text-sm tracking-wide"
                                >
                                    #{theme}
                                </motion.span>
                            ))}
                        </motion.div>

                        {/* 하이라이트 */}
                        <div className="space-y-4">
                            {data.result?.highlights?.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                    className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow border border-white/50"
                                >
                                    <div className="mb-4 relative">
                                        <Quote className="absolute -top-2 -left-2 text-indigo-100 w-10 h-10 -z-10" />
                                        <p className="text-xl sm:text-2xl font-serif font-bold text-slate-800 leading-relaxed break-keep">
                                            "{item.line}"
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5">
                                        <div className="mb-3">
                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Meaning</span>
                                            <p className="text-slate-700 font-medium mt-1">{item.meaning}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Analysis</span>
                                            <p className="text-slate-600 text-sm mt-1">{item.why}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 단어 감정 분석 (Grid Cards) */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {data.result?.word_emotions?.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + idx * 0.05 }}
                                    className="bg-white/60 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-lg text-slate-800 border-b-2 border-indigo-200">
                                            {item.word}
                                        </span>
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                                            {item.emotion}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-snug mb-3 min-h-[40px]">
                                        {item.explanation}
                                    </p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${normalizeScore(item.score)}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full bg-indigo-500 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI 전체 해석 컴포넌트 */}
                {lyrics && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-12 bg-white/40 backdrop-blur-xl rounded-[2rem] p-2"
                    >
                        <LyricsInterpretation lyrics={lyrics} />
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function normalizeScore(score: number) {
    if (typeof score !== 'number') return 0;
    return score <= 1 ? Math.round(score * 100) : Math.round(score);
}

function LoadingSkeleton() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse space-y-8">
            <div className="h-12 w-64 bg-slate-200 rounded-xl mx-auto mb-12" />
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <div className="h-[400px] bg-slate-200 rounded-[2rem]" />
                    <div className="h-[200px] bg-slate-200 rounded-[2rem]" />
                </div>
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex gap-3">
                        <div className="h-8 w-20 bg-slate-200 rounded-full" />
                        <div className="h-8 w-24 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-[180px] bg-slate-200 rounded-[2rem]" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="h-[120px] bg-slate-200 rounded-2xl" />
                        <div className="h-[120px] bg-slate-200 rounded-2xl" />
                        <div className="h-[120px] bg-slate-200 rounded-2xl" />
                        <div className="h-[120px] bg-slate-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotFound({ navigate }: { navigate: (path: string) => void }) {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white/80 backdrop-blur-lg p-10 rounded-[2rem] shadow-xl max-w-md w-full">
                <Music2 className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">분석 결과를 찾을 수 없습니다</h2>
                <p className="text-slate-500 mb-8">요청하신 분석 정보가 존재하지 않거나 삭제되었습니다.</p>
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}

