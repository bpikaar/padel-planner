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
    }, []); // Empty dependency array means this runs once on mount

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
    }, [availability, loading]); // This effect runs whenever availability changes

    // Move toggleAvailability function to this component
    const toggleAvailability = (week, friend) => {
        const newAvailability = {
            ...availability,
            [week]: {
                ...availability[week],
                [friend]: !availability[week]?.[friend]
            }
        };

        setAvailability(newAvailability);
        // No need to call onAvailabilityChange here as the effect will handle it
    };

    // Get available friends for a week (helper function)
    const getAvailableFriends = (week) => {
        return friends.filter(friend => availability[week]?.[friend]);
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
                                        const isAvailable = availability[weekNum]?.[friend];

                                        return (
                                            <td key={i} className="py-2 px-4 text-center">
                                                <button
                                                    onClick={() => toggleAvailability(weekNum, friend)}
                                                    className={`w-6 h-6 rounded-full ${isAvailable
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-200'
                                                        }`}
                                                >
                                                    {isAvailable ? '✓' : ''}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AvailabilityView;