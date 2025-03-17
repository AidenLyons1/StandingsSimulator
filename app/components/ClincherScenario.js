'use client';

export default function ClincherScenario({ scenario, teamName }) {
  if (!scenario) {
    return (
      <div className="bg-gray-50 p-4 rounded-md mb-4">
        <h3 className="text-lg font-medium mb-2">First Place Clinching Scenario</h3>
        <p className="text-gray-500">
          No clinching scenario could be determined. This could be because:
        </p>
        <ul className="list-disc ml-5 mt-2 text-gray-500">
          <li>The team is mathematically eliminated from finishing first</li>
          <li>There are too many complex interdependencies between teams</li>
          <li>The team needs to win all remaining matches and is dependent on other teams' results</li>
        </ul>
      </div>
    );
  }

  const { round, pointsNeeded, currentPoints, pointsToGain, requiredResults, matches, keyFixtures } = scenario;
  
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
  
  // Debug logging
  console.log("Clinch scenario data:", {
    round,
    pointsNeeded,
    keyFixtures: keyFixtures || [],
    keyFixturesLength: keyFixtures ? keyFixtures.length : 0
  });
  
  // Group key fixtures by round
  const keyFixturesByRound = {};
  if (keyFixtures && keyFixtures.length > 0) {
    console.log("Key fixtures found:", keyFixtures.length);
    
    keyFixtures.forEach(fixture => {
      // Ensure round is stored as a string for consistency
      const roundKey = String(fixture.round);
      if (!keyFixturesByRound[roundKey]) {
        keyFixturesByRound[roundKey] = [];
      }
      keyFixturesByRound[roundKey].push(fixture);
    });
    
    console.log("Key fixtures by round:", Object.keys(keyFixturesByRound).length, keyFixturesByRound);
  } else {
    console.log("No key fixtures found");
  }

  // Format the explanation of the required results
  const formatResult = (result) => {
    switch (result) {
      case 'home_win':
        return 'Home team must win';
      case 'away_win':
        return 'Away team must win';
      case 'draw':
        return 'Teams must draw';
      case 'home_win_or_draw':
        return 'Home team must win or draw';
      case 'away_win_or_draw':
        return 'Away team must win or draw';
      default:
        return 'Result needed';
    }
  };
  
  // Check if we have any key fixtures to show
  const hasKeyFixtures = keyFixtures && 
                         keyFixtures.length > 0 && 
                         Object.keys(keyFixturesByRound).length > 0;

  return (
    <div className="bg-blue-50 p-4 rounded-md mb-6">
      <h3 className="text-lg font-medium mb-2 text-blue-800">Earliest First Place Clinch Scenario</h3>
      
      <div className="mb-4">
        <p className="text-gray-700">
          <span className="font-semibold">{teamName}</span> could clinch first place as early as <span className="font-bold">Round {round}</span>.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Current points: <span className="font-medium">{currentPoints}</span> | 
          Points needed: <span className="font-medium">{pointsNeeded}</span> | 
          Points to gain: <span className="font-medium">{pointsToGain}</span>
        </p>
      </div>
      
      <div className="mb-4">
        <h4 className="text-md font-medium mb-2 text-blue-700">
          Required Results in Round {round}
        </h4>
        <div className="bg-white rounded-md border border-blue-100 divide-y divide-blue-100">
          {requiredResults.map((result, index) => (
            <div key={index} className="px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className={`font-medium ${result.match.homeTeam === teamName ? 'text-blue-600' : 'text-gray-800'}`}>
                      {result.match.homeTeam}
                    </span>
                    <span className="mx-2 text-gray-500">vs</span>
                    <span className={`font-medium ${result.match.awayTeam === teamName ? 'text-blue-600' : 'text-gray-800'}`}>
                      {result.match.awayTeam}
                    </span>
                  </div>
                  {result.match.date && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatMatchDate(result.match.date)}
                    </div>
                  )}
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {formatResult(result.result)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Show key fixtures from earlier rounds */}
      {hasKeyFixtures && (
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2 text-blue-700">
            Key Fixtures from Earlier Rounds
          </h4>
          
          {Object.keys(keyFixturesByRound).sort((a, b) => parseInt(a) - parseInt(b)).map(roundNum => (
            <div key={roundNum} className="mb-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Round {roundNum}</h5>
              <div className="bg-white rounded-md border border-blue-100 divide-y divide-blue-100">
                {keyFixturesByRound[roundNum].map((fixture, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800">
                          {fixture.match.homeTeam}
                        </span>
                        <span className="mx-2 text-gray-500">vs</span>
                        <span className="font-medium text-gray-800">
                          {fixture.match.awayTeam}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {fixture.importance === 'high' && (
                          <span className="text-xs px-2 py-1 mr-2 rounded-full bg-red-100 text-red-800">
                            High impact
                          </span>
                        )}
                        <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {formatResult(fixture.result)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {fixture.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show a message if key fixtures should exist but grouping failed */}
      {keyFixtures && keyFixtures.length > 0 && !hasKeyFixtures && (
        <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md mb-4">
          <p className="text-sm text-yellow-800">
            {keyFixtures.length} key fixtures from earlier rounds exist but couldn't be displayed correctly.
            This may be due to how rounds are structured in the data.
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Note: This scenario assumes all earlier rounds play out optimally for {teamName}.
      </p>
    </div>
  );
} 