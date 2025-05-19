import React from "react";

const QUICK_ACTIONS = {
    optimize: {
        label: "Optimize",
        prompt:
            `You are given a text that was automatically transcribed from an audio recording using speech recognition (e.g., Whisper).

            The transcription may contain errors in grammar, word choice, punctuation, and sentence structure due to the nature of spoken language.

            Your task is to correct the text so it becomes clean, natural, and grammatically correct, while staying as close as possible to the original meaning.

            Important: Any word or phrase you change or insert to improve the text must be returned in bold (using **word** Markdown syntax).

            🔧 Instructions:
                1.	Fix spelling, grammar, and word order issues.
                2.	Correct misheard or inaccurate phrases, but only when the intended meaning is clear from context.
                3.	Keep the original phrasing and structure as intact as possible — only improve what is necessary.
                4.	Do not add completely new ideas that weren’t present in the original.
                5.	Use bold formatting (<strong></strong>) for each word or phrase that was changed or added.
                6.  Keep the original language.

            Example:
            Input:
            “he dont want go no more cause maybe tired or something”

            Output:
            “He doesn’t want to go anymore because he might be tired or something.”
        `
    },
    summarize: {
        label: "Summarize",
        prompt: "Summarize the text."
    },
    highlights: {
        label: "Highlights",
        prompt: "Highlight the most important points from the text as bullet points."
    },
    translate: {
        label: "Translate to Dutch",
        prompt: "Translate the text to Dutch."
    },
    mainTopic: {
        label: "Main Topic",
        prompt: "What is the main topic of the text?"
    },
    names: {
        label: "Names/Organizations",
        prompt: "List any names or organizations mentioned in the text."
    }
};

function QuickActions({ onAskQuestion }) {

    const handleQuickAction = (prompt) => {
        if (onAskQuestion) {
            onAskQuestion(null, prompt);
        }
    };

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(QUICK_ACTIONS).map(([key, { label, prompt }]) => (
                <button
                    key={key}
                    type="button"
                    className={`px-3 py-1 rounded text-sm font-medium
                        ${key === "optimize" ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" : ""}
                        ${key === "summarize" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                        ${key === "highlights" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}
                        ${key === "translate" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                        ${key === "mainTopic" ? "bg-purple-100 text-purple-800 hover:bg-purple-200" : ""}
                        ${key === "names" ? "bg-pink-100 text-pink-800 hover:bg-pink-200" : ""}
                    `}
                    onClick={() => handleQuickAction(prompt)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

export { QUICK_ACTIONS };
export default QuickActions;