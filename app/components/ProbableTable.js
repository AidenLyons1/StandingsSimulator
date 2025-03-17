'use client';

export default function ProbableTable({ projectedTable, highlightTeam }) {
  // Function to determine position change icon and color
  const getPositionChange = (currentPos, projectedPos) => {
    const diff = currentPos - projectedPos;
    
    if (diff > 0) {
      // Moving up in the table (improvement)
      return {
        icon: '↑',
        color: 'text-green-600',
        diff: diff
      };
    } else if (diff < 0) {
      // Moving down in the table (decline)
      return {
        icon: '↓',
        color: 'text-red-600',
        diff: Math.abs(diff)
      };
    } else {
      // Same position
      return {
        icon: '→',
        color: 'text-gray-500',
        diff: 0
      };
    }
  };
  
  // Helper to determine the background color for the table row
  const getBackgroundColor = (teamName) => {
    if (teamName === highlightTeam) {
      return 'bg-blue-50';
    }
    return '';
  };
  
  // Helper to determine the shade of the probability cell
  const getProbabilityClass = (probability) => {
    const prob = parseFloat(probability);
    if (prob >= 75) return 'bg-green-100 text-green-800';
    if (prob >= 50) return 'bg-blue-100 text-blue-800';
    if (prob >= 25) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-medium mb-2">Projected End-of-Season Table</h3>
      <p className="text-sm text-gray-500 mb-4">
        Based on Monte Carlo simulation of remaining matches
      </p>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pos
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Pos
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change
            </th>
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Projected Pts
            </th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Probability
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projectedTable.map((team, index) => {
            const posChange = getPositionChange(team.currentPosition, team.projectedPosition);
            
            return (
              <tr key={team.name} className={getBackgroundColor(team.name)}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {team.name}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {team.currentPosition}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-sm ${posChange.color} text-center font-medium`}>
                  {posChange.icon} {posChange.diff > 0 ? posChange.diff : ''}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">
                  {team.projectedPoints}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${getProbabilityClass(team.probability)}`}>
                    {team.probability}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <p className="mt-3 text-xs text-gray-500">
        *Probability represents the likelihood of each team finishing in their projected position
      </p>
    </div>
  );
} 