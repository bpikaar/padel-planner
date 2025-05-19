import React, {useEffect, useRef} from "react";

function AudioWaveform({stream, active}) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const sourceRef = useRef(null);
    const audioCtxRef = useRef(null);
    const waveformBufferRef = useRef([]);

    // Aantal punten in de golf (bufferlengte)
    const WAVEFORM_LENGTH = 300;

    useEffect(() => {
        if (!stream || !active) return;

        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Initialiseer de buffer met middenwaarden
        waveformBufferRef.current = Array(WAVEFORM_LENGTH).fill(0);

        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

            // Neem het midden van de analyser-data als nieuwe sample
            const midIndex = Math.floor(bufferLength / 2);
            const v = (dataArrayRef.current[midIndex] - 128) / 128; // tussen -1 en 1

            // Voeg nieuwe sample toe aan het eind van de buffer, verwijder de eerste
            waveformBufferRef.current.push(v);
            if (waveformBufferRef.current.length > WAVEFORM_LENGTH) {
                waveformBufferRef.current.shift();
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#2563eb";
            ctx.beginPath();

            // Smooth waveform with quadratic curves
            let prevX = 0;
            let prevY = canvas.height / 2 + waveformBufferRef.current[0] * (canvas.height / 2) * 1.5;
            ctx.moveTo(prevX, prevY);
            for (let i = 1; i < waveformBufferRef.current.length; i++) {
                const x = i * (canvas.width / WAVEFORM_LENGTH);
                const amplitude = 1.5;
                const y = canvas.height / 2 + waveformBufferRef.current[i] * (canvas.height / 2) * amplitude;
                // Calculate control point for smooth curve
                const cpx = prevX + (x - prevX) / 2;
                const cpy = prevY;
                ctx.quadraticCurveTo(cpx, cpy, x, y);
                prevX = x;
                prevY = y;
            }
            ctx.stroke();

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, [stream, active]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            style={{background: "#e0e7ef", borderRadius: 8}}
        />
    );
}

export default AudioWaveform;