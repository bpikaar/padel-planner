import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, set, get, onValue, off } from "firebase/database";
import StatsView from './components/StatsView';
import AvailabilityView from './components/AvailabilityView';
import HistoryView from './components/HistoryView';
import PlanningView from './components/PlanningView';
import NavigationBar from './components/NavigationBar';

const PadelPlanner = () => {
  // Initial data
  const friends = ['Erik', 'Bob', 'Robert E', 'Robert ', 'Wouter', 'Benno'];
  const totalWeeks = 19;
  const startDate = new Date('2025-05-21'); // First match is now May 21st, 2025

  // State
  const [currentWeek, setCurrentWeek] = useState(1);
  // We're moving this state to CalendarView
  const [availability, setAvailability] = useState({});
  const [matches, setMatches] = useState({});
  const [results, setResults] = useState({});
  const [editingResult, setEditingResult] = useState(null);
  const [tempResult, setTempResult] = useState({ team1Score: '', team2Score: '' });
  const [view, setView] = useState('availability');
  const [loading, setLoading] = useState(true);
  const [guestPlayerPool, setGuestPlayerPool] = useState([]); // Guest player pool state

  // Load data from Firebase on mount
  useEffect(() => {
    setLoading(true);

    // Set up listeners for real-time updates
    const resultsRef = ref(db, 'results');
    const matchesRef = ref(db, 'matches');

    // Results listener
    onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setResults(data);
    }, (error) => {
      console.error("Error loading results:", error);

      // Fallback to localStorage if Firebase fails
      const savedResults = localStorage.getItem('padelResults');
      if (savedResults) {
        setResults(JSON.parse(savedResults));
      }
    });

    // Matches listener
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMatches(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading matches:", error);
      setLoading(false);

      // Fallback to localStorage if Firebase fails
      const savedMatches = localStorage.getItem('padelMatches');
      if (savedMatches) {
        setMatches(JSON.parse(savedMatches));
      }
    });

    // Cleanup listeners when component unmounts
    return () => {
      off(resultsRef);
      off(matchesRef);
    };
  }, []);

  // Save results to Firebase when they change
  useEffect(() => {
    if (!loading && Object.keys(results).length > 0) {
      set(ref(db, 'results'), results)
        .catch(error => {
          console.error("Error saving results:", error);
          // Fallback to localStorage
          localStorage.setItem('padelResults', JSON.stringify(results));
        });
    }
  }, [results, loading]);

  // Save matches to Firebase when they change
  useEffect(() => {
    if (!loading && Object.keys(matches).length > 0) {
      set(ref(db, 'matches'), matches)
        .catch(error => {
          console.error("Error saving matches:", error);
          // Fallback to localStorage
          localStorage.setItem('padelMatches', JSON.stringify(matches));
        });
    }
  }, [matches, loading]);

  // Helper functions
  const getWeekDate = (weekNumber) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (weekNumber - 1) * 7);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const getAvailableFriends = (week) => {
    return friends.filter(friend => availability[week]?.[friend] === 2);
  };

  // Handle availability updates from CalendarView
  const handleAvailabilityChange = (newAvailability) => {
    setAvailability(newAvailability);
  };

  const getPlayCount = (friend) => {
    return Object.values(matches).filter(match =>
      match.team1?.includes(friend) || match.team2?.includes(friend)
    ).length;
  };

  const getWinCount = (friend) => {
    let wins = 0;
    Object.entries(results).forEach(([week, result]) => {
      const match = matches[week];
      if (!match || !result) return;

      const team1Won = parseInt(result.team1Score) > parseInt(result.team2Score);
      if (team1Won && match.team1?.includes(friend)) wins++;
      if (!team1Won && match.team2?.includes(friend)) wins++;
    });
    return wins;
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Function to add a guest player to the available pool for team creation
  const addGuestToPool = (guestName) => {
    // Check if already in the pool
    if (guestPlayerPool.includes(guestName)) {
      alert(`${guestName} is al toegevoegd als gastspeler`);
      return;
    }

    setGuestPlayerPool(prev => [...prev, guestName]);
  };

  // Function to remove a guest from the pool
  const removeGuestFromPool = (index) => {
    setGuestPlayerPool(prev => prev.filter((_, i) => i !== index));
  };

  const createTeamsForWeek = (week) => {
    // Get all fully available players for this week
    const availablePlayers = getAvailableFriends(week);

    // Combine with guest players
    const allPlayers = [...availablePlayers, ...guestPlayerPool];

    if (allPlayers.length < 4) {
      alert('Er zijn niet genoeg beschikbare spelers voor deze week');
      return;
    }

    // Create teams, but handle guest players differently since they don't have match history
    const playerCounts = {};

    // Initialize regular friends with their counts
    friends.forEach(friend => {
      playerCounts[friend] = 0;
    });

    // Initialize guest players with 0 matches
    guestPlayerPool.forEach(guest => {
      playerCounts[guest] = 0; // Guests start with 0 matches
    });

    // Count existing matches for each player
    Object.values(matches).forEach(match => {
      [...match.team1, ...match.team2].forEach(player => {
        if (player && playerCounts[player] !== undefined) {
          playerCounts[player]++;
        }
      });
    });

    // Sort available players by match count (ascending)
    const sortedPlayers = [...allPlayers].sort((a, b) => {
      return playerCounts[a] - playerCounts[b];
    });

    // Take first 4 players with least matches
    const selectedPlayers = sortedPlayers.slice(0, 4);

    // Create two teams of 2 players each
    const newMatch = {
      team1: [selectedPlayers[0], selectedPlayers[2]],
      team2: [selectedPlayers[1], selectedPlayers[3]]
    };

    // Update matches
    setMatches(prev => ({
      ...prev,
      [week]: newMatch
    }));

    // Clear the guest player pool after creating teams
    setGuestPlayerPool([]);
  };

  const movePlayerToTeam = (week, player, fromTeam, toTeam) => {
    setMatches(prev => {
      const match = prev[week];
      if (!match) return prev;

      const newMatch = { ...match };

      // Remove player from current team
      if (fromTeam === 'team1') {
        newMatch.team1 = newMatch.team1.filter(p => p !== player);
      } else {
        newMatch.team2 = newMatch.team2.filter(p => p !== player);
      }

      // Add player to new team (if there's space)
      if (toTeam === 'team1' && newMatch.team1.length < 2) {
        newMatch.team1 = [...newMatch.team1, player];
      } else if (toTeam === 'team2' && newMatch.team2.length < 2) {
        newMatch.team2 = [...newMatch.team2, player];
      } else {
        // No space, return original
        return prev;
      }

      return { ...prev, [week]: newMatch };
    });

    // Clear any existing result for this week since teams changed
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[week];
      return newResults;
    });
  };

  const swapPlayers = (week, player1, team1, player2, team2) => {
    setMatches(prev => {
      const match = prev[week];
      if (!match) return prev;

      const newMatch = { ...match };

      // Remove both players from their teams
      newMatch.team1 = newMatch.team1.filter(p => p !== player1 && p !== player2);
      newMatch.team2 = newMatch.team2.filter(p => p !== player1 && p !== player2);

      // Add player1 to team2's original team and player2 to team1's original team
      if (team1 === 'team1') {
        newMatch.team2 = [...newMatch.team2, player1];
        newMatch.team1 = [...newMatch.team1, player2];
      } else {
        newMatch.team1 = [...newMatch.team1, player1];
        newMatch.team2 = [...newMatch.team2, player2];
      }

      return { ...prev, [week]: newMatch };
    });

    // Clear any existing result for this week since teams changed
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[week];
      return newResults;
    });
  };

  const saveResult = (week) => {
    if (!tempResult.team1Score || !tempResult.team2Score) {
      alert('Vul beide scores in');
      return;
    }

    const team1Score = parseInt(tempResult.team1Score);
    const team2Score = parseInt(tempResult.team2Score);

    if (team1Score < 0 || team2Score < 0) {
      alert('Scores moeten positief zijn');
      return;
    }

    const newResults = {
      ...results,
      [week]: { team1Score, team2Score }
    };

    setResults(newResults);
    setEditingResult(null);
    setTempResult({ team1Score: '', team2Score: '' });
  };

  const startEditingResult = (week) => {
    const existingResult = results[week];
    setTempResult({
      team1Score: existingResult?.team1Score?.toString() || '',
      team2Score: existingResult?.team2Score?.toString() || ''
    });
    setEditingResult(week);
  };

  const cancelEditingResult = () => {
    setEditingResult(null);
    setTempResult({ team1Score: '', team2Score: '' });
  };

  // Helper functions
  const getOtherTeam = (teamId) => (teamId === 'team1' ? 'team2' : 'team1');

  const handlePlayerChange = (week, teamId, playerIdx, newPlayer) => {
    setMatches(prev => {
      const match = prev[week];
      if (!match) return prev;

      // Prevent duplicate players in both teams
      const otherTeamId = getOtherTeam(teamId);
      const otherTeamPlayers = match[otherTeamId];
      if (otherTeamPlayers.includes(newPlayer) || match[teamId].includes(newPlayer)) {
        return prev;
      }

      const newMatch = { ...match };
      newMatch[teamId] = [...newMatch[teamId]];
      newMatch[teamId][playerIdx] = newPlayer;

      return { ...prev, [week]: newMatch };
    });

    // Clear any existing result for this week since teams changed
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[week];
      return newResults;
    });
  };

  // Handler for changing views
  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Add this function to your PadelPlanner component
  const addCustomPlayer = (week, teamId, playerName) => {
    // First check if the player already exists in either team for this week
    const currentMatch = matches[week] || { team1: [], team2: [] };
    const team1 = currentMatch.team1 || [];
    const team2 = currentMatch.team2 || [];

    if (team1.includes(playerName) || team2.includes(playerName)) {
      alert(`${playerName} is al toegevoegd aan deze wedstrijd`);
      return;
    }

    // Add the custom player to the specified team
    const updatedMatch = {
      ...currentMatch,
      [teamId]: [...(currentMatch[teamId] || []), playerName]
    };

    // Update the matches state
    setMatches(prev => ({
      ...prev,
      [week]: updatedMatch
    }));
  };

  const removePlayerFromMatch = (week, teamId, playerIndex) => {
    setMatches(prev => {
      const updatedMatch = { ...prev[week] };
      const updatedTeam = [...updatedMatch[teamId]];
      updatedTeam.splice(playerIndex, 1);
      updatedMatch[teamId] = updatedTeam;

      return {
        ...prev,
        [week]: updatedMatch
      };
    });
  };

  // Render functions
  const renderTeam = (team, teamName, week, teamId) => (
    <div className="p-3 bg-[rgb(120,151,178)] bg-opacity-10 rounded-lg">
      <div className="font-semibold text-[rgb(120,151,178)] mb-2">{teamName}</div>
      <div className="space-y-2">
        {team.map((player, idx) => {
          // Check if player is in the original friends list
          const isCustomPlayer = !friends.includes(player);

          return (
            <div key={idx} className="flex items-center justify-between">
              {isCustomPlayer ? (
                // Custom player display
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 border border-yellow-300 rounded w-full">
                  <span className="text-sm">{player}</span>
                  <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                    Gast
                  </span>
                  <button
                    onClick={() => removePlayerFromMatch(week, teamId, idx)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                  </button>
                </div>
              ) : (
                // Regular player dropdown
                <select
                  className="text-sm border rounded px-2 py-1 w-full"
                  value={player}
                  onChange={e => handlePlayerChange(week, teamId, idx, e.target.value)}
                >
                  <option value="">Kies speler</option>
                  {friends
                    .filter(f =>
                      // Only show players not already selected in either team for this match
                      !matches[week]?.team1.includes(f) &&
                      !matches[week]?.team2.includes(f) ||
                      f === player
                    )
                    .map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                </select>
              )}
            </div>
          );
        })}

        {/* Add empty slot if team has less than 2 players */}
        {team.length < 2 && (
          <div className="text-sm border border-dashed border-gray-300 rounded px-2 py-1 text-gray-400 text-center">
            Voeg speler toe
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-[rgb(120,151,178)]">Padelbaan Planner</h1>
          <p className="text-gray-600 mt-2">
            Woensdagen 18:30-20:00 • 2 vs 2 wedstrijden • {totalWeeks} weken totaal
          </p>
        </div>
      </header>

      <NavigationBar currentView={view} onViewChange={handleViewChange} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'availability' && (
          <AvailabilityView
            friends={friends}
            getWeekDate={getWeekDate}
            totalWeeks={totalWeeks}
            onAvailabilityChange={handleAvailabilityChange} // Pass callback for updates
          />
        )}
        {view === 'planning' && (
          <PlanningView
            currentWeek={currentWeek}
            totalWeeks={totalWeeks}
            getWeekDate={getWeekDate}
            matches={matches}
            results={results}
            renderTeam={renderTeam}
            editingResult={editingResult}
            tempResult={tempResult}
            setTempResult={setTempResult}
            startEditingResult={startEditingResult}
            cancelEditingResult={cancelEditingResult}
            saveResult={saveResult}
            setCurrentWeek={setCurrentWeek}
            availability={availability}
            getAvailableFriends={getAvailableFriends}
            createTeamsForWeek={createTeamsForWeek}
            friends={friends}
            addCustomPlayer={addCustomPlayer}
            guestPlayers={guestPlayerPool}
            addGuestToPool={addGuestToPool}
            removeGuestFromPool={removeGuestFromPool}
          />
        )}
        {view === 'stats' && (
          <StatsView
            friends={friends}
            matches={matches}
            results={results}
            getPlayCount={getPlayCount}
            getWinCount={getWinCount}
          />
        )}
        {view === 'history' && (
          <HistoryView
            matches={matches}
            results={results}
            getWeekDate={getWeekDate}
            totalWeeks={totalWeeks}
          />
        )}
      </main>
    </div>
  );
};

export default PadelPlanner;