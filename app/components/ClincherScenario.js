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
    <div className="bg-blue-50 p-3 sm:p-4 rounded-md mb-6">
      <h3 className="text-lg font-medium mb-2 text-blue-800">Earliest First Place Clinch Scenario</h3>
      
      <div className="mb-4">
        <p className="text-gray-700 text-sm sm:text-base">
          <span className="font-semibold">{teamName}</span> needs to complete these requirements by <span className="font-bold">Round {round}</span>
          {matches && matches.length > 0 && matches[0]?.date 
            ? ` (${formatMatchDate(matches[0]?.date).split(',')[0]}${matches[matches.length-1]?.date && matches[0]?.date !== matches[matches.length-1]?.date 
              ? ` - ${formatMatchDate(matches[matches.length-1]?.date).split(',')[0]}` 
              : ''})` 
            : ""}, to set up clinching in <span className="font-bold">Round {round+1}</span>
            {/* Add estimated next round date - roughly 1 week after current round */}
            {matches && matches.length > 0 && matches[0]?.date 
              ? (() => {
                  const lastMatchDate = new Date(matches[matches.length-1]?.date || matches[0]?.date);
                  const nextRoundDate = new Date(lastMatchDate);
                  nextRoundDate.setDate(nextRoundDate.getDate() + 7); // Assuming 1 week between rounds
                  return ` (${formatMatchDate(nextRoundDate).split(',')[0]})`;
                })()
              : ""}
            .
        </p>
        
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Current points: <span className="font-medium">{currentPoints}</span> | 
          Points needed: <span className="font-medium">{pointsNeeded}</span> | 
          Points to gain: <span className="font-medium">{pointsToGain}</span>
        </p>
        {scenario.needsOneMoreResult && !scenario.canClinchMathematically && (
          <p className="mt-2 text-xs sm:text-sm text-blue-700 bg-blue-50 p-2 border border-blue-100 rounded">
            <span className="font-semibold">Note:</span> This scenario requires results from earlier rounds to create a sufficient points gap. 
            Then, either {teamName} needs a positive result in this round, or the nearest competitor needs to drop points.
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm sm:text-md font-medium mb-2 text-blue-700">
          Required Results in Round {round}
        </h4>
        <div className="bg-white rounded-md border border-blue-100 divide-y divide-blue-100">
          {requiredResults.map((result, index) => (
            <div key={index} className="px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex flex-col mb-2 sm:mb-0">
                  <div className="flex items-center">
                    <span className={`font-medium text-sm ${result.match.homeTeam === teamName ? 'text-blue-600' : 'text-gray-800'}`}>
                      {result.match.homeTeam}
                    </span>
                    <span className="mx-2 text-gray-500">vs</span>
                    <span className={`font-medium text-sm ${result.match.awayTeam === teamName ? 'text-blue-600' : 'text-gray-800'}`}>
                      {result.match.awayTeam}
                    </span>
                  </div>
                  {result.match.date && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatMatchDate(result.match.date)}
                    </div>
                  )}
                </div>
                <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-700 inline-block">
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
          <h4 className="text-sm sm:text-md font-medium mb-2 text-blue-700">
            Key Fixtures from Earlier Rounds
          </h4>
          
          {Object.keys(keyFixturesByRound).sort((a, b) => parseInt(a) - parseInt(b)).map(roundNum => (
            <div key={roundNum} className="mb-3">
              <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Round {roundNum}</h5>
              <div className="bg-white rounded-md border border-blue-100 divide-y divide-blue-100">
                {keyFixturesByRound[roundNum]
                  // Sort to prioritize matches involving our team first, then threat teams
                  .sort((a, b) => {
                    const aInvolvesOurTeam = a.match.homeTeam === teamName || a.match.awayTeam === teamName;
                    const bInvolvesOurTeam = b.match.homeTeam === teamName || b.match.awayTeam === teamName;
                    
                    if (aInvolvesOurTeam && !bInvolvesOurTeam) return -1;
                    if (!aInvolvesOurTeam && bInvolvesOurTeam) return 1;
                    return 0;
                  })
                  .map((fixture, index) => {
                    // Check if this match involves our team
                    const involvesOurTeam = fixture.match.homeTeam === teamName || fixture.match.awayTeam === teamName;
                    
                    return (
                      <div key={index} className={`px-3 py-2 sm:px-4 sm:py-3 ${involvesOurTeam ? 'bg-blue-50' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex flex-col mb-2 sm:mb-0">
                            <div className="flex items-center">
                              <span className={`font-medium text-sm ${fixture.match.homeTeam === teamName ? 'text-blue-600' : 'text-gray-800'}`}>
                                {fixture.match.homeTeam}
                              </span>
                              <span className="mx-1 sm:mx-2 text-gray-500">vs</span>
                              <span className={`font-medium text-sm ${fixture.match.awayTeam === teamName ? 'text-blue-600' : 'text-gray-800'}`}>
                                {fixture.match.awayTeam}
                              </span>
                            </div>
                            {fixture.match.date && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatMatchDate(fixture.match.date)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center">
                            {involvesOurTeam && (
                              <span className="text-xs px-2 py-1 mr-2 rounded-full bg-blue-100 text-blue-800">
                                Your match
                              </span>
                            )}
                            <span className={`text-xs sm:text-sm px-2 py-1 rounded-full 
                              ${involvesOurTeam 
                                ? 'bg-blue-200 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'}`}>
                              {formatResult(fixture.result)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {fixture.explanation}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show a message if key fixtures should exist but grouping failed */}
      {keyFixtures && keyFixtures.length > 0 && !hasKeyFixtures && (
        <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-100 rounded-md mb-4">
          <p className="text-xs sm:text-sm text-yellow-800">
            {keyFixtures.length} key fixtures from earlier rounds exist but couldn't be displayed correctly.
            This may be due to how rounds are structured in the data.
          </p>
        </div>
      )}
      
      {/* Add clinching day explanation */}
      <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md mb-4">
        <h4 className="text-sm sm:text-md font-semibold text-green-800 mb-2">How {teamName} Can Clinch the Title</h4>
        
        <p className="text-xs sm:text-sm text-green-700 mb-3">
          Assuming all prior matches go as shown above, {teamName} could clinch the title on matchday {round+1}
          {matches && matches.length > 0 && matches[0]?.date 
            ? (() => {
                const lastMatchDate = new Date(matches[matches.length-1]?.date || matches[0]?.date);
                const nextRoundDate = new Date(lastMatchDate);
                nextRoundDate.setDate(nextRoundDate.getDate() + 7); // Assuming 1 week between rounds
                return ` (${formatMatchDate(nextRoundDate).split(',')[0]})`;
              })()
            : ""} in one of these ways:
        </p>
        
        {scenario.threatCompetitors && scenario.threatCompetitors.length > 0 && (
          <div className="bg-white rounded-md border border-green-100 mb-3">
            <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-green-100">
              <p className="font-medium text-sm text-gray-800">Scenario 1:</p>
              <p className="text-xs sm:text-sm text-gray-700">
                If {scenario.threatCompetitors[0]} {scenario.threatCompetitors.length > 1 ? '(or other threats)' : ''} loses or draws their match, 
                {teamName} will clinch the title regardless of their own result.
              </p>
            </div>
            
            <div className="px-3 py-2 sm:px-4 sm:py-3">
              <p className="font-medium text-sm text-gray-800">Scenario 2:</p>
              <p className="text-xs sm:text-sm text-gray-700">
                If all title threats win their matches, {teamName} will need at least a draw in their own match to clinch.
              </p>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-600">
          This clinching scenario requires {teamName} to have built up a sufficient points advantage 
          through the results of earlier fixtures shown above.
        </p>
      </div>
      
      {/* Add clarifying information */}
      {scenario.threatCompetitors && scenario.threatCompetitors.length > 0 && (
        <div className="p-2 sm:p-3 mb-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-xs sm:text-sm text-blue-800">
            <span className="font-semibold">Main title threat{scenario.threatCompetitors.length > 1 ? 's' : ''}:</span> {scenario.threatCompetitors.join(', ')}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Only fixtures involving {teamName} and these teams are shown as they're most relevant to the title race.
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Note: This scenario assumes all earlier rounds play out optimally for {teamName}.
      </p>
    </div>
  );
} 