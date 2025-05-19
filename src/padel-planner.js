import React, { useState, useEffect } from 'react';
import { Calendar, Users, BarChart3, Trophy, Target, Edit2, Save, X } from 'lucide-react';

const PadelPlanner = () => {
  // Initial data
  const friends = ['Erik', 'Bob', 'Robert E', 'Robert ', 'Wouter', 'Benno'];
  const totalWeeks = 19;
  const startDate = new Date('2025-05-21'); // First match is now May 21st, 2025

  // State
  const [currentWeek, setCurrentWeek] = useState(1);
  const [availability, setAvailability] = useState({});
  const [matches, setMatches] = useState({}); // Changed from assignments to matches
  const [results, setResults] = useState({});
  const [editingResult, setEditingResult] = useState(null);
  const [tempResult, setTempResult] = useState({ team1Score: '', team2Score: '' });
  const [view, setView] = useState('planning'); // 'planning', 'stats', 'calendar', 'history'

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAvailability = localStorage.getItem('padelAvailability');
    const savedMatches = localStorage.getItem('padelMatches');
    const savedResults = localStorage.getItem('padelResults');

    if (savedAvailability) {
      setAvailability(JSON.parse(savedAvailability));
    }
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('padelAvailability', JSON.stringify(availability));
  }, [availability]);

  useEffect(() => {
    localStorage.setItem('padelMatches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('padelResults', JSON.stringify(results));
  }, [results]);

  // Helper functions
  const getWeekDate = (weekNumber) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (weekNumber - 1) * 7);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const toggleAvailability = (week, friend) => {
    setAvailability(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [friend]: !prev[week]?.[friend]
      }
    }));
  };

  const getAvailableFriends = (week) => {
    return friends.filter(friend => availability[week]?.[friend]);
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

  const createTeamsForWeek = (week) => {
    const available = getAvailableFriends(week);
    if (available.length < 4) {
      alert(`Niet genoeg spelers beschikbaar (${available.length}/4)`);
      return;
    }
    if (available.length > 4) {
      // Fair distribution algorithm
      const playCounts = available.map(friend => ({
        friend,
        count: getPlayCount(friend)
      }));

      // Sort by play count (ascending) and then randomly
      playCounts.sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        return Math.random() - 0.5;
      });

      available.length = 4;
      available.splice(0, 4, ...playCounts.slice(0, 4).map(item => item.friend));
    }

    // Create balanced teams
    const shuffled = shuffleArray(available);
    const team1 = [shuffled[0], shuffled[1]];
    const team2 = [shuffled[2], shuffled[3]];

    setMatches(prev => ({
      ...prev,
      [week]: { team1, team2 }
    }));

    // Clear any existing result for this week
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[week];
      return newResults;
    });
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

    setResults(prev => ({
      ...prev,
      [week]: { team1Score, team2Score }
    }));

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

  // Render functions
  const renderTeam = (team, teamName, week, teamId) => (
    <div className="p-3 bg-blue-50 rounded-lg">
      <div className="font-semibold text-blue-800 mb-2">{teamName}</div>
      <div className="space-y-2">
        {team.map((player, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <select
              className="text-sm border rounded px-2 py-1"
              value={player}
              onChange={e => handlePlayerChange(week, teamId, idx, e.target.value)}
            >
              <option value="">Kies speler</option>
              {friends
                .filter(f =>
                  // Only show players not already selected in either team for this match
                  !matches[week].team1.includes(f) &&
                  !matches[week].team2.includes(f) ||
                  f === player
                )
                .map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlanning = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Week {currentWeek} Planning</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            disabled={currentWeek === 1}
          >
            ←
          </button>
          <span className="px-3 py-1 bg-blue-100 rounded">
            {getWeekDate(currentWeek)}
          </span>
          <button
            onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            disabled={currentWeek === totalWeeks}
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Availability */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Beschikbaarheid</h3>
          <div className="space-y-2">
            {friends.map(friend => (
              <label key={friend} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability[currentWeek]?.[friend] || false}
                  onChange={() => toggleAvailability(currentWeek, friend)}
                  className="w-4 h-4"
                />
                <span>{friend}</span>
                <span className="text-sm text-gray-500">
                  ({getPlayCount(friend)}x)
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={() => createTeamsForWeek(currentWeek)}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={getAvailableFriends(currentWeek).length < 4}
          >
            Maak Teams ({getAvailableFriends(currentWeek).length}/4)
          </button>
        </div>

        {/* Match */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Wedstrijd</h3>
          {matches[currentWeek] ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {renderTeam(matches[currentWeek].team1, 'Team 1', currentWeek, 'team1')}
                {renderTeam(matches[currentWeek].team2, 'Team 2', currentWeek, 'team2')}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">VS</div>
                <div className="text-xs text-gray-500 mt-2">
                  Gebruik ↔ om spelers te verplaatsen en ⇄ om te wisselen
                </div>
              </div>
              <button
                onClick={() => createTeamsForWeek(currentWeek)}
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 text-sm"
              >
                🔀 Nieuwe Random Teams
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Nog geen teams gemaakt voor deze week
            </div>
          )}
        </div>

        {/* Result */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Resultaat</h3>
          {matches[currentWeek] ? (
            <div className="space-y-4">
              {editingResult === currentWeek ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Team 1 Score</label>
                      <input
                        type="number"
                        min="0"
                        value={tempResult.team1Score}
                        onChange={(e) => setTempResult(prev => ({ ...prev, team1Score: e.target.value }))}
                        className="w-full p-2 border rounded"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Team 2 Score</label>
                      <input
                        type="number"
                        min="0"
                        value={tempResult.team2Score}
                        onChange={(e) => setTempResult(prev => ({ ...prev, team2Score: e.target.value }))}
                        className="w-full p-2 border rounded"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveResult(currentWeek)}
                      className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Opslaan
                    </button>
                    <button
                      onClick={cancelEditingResult}
                      className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : results[currentWeek] ? (
                <div className="space-y-4">
                  <div className="text-center bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold">
                      {results[currentWeek].team1Score} - {results[currentWeek].team2Score}
                    </div>
                    {results[currentWeek].team1Score > results[currentWeek].team2Score ? (
                      <div className="text-green-600 font-semibold mt-2">Team 1 Wint!</div>
                    ) : results[currentWeek].team1Score < results[currentWeek].team2Score ? (
                      <div className="text-green-600 font-semibold mt-2">Team 2 Wint!</div>
                    ) : (
                      <div className="text-yellow-600 font-semibold mt-2">Gelijkspel!</div>
                    )}
                  </div>
                  <button
                    onClick={() => startEditingResult(currentWeek)}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Bewerk Resultaat
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-500 text-center py-4">
                    Nog geen resultaat ingevuld
                  </div>
                  <button
                    onClick={() => startEditingResult(currentWeek)}
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Voeg Resultaat Toe
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Maak eerst teams aan
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistieken</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Play frequency */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Speelfrequentie</h3>
          <div className="space-y-4">
            {friends.map(friend => {
              const count = getPlayCount(friend);
              const percentage = totalWeeks > 0 ? (count / totalWeeks * 100).toFixed(1) : 0;
              return (
                <div key={friend} className="flex items-center justify-between">
                  <span className="font-medium">{friend}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (count / (totalWeeks * 0.7)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16">
                      {count}x ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Win statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Win/Verlies Statistieken</h3>
          <div className="space-y-4">
            {friends.map(friend => {
              const playCount = getPlayCount(friend);
              const winCount = getWinCount(friend);
              const winRate = playCount > 0 ? ((winCount / playCount) * 100).toFixed(1) : 0;
              return (
                <div key={friend} className="flex items-center justify-between">
                  <span className="font-medium">{friend}</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {winCount}W - {playCount - winCount}L
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {winRate}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Planning Overzicht</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
          <div key={week} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Week {week}</h3>
              <span className="text-sm text-gray-500">{getWeekDate(week)}</span>
            </div>
            {matches[week] ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  Team 1: {matches[week].team1.join(', ')}
                </div>
                <div className="text-xs text-gray-600">
                  Team 2: {matches[week].team2.join(', ')}
                </div>
                {results[week] && (
                  <div className="text-sm font-semibold text-center p-2 bg-gray-50 rounded">
                    {results[week].team1Score} - {results[week].team2Score}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                Nog niet ingepland
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => {
    const playedMatches = Object.entries(matches)
      .filter(([week]) => results[week])
      .map(([week, match]) => ({ week: parseInt(week), match, result: results[week] }))
      .sort((a, b) => b.week - a.week);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Wedstrijd Geschiedenis</h2>
        {playedMatches.length > 0 ? (
          <div className="space-y-4">
            {playedMatches.map(({ week, match, result }) => (
              <div key={week} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Week {week}</h3>
                  <span className="text-sm text-gray-500">{getWeekDate(week)}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600 mb-1">Team 1</div>
                    <div className="text-sm space-y-1">
                      {match.team1.map(player => (
                        <div key={player}>{player}</div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {result.team1Score} - {result.team2Score}
                    </div>
                    {result.team1Score > result.team2Score ? (
                      <div className="text-green-600 font-semibold">Team 1 Wint</div>
                    ) : result.team1Score < result.team2Score ? (
                      <div className="text-green-600 font-semibold">Team 2 Wint</div>
                    ) : (
                      <div className="text-yellow-600 font-semibold">Gelijkspel</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600 mb-1">Team 2</div>
                    <div className="text-sm space-y-1">
                      {match.team2.map(player => (
                        <div key={player}>{player}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nog geen wedstrijden gespeeld</h3>
            <p className="text-gray-500">Begin met het plannen van teams en het invoeren van resultaten!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Padelbaan Planner</h1>
          <p className="text-gray-600 mt-2">
            Woensdagen 18:30-20:00 • 2 vs 2 wedstrijden • {totalWeeks} weken totaal
          </p>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'planning', label: 'Planning', icon: Calendar },
              { id: 'stats', label: 'Statistieken', icon: BarChart3 },
              { id: 'calendar', label: 'Overzicht', icon: Users },
              { id: 'history', label: 'Geschiedenis', icon: Trophy }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 ${view === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'planning' && renderPlanning()}
        {view === 'stats' && renderStats()}
        {view === 'calendar' && renderCalendar()}
        {view === 'history' && renderHistory()}
      </main>
    </div>
  );
};

export default PadelPlanner;