import React from 'react';
import { ShieldAlert, WifiOff, RefreshCw, LogIn } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { ALAYA_URL } from '../../config.js';

/**
 * Robust error and authentication state display
 */
export function ErrorState({ error, onRetry, retrying = false }) {
  const isUnauthorized = error?.status === 401 || error?.isUnauthorized;
  const isNetwork = error?.status === 0 || error?.isNetworkError;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-30 pointer-events-auto">
      <Card
        variant="elevated"
        className="max-w-md w-full text-center border-[rgba(255,255,255,0.12)] p-8 relative overflow-hidden"
      >
        {/* Glow */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isUnauthorized ? 'bg-[#F59E0B]/10' : 'bg-[#EF4444]/10'
          }`}
        />

        <div className="relative flex flex-col items-center">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-full bg-[#11161B] border flex items-center justify-center mb-5 ${
              isUnauthorized
                ? 'border-[#F59E0B]/40 text-[#F59E0B]'
                : 'border-[#EF4444]/40 text-[#EF4444]'
            }`}
          >
            {isUnauthorized ? (
              <ShieldAlert className="w-7 h-7" />
            ) : isNetwork ? (
              <WifiOff className="w-7 h-7" />
            ) : (
              <ShieldAlert className="w-7 h-7" />
            )}
          </div>

          <h2 className="text-base font-mono font-semibold tracking-wider text-[#F5F7FA] mb-2 uppercase">
            {isUnauthorized
              ? 'Authentication Required'
              : isNetwork
              ? 'Backend Unreachable'
              : 'Celestial Signal Lost'}
          </h2>

          <p className="text-xs text-[#A1AAB5] leading-relaxed mb-6 font-sans">
            {isUnauthorized
              ? 'Memory Universe reads your knowledge securely through Alaya HTTP-only session credentials. Please log into Alaya in your browser.'
              : error?.message || 'An unexpected error occurred while communicating with the backend.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            {isUnauthorized ? (
              <>
                <a
                  href={`${ALAYA_URL}/auth?mode=signin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#38BDF8] text-[#050505] font-mono text-xs font-semibold py-2 px-4 rounded-sm hover:bg-[#7DD3FC] transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log Into Alaya</span>
                </a>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onRetry}
                  loading={retrying}
                  icon={RefreshCw}
                  className="w-full sm:w-auto"
                >
                  Retry Session
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onRetry}
                loading={retrying}
                icon={RefreshCw}
                className="w-full"
              >
                Reconnect to Universe
              </Button>
            )}
          </div>

          {error?.status ? (
            <span className="text-[10px] font-mono text-[#737D89] mt-6 tracking-widest uppercase">
              STATUS CODE: {error.status}
            </span>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default ErrorState;
