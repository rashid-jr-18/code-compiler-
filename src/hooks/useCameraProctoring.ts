'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraProctoringOptions {
  assignmentId: string;
  learnerId: string;
  enabled: boolean;
  snapshotIntervalSeconds?: number;
  onSnapshotTaken?: (evidenceUrl?: string) => void;
}

export function useCameraProctoring({
  assignmentId,
  learnerId,
  enabled,
  snapshotIntervalSeconds = 30,
  onSnapshotTaken
}: UseCameraProctoringOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Acquire camera stream
  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setCameraError(null);

      // Check for Secure Context (HTTPS or localhost)
      const isSecure = typeof window !== 'undefined' && (
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );

      if (!isSecure && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        throw new Error(
          'INSECURE_HTTP: Browsers require HTTPS (or localhost) to grant camera access. If you are testing over an HTTP IP address, please see the quick instructions below to allow camera testing.'
        );
      }

      let stream: MediaStream | null = null;

      // Standard modern API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false // Privacy: audio is strictly excluded
        });
      } else {
        // Fallback for older browser APIs
        const legacyGetUserMedia =
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).msGetUserMedia;

        if (legacyGetUserMedia) {
          stream = await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(
              navigator,
              { video: true, audio: false },
              resolve,
              reject
            );
          });
        } else {
          throw new Error('Camera access is not supported by your browser.');
        }
      }

      if (!stream) {
        throw new Error('Unable to start camera stream.');
      }

      streamRef.current = stream;
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('[Proctoring] Video play warning:', e));
      }
      setIsStreaming(true);
      setHasPermission(true);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(msg);
      setIsStreaming(false);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Capture current frame as low-bandwidth JPEG Base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isStreaming) return null;
    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // High-efficiency JPEG at 0.6 quality gives crisp evidence at ~20-25KB
      return canvas.toDataURL('image/jpeg', 0.6);
    } catch (err) {
      console.warn('[Proctoring] Failed to capture frame:', err);
      return null;
    }
  }, [isStreaming]);

  // Periodic heartbeat snapshot capture
  useEffect(() => {
    if (!enabled || !isStreaming) return;

    const intervalMs = Math.max(10, snapshotIntervalSeconds) * 1000;
    const intervalTimer = setInterval(async () => {
      const frameBase64 = captureFrame();
      if (!frameBase64) return;

      try {
        const res = await fetch('/api/proctoring/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId,
            learnerId,
            eventType: 'PERIODIC_SNAPSHOT',
            severity: 'INFO',
            snapshotBase64: frameBase64,
            notes: 'Automated periodic heartbeat verification frame'
          })
        });

        const data = await res.json();
        if (data.success && onSnapshotTaken) {
          onSnapshotTaken(data.event?.evidenceImageUrl);
        }
      } catch (err) {
        console.warn('[Proctoring] Periodic snapshot sync error:', err);
      }
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [enabled, isStreaming, assignmentId, learnerId, snapshotIntervalSeconds, captureFrame, onSnapshotTaken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    isStreaming,
    hasPermission,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame
  };
}
