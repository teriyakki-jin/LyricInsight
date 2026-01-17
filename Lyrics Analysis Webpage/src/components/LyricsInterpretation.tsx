import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface InterpretationData {
    interpretation: string;
    themes: string[];
    metaphors: string[];
    culturalContext: string;
    mood: string;
}

interface LyricsInterpretationProps {
    lyrics: string;
}

export function LyricsInterpretation({ lyrics }: LyricsInterpretationProps) {
    const [interpretation, setInterpretation] = useState<InterpretationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleInterpret = async () => {
        const apiKey = localStorage.getItem('gemini_api_key');

        if (!apiKey) {
            setError('Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsExpanded(true);

        try {
            const response = await fetch('http://localhost:8080/api/v1/analysis/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lyrics, apiKey })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('API 요청 제한 초과: Gemini API의 무료 tier 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.');
                }
                throw new Error('가사 해석에 실패했습니다.');
            }

            const data = await response.json();
            setInterpretation(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <div className="glass rounded-2xl p-6 shadow-lg">
                <button
                    onClick={handleInterpret}
                    disabled={isLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <Sparkles className="w-5 h-5" />
                    AI 가사 해석 보기
                </button>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">AI 가사 해석</h2>
                </div>
                {!isLoading && !error && (
                    <button
                        onClick={handleInterpret}
                        className="px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                    >
                        다시 해석
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                    <p className="text-gray-600">AI가 가사를 분석하고 있습니다...</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-red-700 font-medium">오류가 발생했습니다</p>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {interpretation && !isLoading && (
                <div className="space-y-6">
                    {/* 전체 해석 */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">전체 해석</h3>
                        <p className="text-gray-700 leading-relaxed">{interpretation.interpretation}</p>
                    </div>

                    {/* 주요 테마 */}
                    {interpretation.themes && interpretation.themes.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">주요 테마</h3>
                            <div className="flex flex-wrap gap-2">
                                {interpretation.themes.map((theme, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                                    >
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 비유적 표현 */}
                    {interpretation.metaphors && interpretation.metaphors.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">비유적 표현</h3>
                            <div className="space-y-2">
                                {interpretation.metaphors.map((metaphor, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-purple-50 border border-purple-100 rounded-lg"
                                    >
                                        <p className="text-gray-700 text-sm">{metaphor}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 문화적 맥락 */}
                    {interpretation.culturalContext && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">문화적 맥락</h3>
                            <p className="text-gray-700 leading-relaxed">{interpretation.culturalContext}</p>
                        </div>
                    )}

                    {/* 분위기 */}
                    {interpretation.mood && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">전체 분위기</h3>
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                                <p className="text-gray-700 font-medium">{interpretation.mood}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
