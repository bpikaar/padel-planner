import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, onValue, off } from "firebase/database";

function AvailabilityView({
    friends,
    getWeekDate,
    totalWeeks,
    onAvailabilityChange,
    currentWeek,
    setCurrentWeek
}) {
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('current'); // 'current' or 'all'

    // Load availability data from Firebase when component mounts
    useEffect(() => {
        setLoading(true);
        const availabilityRef = ref(db, 'availability');

        // Set up real-time listener for availability data
        onValue(availabilityRef, (snapshot) => {
            // Always set loading to false, even if data is null/empty
            setLoading(false);

            // If we have data, update state
            const data = snapshot.val() || {};
            setAvailability(data);
            onAvailabilityChange(data);
        }, (error) => {
            console.error("Error loading availability from Firebase:", error);
            setLoading(false);

            // Fallback to localStorage if Firebase fails
            const savedAvailability = localStorage.getItem('padelAvailability');
            if (savedAvailability) {
                const data = JSON.parse(savedAvailability);
                setAvailability(data);
                onAvailabilityChange(data);
            }
        });

        // Cleanup listener when component unmounts
        return () => off(availabilityRef);
    }, []);

    // Write availability to Firebase whenever it changes
    useEffect(() => {
        // Only write to Firebase if availability has data and we're not in loading state
        if (!loading && Object.keys(availability).length > 0) {
            const availabilityRef = ref(db, 'availability');
            set(availabilityRef, availability)
                .catch(error => {
                    console.error("Error writing availability to Firebase:", error);
                    // Fallback to localStorage
                    localStorage.setItem('padelAvailability', JSON.stringify(availability));
                });
        }
    }, [availability, loading]);

    // Cycle through availability states (unavailable -> maybe -> available -> unavailable)
    const cycleAvailability = (week, friend) => {
        // Get current status or default to 0 (unavailable)
        const currentStatus = availability[week]?.[friend] || 0;

        // Simple cycle through states: 0 -> 1 -> 2 -> 0
        const nextStatus = (currentStatus + 1) % 3;

        const newAvailability = {
            ...availability,
            [week]: {
                ...availability[week],
                [friend]: nextStatus
            }
        };

        setAvailability(newAvailability);
    };

    // Get available friends for a week (helper function)
    const getAvailableFriends = (week) => {
        return friends.filter(friend => availability[week]?.[friend] === 2);
    };

    // Count how many times a friend has been available up to the selected week
    const getAvailabilityCountUntilCurrentWeek = (friend) => {
        if (!currentWeek) return 0;
        let count = 0;
        for (let week = 1; week <= currentWeek; week++) {
            if (availability[week]?.[friend] === 2) {
                count++;
            }
        }
        return count;
    };

    // Render the cell with appropriate styling for each availability state
    const renderAvailabilityCell = (week, friend, isLarge = false) => {
        const status = availability[week]?.[friend] || 0;

        let cellClass, cellText, cellColor;
        switch (status) {
            case 1:
                cellClass = "bg-yellow-400 text-white";
                cellText = "?";
                cellColor = "yellow";
                break;
            case 2:
                cellClass = "bg-green-500 text-white";
                cellText = "✓";
                cellColor = "green";
                break;
            default:
                cellClass = "bg-red-500 text-white";
                cellText = "✕";
                cellColor = "red";
                break;
        }

        const sizeClass = isLarge ? "w-12 h-12 text-lg" : "w-8 h-8 text-sm";

        return (
            <button
                onClick={() => cycleAvailability(week, friend)}
                className={`${sizeClass} rounded-full ${cellClass} font-semibold transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center`}
                aria-label={`Set availability for ${friend} on week ${week}`}
                data-color={cellColor}
            >
                {cellText}
            </button>
        );
    };

    // Navigate to previous/next week in current week view
    const goToPrevWeek = () => {
        if (currentWeek > 1 && setCurrentWeek) {
            setCurrentWeek(currentWeek - 1);
        }
    };

    const goToNextWeek = () => {
        if (currentWeek < totalWeeks && setCurrentWeek) {
            setCurrentWeek(currentWeek + 1);
        }
    };

    // Render current week view (mobile-friendly)
    const renderCurrentWeekView = () => (
        <div className="space-y-4">
            {/* Week navigation */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                <button
                    onClick={goToPrevWeek}
                    disabled={currentWeek <= 1 || !setCurrentWeek}
                    className={`p-2 rounded-full ${currentWeek <= 1 || !setCurrentWeek ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[rgb(120,151,178)] text-white hover:bg-[rgb(100,131,158)]'}`}
                    aria-label="Vorige week"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold">Week {currentWeek}</h3>
                    <p className="text-sm text-gray-500">{getWeekDate(currentWeek)}</p>
                    <div className="mt-2 text-xs text-green-600 font-medium">
                        {getAvailableFriends(currentWeek).length} spelers beschikbaar
                    </div>
                </div>

                <button
                    onClick={goToNextWeek}
                    disabled={currentWeek >= totalWeeks || !setCurrentWeek}
                    className={`p-2 rounded-full ${currentWeek >= totalWeeks || !setCurrentWeek ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[rgb(120,151,178)] text-white hover:bg-[rgb(100,131,158)]'}`}
                    aria-label="Volgende week"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Players grid for current week */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map((friend) => {
                    const availableCount = getAvailabilityCountUntilCurrentWeek(friend);
                    return (
                        <div key={friend} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate" title={friend}>
                                        {friend}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Klik om status te wijzigen
                                    </p>
                                </div>
                                <div className="ml-3 flex-shrink-0 flex items-center space-x-2">
                                    <div className="w-12 h-12 rounded-full border-2 border-[rgb(120,151,178)] text-[rgb(120,151,178)] flex flex-col items-center justify-center leading-tight">
                                        <span className="text-base font-semibold leading-none">{availableCount}</span>
                                        <span className="text-[10px] font-medium">keer</span>
                                    </div>
                                    {renderAvailabilityCell(currentWeek, friend, true)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Available players summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Beschikbare spelers voor week {currentWeek}:</h4>
                {getAvailableFriends(currentWeek).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {getAvailableFriends(currentWeek).map(friend => (
                            <span key={friend} className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm">
                                {friend}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-green-600 text-sm">Nog geen spelers beschikbaar</p>
                )}
            </div>
        </div>
    );

    // Render full overview (desktop)
    const renderFullView = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                    <tr className="bg-[rgb(120,151,178)] bg-opacity-20">
                        <th className="py-3 px-4 text-left font-semibold sticky left-0 bg-[rgb(120,151,178)] bg-opacity-20 z-10">
                            <div className="min-w-0">
                                <div className="text-sm sm:text-base font-semibold truncate">Speler</div>
                            </div>
                        </th>
                        {[...Array(totalWeeks)].map((_, i) => (
                            <th key={i} className="py-3 px-2 text-center whitespace-nowrap min-w-[80px]">
                                <div className="text-xs sm:text-sm font-semibold">Week {i + 1}</div>
                                <div className="text-xs text-gray-500">{getWeekDate(i + 1)}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {friends.map((friend) => (
                        <tr key={friend} className="border-t hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium sticky left-0 bg-white z-10 border-r">
                                <div className="min-w-0">
                                    <div className="text-sm sm:text-base font-medium truncate" title={friend}>
                                        {friend}
                                    </div>
                                </div>
                            </td>
                            {[...Array(totalWeeks)].map((_, i) => {
                                const weekNum = i + 1;
                                const isCurrentWeek = weekNum === currentWeek;
                                return (
                                    <td key={i} className={`py-3 px-2 text-center ${isCurrentWeek ? 'bg-blue-50' : ''}`}>
                                        {renderAvailabilityCell(weekNum, friend)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center mb-4 sm:mb-0 text-[rgb(120,151,178)]">
                    <CalendarIcon size={24} className="mr-2" />
                    <h2 className="text-xl font-bold">Beschikbaarheid</h2>
                </div>

                {/* View mode toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('current')}
                        className={`px-4 py-2 text-sm rounded-md transition-colors ${viewMode === 'current'
                            ? 'bg-white text-[rgb(120,151,178)] shadow'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Huidige week
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-4 py-2 text-sm rounded-md transition-colors ${viewMode === 'all'
                            ? 'bg-white text-[rgb(120,151,178)] shadow'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Alle weken
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-600">Beschikbaarheid laden...</p>
                </div>
            ) : (
                <>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-6 justify-center bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                            <span className="text-sm">Afwezig</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
                            <span className="text-sm">Misschien</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm">Beschikbaar</span>
                        </div>
                    </div>

                    {/* Content based on view mode */}
                    {viewMode === 'current' ? renderCurrentWeekView() : renderFullView()}

                    <p className="mt-4 text-sm text-gray-500 text-center">
                        Klik op de status om te wijzigen: afwezig → misschien → beschikbaar
                    </p>
                </>
            )}
        </div>
    );
}

export default AvailabilityView;