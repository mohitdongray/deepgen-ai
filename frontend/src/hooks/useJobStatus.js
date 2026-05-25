/**
 * Polls async generation job status via the gateway.
 */

import { useState, useEffect, useCallback } from 'react';
import { getApiBase, resolveMediaUrl } from '../services/generationService';

export const useJobStatus = (jobId) => {
  const [status, setStatus] = useState('pending');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const checkStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const res = await fetch(`${getApiBase()}/status/${jobId}`);
      if (!res.ok) {
        throw new Error(`Status check failed (${res.status})`);
      }

      const response = await res.json();
      setStatus(response.status);
      setPollCount((prev) => prev + 1);

      if (response.status === 'completed') {
        setResult({
          ...response,
          video_url: resolveMediaUrl(response.video_url),
          image_url: resolveMediaUrl(response.image_url),
          videoUrl: resolveMediaUrl(response.video_url),
          imageUrl: resolveMediaUrl(response.image_url),
        });
      } else if (response.status === 'failed') {
        setError(response.error || 'Generation failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to check job status.');
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed') {
      return;
    }

    checkStatus();

    const interval = Math.min(2000 * Math.pow(1.5, Math.min(pollCount, 10)), 30000);
    const timer = setInterval(checkStatus, interval);
    return () => clearInterval(timer);
  }, [jobId, status, checkStatus, pollCount]);

  return { status, result, error, pollCount };
};
