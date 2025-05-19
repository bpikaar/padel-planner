import React, { useRef, useState } from "react";
import AudioWaveform from "./AudioWaveform";

function AudioRecorder({ onRecordingComplete }) {
    const [recording, setRecording] = useState(false);
    const [stream, setStream] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // const isMobileSafari = () => {
    //     const ua = navigator.userAgent;
    //     return /iP(ad|hone|od)/.test(ua) && /WebKit/.test(ua) && !/CriOS/.test(ua);
    // };

    const getSupportedMimeType = () => {
        const possibleTypes = [
            "audio/webm",
            "audio/webm;codecs=opus",
            "audio/mp4", // m4a
            "audio/mpeg", // mp3
            "audio/wav"
        ];
        for (const type of possibleTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ""; // Let browser pick default if none found
    };

    const handleStart = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(stream);

            let mimeType = getSupportedMimeType();

            mediaRecorderRef.current = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            chunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                setRecording(false);
                const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
                if (blob.size === 0) {
                    alert("Recording is empty. Please try again.");
                    return;
                }
                const url = URL.createObjectURL(blob);
                const now = new Date();
                const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
                // Pick extension based on mimeType
                let extension = "webm";
                if (mimeType.includes("mp4")) extension = "m4a";
                else if (mimeType.includes("mpeg")) extension = "mp3";
                else if (mimeType.includes("wav")) extension = "wav";
                const fileName = `recording-${timestamp}.${extension}`;
                const file = new File([blob], fileName, { type: mimeType || "audio/webm" });
                onRecordingComplete(file, url);
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            };
            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (err) {
            alert("Microphone access denied or not available.");
        }
    };

    const handleStop = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2">
                {!recording ? (
                    <button
                        type="button"
                        onClick={handleStart}
                        className="flex items-center px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="6" />
                        </svg>
                        Start Recording
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleStop}
                        className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <rect x="6" y="6" width="8" height="8" rx="2" />
                        </svg>
                        Stop Recording
                    </button>
                )}
                {recording && <span className="text-orange-600 animate-pulse">Recording...</span>}
            </div>
            {/* Show waveform when recording */}
            {recording && stream && (
                <AudioWaveform stream={stream} active={recording} />
            )}
        </div>
    );
}

export default AudioRecorder;