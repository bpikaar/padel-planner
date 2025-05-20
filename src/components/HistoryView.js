import React from 'react';
import { Clock } from 'lucide-react';

const HistoryView = ({
  matches,
  results,
  getWeekDate,
  totalWeeks
}) => {
  // Get completed matches (those with results)
  const completedMatches = Object.keys(results)
    .map(weekNum => ({
      week: parseInt(weekNum),
      teams: matches[weekNum] || { team1: [], team2: [] },
      result: results[weekNum]
    }))
    .filter(match => match.result?.team1Score !== undefined && match.result?.team2Score !== undefined)
    .sort((a, b) => b.week - a.week); // Sort by week descending (most recent first)

  if (completedMatches.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex items-center mb-4 text-blue-800">
          <Clock size={24} className="mr-2" />
          <h2 className="text-xl font-bold">Geschiedenis</h2>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          Nog geen gespeelde wedstrijden
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center mb-4 text-blue-800">
        <Clock size={24} className="mr-2" />
        <h2 className="text-xl font-bold">Geschiedenis</h2>
      </div>

      <div className="space-y-4">
        {completedMatches.map(match => (
          <div key={match.week} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Week {match.week}</h3>
              <span className="text-sm text-gray-500">{getWeekDate(match.week)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Team 1 */}
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="font-medium text-blue-800 mb-1">Team 1</div>
                <ul>
                  {match.teams.team1?.map((player, idx) => (
                    <li key={idx}>{player}</li>
                  ))}
                </ul>
              </div>

              {/* Results */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {match.result.team1Score} - {match.result.team2Score}
                  </div>
                  <div className="text-sm text-gray-500">
                    {match.result.team1Score > match.result.team2Score
                      ? "Team 1 wint"
                      : match.result.team2Score > match.result.team1Score
                      ? "Team 2 wint"
                      : "Gelijkspel"}
                  </div>
                </div>
              </div>

              {/* Team 2 */}
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="font-medium text-blue-800 mb-1">Team 2</div>
                <ul>
                  {match.teams.team2?.map((player, idx) => (
                    <li key={idx}>{player}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;