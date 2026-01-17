import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './components/Home';
import { Result } from './components/Result';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Music } from 'lucide-react';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass border-b-0">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Music className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">가사 해석기</span>
          </Link>
          <div className="flex gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl transition-all font-medium ${location.pathname === '/'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              분석하기
            </Link>
            <Link
              to="/history"
              className={`px-4 py-2 rounded-xl transition-all font-medium ${location.pathname === '/history'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              기록
            </Link>
            <Link
              to="/settings"
              className={`px-4 py-2 rounded-xl transition-all font-medium ${location.pathname === '/settings'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              설정
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900 font-sans">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}
