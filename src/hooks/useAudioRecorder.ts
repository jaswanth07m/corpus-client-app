import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'stopped' | 'error';

export interface AudioRecorderState {
  status: RecorderStatus;
  blob: Blob | null;
  blobUrl: string | null;
  duration: number;
  error: string | null;
  frequencyData: Uint8Array | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    status: 'idle',
    blob: null,
    blobUrl: null,
    duration: 0,
    error: null,
    frequencyData: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        setState((prev) => ({
          ...prev,
          status: 'stopped',
          blob,
          blobUrl,
          frequencyData: null,
        }));
      };

      recorder.onerror = () => {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Recording failed due to a device error.',
        }));
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      setState((prev) => ({ ...prev, status: 'recording' }));

      const animate = () => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          setState((prev) => ({ ...prev, frequencyData: data }));
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      durationIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 200);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone permissions in your browser settings.'
          : 'Could not start recording. Please check your microphone.';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanup();
    if (state.blobUrl) {
      URL.revokeObjectURL(state.blobUrl);
    }
    chunksRef.current = [];
    setState({
      status: 'idle',
      blob: null,
      blobUrl: null,
      duration: 0,
      error: null,
      frequencyData: null,
    });
  }, [cleanup, state.blobUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
