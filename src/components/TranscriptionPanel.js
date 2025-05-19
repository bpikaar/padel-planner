import React, { useState, useEffect } from "react";
import QuickActions from "./QuickActions";
import Showdown from "showdown"; // Import Showdown

function TranscriptionPanel({ transcription, serverUrl }) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [answerLoading, setAnswerLoading] = useState(false);

    useEffect(() => {
        setQuestion("");
        setAnswer("");
    }, [transcription]);

    const handleAskQuestion = async (event, customQuestion) => {

        if (event) event.preventDefault();
        const q = customQuestion !== undefined ? customQuestion : question;
        if (!q || !transcription) return;

        try {
            setAnswerLoading(true);
            const response = await fetch(serverUrl + "ask-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q, transcription }),
            });

            if (!response.ok) throw new Error("Failed to get answer");

            const data = await response.json();

            setAnswer(data.answer); // Assume the answer is in Markdown format
            setQuestion(q); // Keep input in sync
        } catch (error) {
            console.error("Error asking question:", error);
            alert("Failed to get answer.");
        } finally {
            setAnswerLoading(false);
        }
    };

    // Convert Markdown to HTML using Showdown
    const converter = new Showdown.Converter();
    const answerHtml = converter.makeHtml(answer);

    return (
        <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/2 flex flex-col justify-between">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Transcription
            </h2>
            <div className="flex-1 flex flex-col justify-between">
                {transcription ? (
                    <>
                        <div className="bg-gray-50 border border-gray-200 rounded p-5 mb-4">
                            <p className="text-gray-700 italic">
                                "{transcription}"
                            </p>
                        </div>
                        {/* Quick Action Buttons */}
                        <QuickActions onAskQuestion={handleAskQuestion} />
                        {/* Chat-style Q&A */}
                        {answer && (
                            <div className="flex flex-col items-end mb-4">
                                <div
                                    className="bg-green-100 border border-green-300 text-green-900 rounded-2xl px-4 py-2 max-w-xs whitespace-pre-line shadow-sm"
                                    dangerouslySetInnerHTML={{ __html: answerHtml }} // Render HTML safely
                                    style={{
                                        borderBottomRightRadius: 4,
                                        borderTopRightRadius: 20,
                                        borderTopLeftRadius: 20,
                                        borderBottomLeftRadius: 20
                                    }}>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleAskQuestion} className="flex gap-2 mt-auto">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask a question about the text..."
                                className="flex-1 p-2 border border-gray-300 rounded"
                            />
                            <button
                                type="submit"
                                disabled={answerLoading || !question}
                                className={`px-4 py-2 text-white font-semibold rounded ${answerLoading || !question ? "bg-green-300" : "bg-green-500 hover:bg-green-600"
                                    }`}
                            >
                                {answerLoading ? "..." : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                                        viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div
                        className="bg-gray-50 border border-gray-200 rounded p-5 text-gray-500 italic text-center">
                        Upload an audio file to see the transcription here
                    </div>
                )}
            </div>
        </div>
    );
}

export default TranscriptionPanel;