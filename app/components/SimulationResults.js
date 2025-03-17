'use client';
import ClincherScenario from './ClincherScenario';
import ProbableTable from './ProbableTable';

export default function SimulationResults({ results }) {
  const { 
    teamName, 
    targetPosition, 
    results: simulationResults, 
    method, 
    remainingMatches, 
    isLiveData, 
    clinchScenario,
    projectedTable
  } = results;
  
  // Determine if this is Monte Carlo or exact simulation
  const isMonteCarlo = method === 'monteCarlo';
  
  // Format percentage with 2 decimal places
  const formatPercentage = (value) => {
    return (value).toFixed(2) + '%';
  };
  
  // Helper function to safely format numbers with locale string
  const safeToLocaleString = (value) => {
    return value !== undefined ? value.toLocaleString() : '0';
  };
  
  // Format date to show day, month and time
  const formatMatchDate = (date) => {
    if (!date) return 'TBD';
    
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Summary</h3>
        <p>
          <span className="font-semibold">{teamName}</span> has a {' '}
          <span className="font-bold text-blue-600">
            {formatPercentage(simulationResults.probability)}
          </span> {' '}
          chance of finishing in position {targetPosition}.
        </p>
        
        {!isMonteCarlo && simulationResults.totalValidWays !== undefined && (
          <p className="mt-2 text-sm text-gray-600">
            There are {safeToLocaleString(simulationResults.totalValidWays)} valid outcome combinations 
            out of {safeToLocaleString(simulationResults.totalPossible)} possible combinations.
          </p>
        )}
        
        {isMonteCarlo && simulationResults.iterations !== undefined && (
          <p className="mt-2 text-sm text-gray-600">
            Based on {safeToLocaleString(simulationResults.iterations)} simulated scenarios, {' '}
            {safeToLocaleString(simulationResults.successCount)} scenarios resulted in the desired outcome.
          </p>
        )}
        
        {isLiveData && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Using live {results.leagueName} data
          </div>
        )}
      </div>
      
      {targetPosition === 1 && (
        <ClincherScenario scenario={clinchScenario} teamName={teamName} />
      )}
      
      {/* Projected End-of-Season Table */}
      {projectedTable && projectedTable.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <ProbableTable projectedTable={projectedTable} highlightTeam={teamName} />
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium mb-3">
          Remaining Matches for {teamName} 
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({remainingMatches ? remainingMatches.length : 0} matches)
          </span>
        </h3>
        {remainingMatches && remainingMatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Round
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Home Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    vs
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Away Team
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {remainingMatches.map((match, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {match.roundInfo?.round || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatMatchDate(match.date)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${match.homeTeam === teamName ? 'text-blue-600' : 'text-gray-900'}`}>
                      {match.homeTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      vs
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${match.awayTeam === teamName ? 'text-blue-600' : 'text-gray-900'}`}>
                      {match.awayTeam}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No remaining matches found.</p>
        )}
      </div>
      
      {!isMonteCarlo && simulationResults.validOutcomes && simulationResults.validOutcomes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Valid Outcome Combinations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {simulationResults.validOutcomes.map((outcome, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Scenario {index + 1}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {
                      (outcome.wins + outcome.draws + outcome.losses) === 0 
                        ? '0 matches' 
                        : `${outcome.wins + outcome.draws + outcome.losses} matches`
                    }
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-green-600">Wins:</span>
                    <span className="font-semibold">{outcome.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Draws:</span>
                    <span className="font-semibold">{outcome.draws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Losses:</span>
                    <span className="font-semibold">{outcome.losses}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                    <span className="font-medium">Points:</span>
                    <span className="font-bold">
                      {outcome.wins * 3 + outcome.draws * 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          {method === 'exact' 
            ? 'Calculation method: Exact (all possible combinations evaluated)' 
            : 'Calculation method: Monte Carlo simulation (statistical approximation)'}
        </p>
      </div>
    </div>
  );
} 