'use client';

export default function StandingsTable({ teams, highlightTeam, remainingMatches }) {
  // Sort teams by points, goal difference, goals for
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Calculate remaining matches for each team if provided
  const getTeamRemainingMatches = (teamName) => {
    if (!remainingMatches) return null;
    
    return remainingMatches.filter(match => 
      match.homeTeam === teamName || match.awayTeam === teamName
    ).length;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pos
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              P
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              W
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              D
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              L
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              GF
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              GA
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              GD
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pts
            </th>
            {remainingMatches && (
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                RM
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTeams.map((team, index) => (
            <tr 
              key={team.name} 
              className={team.name === highlightTeam ? 'bg-blue-50' : ''}
            >
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                {index + 1}
              </td>
              <td className="px-6 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {team.name}
                    {team.name === highlightTeam && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.played}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.won}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.drawn}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.lost}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.goalsFor}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.goalsAgainst}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                {team.points}
              </td>
              {remainingMatches && (
                <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                  {getTeamRemainingMatches(team.name)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 