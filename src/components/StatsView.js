import React from 'react';
import { BarChart3, Trophy } from 'lucide-react';

const StatsView = ({ friends, matches, results, getPlayCount, getWinCount }) => {
  // Sort friends by win count (descending)
  const sortedFriends = [...friends].sort((a, b) => getWinCount(b) - getWinCount(a));

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Play count stats */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-4 text-blue-800">
            <BarChart3 size={20} className="mr-2" />
            <h2 className="text-lg font-bold">Aantal gespeeld</h2>
          </div>
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend} className="flex justify-between items-center">
                <span>{friend}</span>
                <div className="flex items-center">
                  <span className="font-medium">{getPlayCount(friend)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Win count stats */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-4 text-blue-800">
            <Trophy size={20} className="mr-2" />
            <h2 className="text-lg font-bold">Aantal gewonnen</h2>
          </div>
          <div className="space-y-2">
            {sortedFriends.map(friend => (
              <div key={friend} className="flex justify-between items-center">
                <span>{friend}</span>
                <div className="flex items-center">
                  <span className="font-medium">{getWinCount(friend)}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({getPlayCount(friend) > 0 
                      ? Math.round((getWinCount(friend) / getPlayCount(friend)) * 100) 
                      : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;