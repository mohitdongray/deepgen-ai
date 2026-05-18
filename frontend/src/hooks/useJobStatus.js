/**
 * Custom Hook: useJobStatus
 * 
 * Polls for video generation job status.
 * Handles the async nature of AI video generation which can take minutes.
 * Implements exponential backoff to reduce server load.
 */

import { useState, useEffect, useCallback } from 'react';

export const useJobStatus = (jobId) => {
  const [status, setStatus] = useState('pending'); // pending, processing, completed, failed
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const checkStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/status/${jobId}`);
      const response = await res.json();
      setStatus(response.status);
      setPollCount((prev) => prev + 1);

      if (response.status === 'completed') {
        setResult(response);
      } else if (response.status === 'failed') {
        setError(response.error || 'Video generation failed.');
      }
    } catch (err) {
      setError('Failed to check job status.');
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed') {
      return;
    }

    // Initial check
    checkStatus();

    // Polling with exponential backoff
    // Start with 2s, max 30s intervals
    const interval = Math.min(2000 * Math.pow(1.5, Math.min(pollCount, 10)), 30000);
    
    const timer = setInterval(checkStatus, interval);
    return () => clearInterval(timer);
  }, [jobId, status, checkStatus, pollCount]);

  return { status, result, error, pollCount };
};
