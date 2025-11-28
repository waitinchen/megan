"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface HealthCheck {
  status: 'ok' | 'error' | 'warning' | 'unknown';
  message: string;
  details: Record<string, any>;
  missing?: string[];
  present?: string[];
}

interface HealthCheckResult {
  timestamp: string;
  checks: Record<string, HealthCheck>;
  overall: 'ok' | 'error' | 'warning';
}

export default function HealthCheckPage() {
  const [data, setData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health-check');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // 每 30 秒自動刷新
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ok: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      unknown: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      ok: '正常',
      error: '錯誤',
      warning: '警告',
      unknown: '未知',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">🔍 API 健康檢查</h1>
              <p className="text-slate-600">檢查所有 API 和 Key 值的狀態</p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>重新檢查</span>
            </button>
          </div>

          {data && (
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>最後更新：{formatTimestamp(data.timestamp)}</span>
              <span className="flex items-center gap-2">
                總體狀態：{getStatusBadge(data.overall)}
              </span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && !data && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <RefreshCw className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">檢查中...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">檢查失敗</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Health Checks */}
        {data && (
          <div className="grid gap-6">
            {/* Supabase */}
            <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${getStatusColor(data.checks.supabase?.status || 'unknown')}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.checks.supabase?.status || 'unknown')}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Supabase</h2>
                    <p className="text-sm text-slate-600">資料庫與認證服務</p>
                  </div>
                </div>
                {getStatusBadge(data.checks.supabase?.status || 'unknown')}
              </div>
              <p className="text-slate-700 mb-4">{data.checks.supabase?.message}</p>
              <div className="bg-white/50 rounded-lg p-4 space-y-2 text-sm">
                {Object.entries(data.checks.supabase?.details || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-600 font-medium">{key}:</span>
                    <span className="text-slate-800 font-mono text-xs break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  前往 Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Google OAuth */}
            <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${getStatusColor(data.checks.googleOAuth?.status || 'unknown')}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.checks.googleOAuth?.status || 'unknown')}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Google OAuth</h2>
                    <p className="text-sm text-slate-600">Google 登入認證</p>
                  </div>
                </div>
                {getStatusBadge(data.checks.googleOAuth?.status || 'unknown')}
              </div>
              <p className="text-slate-700 mb-4">{data.checks.googleOAuth?.message}</p>
              <div className="bg-white/50 rounded-lg p-4 space-y-2 text-sm">
                {Object.entries(data.checks.googleOAuth?.details || {}).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-slate-600 font-medium">{key}:</span>
                    <span className="text-slate-800 ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 flex gap-4">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* ElevenLabs */}
            <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${getStatusColor(data.checks.elevenlabs?.status || 'unknown')}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.checks.elevenlabs?.status || 'unknown')}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">ElevenLabs</h2>
                    <p className="text-sm text-slate-600">語音合成服務</p>
                  </div>
                </div>
                {getStatusBadge(data.checks.elevenlabs?.status || 'unknown')}
              </div>
              <p className="text-slate-700 mb-4">{data.checks.elevenlabs?.message}</p>
              {Object.keys(data.checks.elevenlabs?.details || {}).length > 0 && (
                <div className="bg-white/50 rounded-lg p-4 space-y-2 text-sm">
                  {Object.entries(data.checks.elevenlabs?.details || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600 font-medium">{key}:</span>
                      <span className="text-slate-800 font-mono text-xs">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Google Gemini */}
            <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${getStatusColor(data.checks.googleGemini?.status || 'unknown')}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.checks.googleGemini?.status || 'unknown')}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Google Gemini</h2>
                    <p className="text-sm text-slate-600">AI 語言模型</p>
                  </div>
                </div>
                {getStatusBadge(data.checks.googleGemini?.status || 'unknown')}
              </div>
              <p className="text-slate-700 mb-4">{data.checks.googleGemini?.message}</p>
              {Object.keys(data.checks.googleGemini?.details || {}).length > 0 && (
                <div className="bg-white/50 rounded-lg p-4 space-y-2 text-sm">
                  {Object.entries(data.checks.googleGemini?.details || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600 font-medium">{key}:</span>
                      <span className="text-slate-800 font-mono text-xs">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Environment Variables */}
            <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${getStatusColor(data.checks.environment?.status || 'unknown')}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.checks.environment?.status || 'unknown')}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">環境變數</h2>
                    <p className="text-sm text-slate-600">.env.local 設定檢查</p>
                  </div>
                </div>
                {getStatusBadge(data.checks.environment?.status || 'unknown')}
              </div>
              <p className="text-slate-700 mb-4">{data.checks.environment?.message}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {data.checks.environment?.present && data.checks.environment.present.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 mb-2">✅ 已設定</h4>
                    <div className="bg-green-50 rounded-lg p-3 space-y-1">
                      {data.checks.environment.present.map((varName: string) => (
                        <div key={varName} className="text-sm text-green-800 font-mono">
                          {varName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.checks.environment?.missing && data.checks.environment.missing.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-2">❌ 未設定</h4>
                    <div className="bg-red-50 rounded-lg p-3 space-y-1">
                      {data.checks.environment.missing.map((varName: string) => (
                        <div key={varName} className="text-sm text-red-800 font-mono">
                          {varName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

