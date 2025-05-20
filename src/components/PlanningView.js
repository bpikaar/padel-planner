import React from 'react';
import { Edit2, Save, X, Users, RefreshCw } from 'lucide-react';

const PlanningView = ({
    currentWeek,
    totalWeeks,
    getWeekDate,
    matches,
    results,
    renderTeam,
    editingResult,
    tempResult,
    setTempResult,
    startEditingResult,
    cancelEditingResult,
    saveResult,
    setCurrentWeek,
    availability,
    getAvailableFriends,
    createTeamsForWeek,
    friends
}) => {
    // Navigate to previous/next week
    const goToPrevWeek = () => {
        if (currentWeek > 1) {
            setCurrentWeek(currentWeek - 1);
        }
    };

    const goToNextWeek = () => {
        if (currentWeek < totalWeeks) {
            setCurrentWeek(currentWeek + 1);
        }
    };

    const matchForCurrentWeek = matches[currentWeek] || { team1: [], team2: [] };
    const resultForCurrentWeek = results[currentWeek];
    const availableFriends = getAvailableFriends(currentWeek);

    return (
        <div className="mt-4 space-y-6">
            {/* Week navigation */}
            <div className="flex justify-between items-center">
                <button
                    onClick={goToPrevWeek}
                    disabled={currentWeek <= 1}
                    className={`px-3 py-1 rounded ${currentWeek <= 1 ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'}`}
                >
                    Vorige week
                </button>
                <div className="text-center">
                    <h2 className="text-xl font-bold">Week {currentWeek}</h2>
                    <p className="text-sm text-gray-500">{getWeekDate(currentWeek)}</p>
                </div>
                <button
                    onClick={goToNextWeek}
                    disabled={currentWeek >= totalWeeks}
                    className={`px-3 py-1 rounded ${currentWeek >= totalWeeks ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'}`}
                >
                    Volgende week
                </button>
            </div>

            {/* Availability for current week */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <Users size={20} className="mr-2 text-blue-800" />
                        <h3 className="text-lg font-semibold">Beschikbare spelers</h3>
                    </div>
                    <button
                        onClick={() => createTeamsForWeek(currentWeek)}
                        className="flex items-center bg-green-600 text-white px-3 py-1.5 rounded"
                    >
                        <RefreshCw size={16} className="mr-1.5" />
                        <span>Teams maken</span>
                    </button>
                </div>

                {availableFriends.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {availableFriends.map(friend => (
                            <span key={friend} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                {friend}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Geen spelers beschikbaar voor deze week</p>
                )}

                <div className="mt-2 text-sm text-gray-500">
                    {availableFriends.length} van {friends.length} spelers beschikbaar
                    {availableFriends.length < 4 && availableFriends.length > 0 && (
                        <span className="ml-2 text-amber-600 font-medium">
                            (minimaal 4 spelers nodig voor een wedstrijd)
                        </span>
                    )}
                </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTeam(matchForCurrentWeek.team1 || [], 'Team 1', currentWeek, 'team1')}
                {renderTeam(matchForCurrentWeek.team2 || [], 'Team 2', currentWeek, 'team2')}
            </div>

            {/* Results */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">Uitslag</h3>
                {editingResult === currentWeek ? (
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span>Team 1:</span>
                            <input
                                type="number"
                                min="0"
                                className="border rounded p-1 w-16"
                                value={tempResult.team1Score}
                                onChange={e => setTempResult({ ...tempResult, team1Score: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span>Team 2:</span>
                            <input
                                type="number"
                                min="0"
                                className="border rounded p-1 w-16"
                                value={tempResult.team2Score}
                                onChange={e => setTempResult({ ...tempResult, team2Score: e.target.value })}
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                className="flex items-center bg-green-600 text-white px-2 py-1 rounded"
                                onClick={() => saveResult(currentWeek)}
                            >
                                <Save size={16} className="mr-1" />
                                <span>Opslaan</span>
                            </button>
                            <button
                                className="flex items-center bg-gray-400 text-white px-2 py-1 rounded"
                                onClick={cancelEditingResult}
                            >
                                <X size={16} className="mr-1" />
                                <span>Annuleren</span>
                            </button>
                        </div>
                    </div>
                ) : resultForCurrentWeek ? (
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold">Team 1: {resultForCurrentWeek.team1Score}</span>
                            <span className="mx-2">-</span>
                            <span className="font-semibold">Team 2: {resultForCurrentWeek.team2Score}</span>
                        </div>
                        <button
                            className="flex items-center bg-blue-600 text-white px-2 py-1 rounded"
                            onClick={() => startEditingResult(currentWeek)}
                        >
                            <Edit2 size={16} className="mr-1" />
                            <span>Wijzigen</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <span className="text-gray-500 mr-4">Nog geen uitslag</span>
                        <button
                            className="flex items-center bg-blue-600 text-white px-2 py-1 rounded"
                            onClick={() => startEditingResult(currentWeek)}
                        >
                            <Edit2 size={16} className="mr-1" />
                            <span>Uitslag invullen</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanningView;