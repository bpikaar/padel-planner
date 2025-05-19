import React from "react";

function AudioPlayer({url, name}) {
    if (!url || !name) return null;
    return (
        <div className="flex flex-col gap-2 bg-gray-50 border border-gray-200 rounded p-3">
            <span className="font-medium text-gray-700 text-center">{name}</span>
            <div className="flex items-center gap-2">
                <audio controls src={url} className="h-8 w-full">
                    Your browser does not support the audio element.
                </audio>
                <a
                    href={url}
                    download={name}
                    className="ml-2 p-2 rounded hover:bg-orange-100"
                    title="Download audio"
                >
                    {/* Download icon */}
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2"
                         viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/>
                    </svg>
                </a>
            </div>
        </div>
    );
}

export default AudioPlayer;