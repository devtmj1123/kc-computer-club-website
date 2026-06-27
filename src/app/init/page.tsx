'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
interface InitResult {
  success: boolean;
  message: string;
  collection: string;
  attributes: Array<{
    name: string;
    status: 'created' | 'exists' | 'error';
    error?: string;
  }>;
}
export default function InitPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<InitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleInitialize = async () => {
    setIsInitializing(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/init');
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError((data as { message?: string }).message || 'Initialization failed');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to initialize database');
    } finally {
      setIsInitializing(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#102219] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a2c24] border border-[#2a3c34] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">数据库初始化</h1>
          <p className="text-[#8ba396] mb-6">
            初始化Appwrite数据库并创建必要的集合和属性。
          </p>
          {!result && !error && (
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full bg-[#13ec80]! hover:bg-[#0fd673]! text-[#102219]"
            >
              {isInitializing ? '初始化中...' : '开始初始化'}
            </Button>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium mb-2">错误</p>
              <p className="text-red-300 text-sm">{error}</p>
              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                variant="secondary"
                className="w-full mt-4"
              >
                {isInitializing ? '重试中...' : '重试'}
              </Button>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">✓ 初始化成功！</p>
                <p className="text-green-300 text-sm mb-4">
                  {result.message}
                </p>
              </div>
              <div className="bg-[#0a1816] p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">初始化结果</h3>
                <div className="space-y-2">
                  {result?.attributes?.map((attr: InitResult['attributes'][0], idx: number) => (
                    <div key={idx} className="text-sm text-[#8ba396]">
                      <span className="text-white">{attr.name}:</span>
                      {' '}
                      <span className={attr.status === 'error' ? 'text-red-400' : 'text-green-400'}>
                        {attr.status === 'created' && '✓ 已创建'}
                        {attr.status === 'exists' && '✓ 已存在'}
                        {attr.status === 'error' && `✗ 错误: ${attr.error}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/admin/settings'}
                className="w-full bg-[#13ec80]! hover:bg-[#0fd673]! text-[#102219]"
              >
                返回设置页面
              </Button>
            </div>
          )}
        </div>
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-[#8ba396]">
          <p className="font-semibold text-white mb-2">需要的环境变量：</p>
          <ul className="space-y-1 text-xs">
            <li>✓ NEXT_PUBLIC_APPWRITE_ENDPOINT</li>
            <li>✓ NEXT_PUBLIC_APPWRITE_PROJECT_ID</li>
            <li>✓ NEXT_PUBLIC_APPWRITE_DATABASE_ID</li>
            <li>✓ APPWRITE_API_KEY (用于数据库创建)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}