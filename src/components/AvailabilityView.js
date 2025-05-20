import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, onValue, off } from "firebase/database";

function AvailabilityView({
    friends,
    getWeekDate,
    totalWeeks,
    onAvailabilityChange
}) {
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(true);

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

    // Render the cell with appropriate styling for each availability state
    const renderAvailabilityCell = (week, friend) => {
        const status = availability[week]?.[friend] || 0;

        // Configure styles and content based on status
        let cellClass, cellText, cellColor;

        switch (status) {
            case 1: // Maybe
                cellClass = "bg-yellow-400 text-white";
                cellText = "?";
                cellColor = "yellow";
                break;
            case 2: // Available
                cellClass = "bg-green-500 text-white";
                cellText = "✓";
                cellColor = "green";
                break;
            default: // Unavailable (0)
                cellClass = "bg-red-500 text-white";
                cellText = "✕";
                cellColor = "red";
                break;
        }

        return (
            <button
                onClick={() => cycleAvailability(week, friend)}
                className={`w-6 h-6 rounded-full ${cellClass}`}
                aria-label={`Set availability for ${friend} on week ${week}`}
                data-color={cellColor}
            >
                {cellText}
            </button>
        );
    };

    return (
        <div className="mt-4">
            <div className="flex items-center mb-4 text-blue-800">
                <CalendarIcon size={24} className="mr-2" />
                <h2 className="text-xl font-bold">Beschikbaarheid</h2>
            </div>

            {loading ? (
                <div className="text-center p-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2">Loading availability data...</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-3 mb-4 justify-center">
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

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow">
                            <thead>
                                <tr className="bg-blue-100">
                                    <th className="py-2 px-4 text-left">Speler</th>
                                    {[...Array(totalWeeks)].map((_, i) => (
                                        <th key={i} className="py-2 px-4 text-center whitespace-nowrap">
                                            <div>Week {i + 1}</div>
                                            <div className="text-xs text-gray-500">{getWeekDate(i + 1)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {friends.map((friend) => (
                                    <tr key={friend} className="border-t">
                                        <td className="py-2 px-4 font-medium">{friend}</td>
                                        {[...Array(totalWeeks)].map((_, i) => {
                                            const weekNum = i + 1;
                                            return (
                                                <td key={i} className="py-2 px-4 text-center">
                                                    {renderAvailabilityCell(weekNum, friend)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-4 text-sm text-gray-500 text-center">
                        Klik om beschikbaarheid te veranderen (afwezig → misschien → beschikbaar)
                    </p>
                </>
            )}
        </div>
    );
}

export default AvailabilityView;