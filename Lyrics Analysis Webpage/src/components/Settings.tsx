import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Check, X, Loader2, Eye, EyeOff } from 'lucide-react';

export function Settings() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setIsSaved(true);
        }
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setIsSaved(false);
        setTestResult(null);
    };

    const handleTest = async () => {
        if (!apiKey.trim()) {
            setTestResult('error');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('http://localhost:8080/api/v1/analysis/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lyrics: '테스트 가사입니다.',
                    apiKey: apiKey.trim()
                })
            });

            if (response.ok) {
                setTestResult('success');
                localStorage.setItem('gemini_api_key', apiKey.trim());
            } else if (response.status === 429) {
                setTestResult('error');
                alert('⚠️ API 요청 제한 초과 (429 Error)\n\nGemini API의 무료 tier 요청 제한에 도달했습니다.\n잠시 후 다시 시도하거나, API 할당량을 확인해주세요.\n\n참고: https://ai.google.dev/pricing');
            } else {
                setTestResult('error');
            }
        } catch (error) {
            setTestResult('error');
        } finally {
            setIsTesting(false);
            setTimeout(() => setTestResult(null), 3000);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="glass rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <SettingsIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">설정</h1>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gemini API 키
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {showKey ? (
                                    <EyeOff className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <Eye className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 underline"
                            >
                                Google AI Studio
                            </a>
                            에서 API 키를 발급받을 수 있습니다.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!apiKey.trim()}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                        >
                            {isSaved ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    저장됨
                                </>
                            ) : (
                                '저장'
                            )}
                        </button>

                        <button
                            onClick={handleTest}
                            disabled={!apiKey.trim() || isTesting}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    테스트 중...
                                </>
                            ) : testResult === 'success' ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    연결 성공
                                </>
                            ) : testResult === 'error' ? (
                                <>
                                    <X className="w-5 h-5" />
                                    연결 실패
                                </>
                            ) : (
                                '연결 테스트'
                            )}
                        </button>

                        <button
                            onClick={handleClear}
                            disabled={!apiKey}
                            className="px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            삭제
                        </button>
                    </div>

                    {testResult === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-700">
                                API 키가 유효하지 않거나 서버에 연결할 수 없습니다. API 키를 확인하고 다시 시도해주세요.
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-700">
                            <strong>보안 안내:</strong> API 키는 브라우저의 localStorage에 저장됩니다.
                            공용 컴퓨터에서는 사용 후 반드시 삭제해주세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
