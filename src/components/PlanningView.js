import React, { useEffect, useState, useRef } from 'react';
import { Edit2, Save, X, Users, RefreshCw, Calendar, UserPlus } from 'lucide-react';

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
    getAvailableFriends,
    createTeamsForWeek,
    friends,
    guestPlayers,
    addGuestToPool,
    removeGuestFromPool,
    startDate,
    getActualCurrentWeek // Use the function passed from parent
}) => {
    const [newGuestName, setNewGuestName] = useState('');
    const hasInitialized = useRef(false);

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

    // Use the function passed from parent instead of calculating here
    const actualCurrentWeek = getActualCurrentWeek();

    // Check if we're viewing the current week
    const isCurrentWeek = currentWeek === actualCurrentWeek;

    // Auto-navigate to current week ONLY when component first mounts
    useEffect(() => {
        if (!hasInitialized.current && currentWeek !== actualCurrentWeek) {
            setCurrentWeek(actualCurrentWeek);
            hasInitialized.current = true;
        } else if (!hasInitialized.current) {
            hasInitialized.current = true;
        }
    }, [actualCurrentWeek, currentWeek, setCurrentWeek]);

    // Handler for adding a guest to the available players pool
    const handleAddGuest = () => {
        if (newGuestName.trim() === '') return;
        addGuestToPool(newGuestName.trim());
        setNewGuestName('');
    };

    return (
        <div className="mt-4 space-y-6">
            {/* Week navigation with current week indicator */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <button
                    onClick={goToPrevWeek}
                    disabled={currentWeek <= 1}
                    className={`w-full sm:w-auto px-3 py-2 rounded text-sm sm:text-base ${currentWeek <= 1 ? 'bg-gray-200 text-gray-500' : 'bg-[rgb(120,151,178)] text-white'}`}
                    aria-label="Vorige week"
                >
                    Vorige week
                </button>
                <div className="text-center">
                    <h2 className="text-lg sm:text-xl font-bold">Week {currentWeek}</h2>
                    <p className="text-xs sm:text-sm text-gray-500">{getWeekDate(currentWeek)}</p>
                    {isCurrentWeek && (
                        <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Calendar size={12} className="mr-1" />
                            Huidige week
                        </span>
                    )}
                </div>
                <button
                    onClick={goToNextWeek}
                    disabled={currentWeek >= totalWeeks}
                    className={`w-full sm:w-auto px-3 py-2 rounded text-sm sm:text-base ${currentWeek >= totalWeeks ? 'bg-gray-200 text-gray-500' : 'bg-[rgb(120,151,178)] text-white'}`}
                    aria-label="Volgende week"
                >
                    Volgende week
                </button>
            </div>

            {/* Jump to current week button - only show if not already on current week */}
            {!isCurrentWeek && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setCurrentWeek(actualCurrentWeek)}
                        className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                        <Calendar size={14} className="mr-1.5" />
                        Ga naar huidige week
                    </button>
                </div>
            )}

            {/* Rest of the component remains the same */}
            {/* Availability for current week */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <div className="flex items-center">
                        <Users size={20} className="mr-2 text-[rgb(120,151,178)]" />
                        <h3 className="text-base sm:text-lg font-semibold">Beschikbare spelers</h3>
                    </div>
                    <button
                        onClick={() => createTeamsForWeek(currentWeek)}
                        className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded text-sm"
                    >
                        <RefreshCw size={16} className="mr-1.5" />
                        <span>Teams maken</span>
                    </button>
                </div>

                {/* Regular players */}
                {availableFriends.length > 0 ? (
                    <div
                        className="flex flex-wrap gap-2"
                        aria-label="Beschikbare spelers lijst"
                    >
                        {availableFriends.map(friend => (
                            <span
                                key={friend}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm md:text-base leading-tight whitespace-normal"
                                title={friend}
                            >
                                {friend}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Geen spelers beschikbaar voor deze week</p>
                )}

                {/* Guest players section */}
                <div className="mt-4">
                    <div className="flex items-center mb-2">
                        <UserPlus size={16} className="mr-1.5 text-[rgb(120,151,178)]" />
                        <h4 className="text-sm font-medium">Gastspelers toevoegen voor teamvorming</h4>
                    </div>

                    {/* Input for adding guests */}
                    <div className="flex flex-col sm:flex-row mb-2 gap-2">
                        <input
                            type="text"
                            value={newGuestName}
                            onChange={(e) => setNewGuestName(e.target.value)}
                            placeholder="Naam gastspeler"
                            className="w-full border rounded px-3 py-2 text-sm"
                            aria-label="Naam gastspeler"
                        />
                        <button
                            onClick={handleAddGuest}
                            disabled={newGuestName.trim() === ''}
                            className="w-full sm:w-auto bg-[rgb(120,151,178)] text-white px-3 py-2 rounded text-sm disabled:opacity-60"
                        >
                            Toevoegen
                        </button>
                    </div>

                    {/* Display added guests */}
                    {guestPlayers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {guestPlayers.map((guest, index) => (
                                <div key={index} className="inline-flex items-center bg-yellow-100 px-2 py-1 rounded-full text-sm md:text-base leading-tight">
                                    <span className="text-yellow-800" title={guest}>{guest}</span>
                                    <span className="mx-1 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                                        Gast
                                    </span>
                                    <button
                                        onClick={() => removeGuestFromPool(index)}
                                        className="ml-1 text-yellow-800 hover:text-yellow-900"
                                        aria-label={`Verwijder gastspeler ${guest}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                    {availableFriends.length + guestPlayers.length} totale spelers beschikbaar
                    {availableFriends.length + guestPlayers.length < 4 && (
                        <span className="ml-2 text-amber-600 font-medium">
                            (minimaal 4 spelers nodig voor een wedstrijd)
                        </span>
                    )}
                </div>
            </div>

            {/* Teams with custom player option */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTeam(matchForCurrentWeek.team1 || [], 'Team 1', currentWeek, 'team1')}
                {renderTeam(matchForCurrentWeek.team2 || [], 'Team 2', currentWeek, 'team2')}
            </div>

            {/* Results section - unchanged */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">Uitslag</h3>
                {editingResult === currentWeek ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-3">
                        <div className="flex items-center space-x-2">
                            <span>Team 1:</span>
                            <input
                                type="number"
                                min="0"
                                className="border rounded p-2 w-20"
                                value={tempResult.team1Score}
                                onChange={e => setTempResult({ ...tempResult, team1Score: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span>Team 2:</span>
                            <input
                                type="number"
                                min="0"
                                className="border rounded p-2 w-20"
                                value={tempResult.team2Score}
                                onChange={e => setTempResult({ ...tempResult, team2Score: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-row gap-2">
                            <button
                                className="flex items-center bg-green-600 text-white px-3 py-2 rounded"
                                onClick={() => saveResult(currentWeek)}
                            >
                                <Save size={16} className="mr-1" />
                                <span>Opslaan</span>
                            </button>
                            <button
                                className="flex items-center bg-gray-400 text-white px-3 py-2 rounded"
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
                            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded"
                            onClick={() => startEditingResult(currentWeek)}
                        >
                            <Edit2 size={16} className="mr-1" />
                            <span>Wijzigen</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-gray-500 mr-0 sm:mr-4">Nog geen uitslag</span>
                        <button
                            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded"
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