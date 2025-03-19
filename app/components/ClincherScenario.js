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

  const { round, clinchingRound, pointsNeeded, currentPoints, pointsToGain, requiredResults, matches, keyFixtures } = scenario;
  
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
  
  // Format date for display in the UI (e.g., "April 13")
  const formatDisplayDate = (date) => {
    if (!date) return 'TBD';
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date(date);
    const month = months[d.getMonth()];
    const day = d.getDate();
    return `${month} ${day}`;
  };
  
  // Format round for display
  const formatRoundDisplay = (roundStr) => {
    if (!roundStr) return '';
    
    // If it's already in Month Day format (e.g., "Apr 13"), convert to full month name
    if (typeof roundStr === 'string' && roundStr.match(/[A-Za-z]+\s\d+/)) {
      const [monthAbbr, day] = roundStr.split(' ');
      const monthMap = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
      };
      return monthMap[monthAbbr] ? `${monthMap[monthAbbr]} ${day}` : roundStr;
    }
    
    return roundStr;
  };
  
  // Debug logging
  console.log("Clinch scenario data:", {
    round,
    clinchingRound,
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

  // Get display names for rounds
  const displayRound = round;
  const displayClinchingRound = clinchingRound || (typeof round === 'number' ? round + 1 : round);

  return (
    <div className="bg-blue-50 p-3 sm:p-4 rounded-md mb-6">
      <h3 className="text-lg font-medium mb-2 text-blue-800">Earliest First Place Clinch Scenario</h3>
      
      <div className="mb-4">
        <p className="text-gray-700 text-sm sm:text-base">
          <span className="font-semibold">{teamName}</span> needs to complete these requirements by <span className="font-bold">{formatRoundDisplay(displayRound)}</span>.
        </p>
        
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {(() => {
            // Calculate actual points from required wins
            const teamWinsInRequiredResults = requiredResults.filter(result => 
              (result.match.homeTeam === teamName && result.result === 'home_win') ||
              (result.match.awayTeam === teamName && result.result === 'away_win')
            ).length;
            
            const teamWinsInKeyFixtures = keyFixtures ? keyFixtures.filter(fixture => 
              (fixture.match.homeTeam === teamName && fixture.result === 'home_win') ||
              (fixture.match.awayTeam === teamName && fixture.result === 'away_win')
            ).length : 0;
            
            const totalRequiredWins = teamWinsInRequiredResults + teamWinsInKeyFixtures;
            const pointsFromRequiredWins = totalRequiredWins * 3;
            
            // If there's a discrepancy, show both calculations
            if (pointsFromRequiredWins !== pointsToGain && totalRequiredWins > 0) {
              return (
                <>
                  Current points: <span className="font-medium">{currentPoints}</span> | 
                  Minimum points needed: <span className="font-medium">{pointsNeeded}</span> | 
                  Points to gain: <span className="font-medium">{pointsToGain}</span>
                  <div className="mt-1">
                    <span className="text-blue-600">Note:</span> The scenario shows {totalRequiredWins} required wins ({pointsFromRequiredWins} points)
                    which is the optimal path to clinching.
                  </div>
                </>
              );
            }
            
            // Default case with no discrepancy
            return (
              <>
                Current points: <span className="font-medium">{currentPoints}</span> | 
                Points needed: <span className="font-medium">{pointsNeeded}</span> | 
                Points to gain: <span className="font-medium">{pointsToGain}</span>
              </>
            );
          })()}
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
          Required Results in {formatRoundDisplay(displayRound)}
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
      
      {/* Add clinching day explanation - moved up */}
      <div className="mt-4 mb-4">
        <h4 className="text-md font-medium mb-2 text-blue-700">
          How {teamName} Can Clinch the Title
        </h4>
        
        <div className="bg-white rounded-md border border-blue-100 p-3 mb-2">
          {scenario.canClinchInCurrentRound ? (
            <p className="text-sm text-gray-700">
              Assuming all prior matches go as shown below, {teamName} could clinch the title on {formatRoundDisplay(displayRound)} with a win or draw in their match.
            </p>
          ) : (
            <p className="text-sm text-gray-700">
              Assuming all prior matches go as shown below, {teamName} could clinch the title on {formatRoundDisplay(displayClinchingRound)} in one of these ways:
            </p>
          )}
          
          {!scenario.canClinchInCurrentRound && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Scenario 1:</p>
                <p className="text-sm text-gray-600 ml-4">
                  If {scenario.threatCompetitors && scenario.threatCompetitors.length > 0 ? 
                      `${scenario.threatCompetitors[0]}${scenario.threatCompetitors.length > 1 ? ' (or other threats)' : ''}` : 
                      'competitors'} lose or draw their matches, {teamName} will clinch the title regardless of their own result.
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Scenario 2:</p>
                <p className="text-sm text-gray-600 ml-4">
                  If all title threats win their matches, {teamName} will need at least a draw in their own match to clinch.
                </p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-3">
            This clinching scenario requires {teamName} to have built up a sufficient points advantage through the results of earlier fixtures shown above.
          </p>
          
          {clinchingRound && scenario.matches && (
            <div className="text-xs text-gray-500 mt-2">
              The clinching match would be 
              {(() => {
                // Find matches in the clinching round that involve our team
                let clinchingMatches = scenario.matches.filter(
                  match => match.roundInfo && match.roundInfo.round === clinchingRound &&
                  (match.homeTeam === teamName || match.awayTeam === teamName)
                );
                
                // If we couldn't find by roundInfo, try using dates
                if (clinchingMatches.length === 0 && scenario.matches.some(m => m.date)) {
                  // Look for match in the current round (which is the clinching round if canClinchInCurrentRound is true)
                  clinchingMatches = scenario.matches.filter(
                    match => (match.homeTeam === teamName || match.awayTeam === teamName)
                  );
                  
                  // Sort by date and pick the first one if multiple exist
                  clinchingMatches.sort((a, b) => 
                    a.date && b.date ? new Date(a.date) - new Date(b.date) : 0
                  );
                }
                
                // If we found a clinching match
                if (clinchingMatches.length > 0) {
                  const ourMatch = clinchingMatches[0];
                  return ` ${ourMatch.homeTeam} vs ${ourMatch.awayTeam}`;
                }
                
                // If we still haven't found the match, just return a generic statement
                return ' your next match';
              })()}
              .
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-md border border-blue-100 p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Main title threats: {scenario.threatCompetitors?.join(', ')}
          </p>
          <p className="text-xs text-gray-500">
            Only fixtures involving {teamName} and these teams are shown as they're most relevant to the title race.
          </p>
        </div>
      </div>
      
      {/* Show key fixtures from earlier rounds */}
      {hasKeyFixtures && (
        <div className="mb-4">
          <h4 className="text-sm sm:text-md font-medium mb-2 text-blue-700">
            Key Fixtures from Earlier Rounds
          </h4>
          
          {Object.keys(keyFixturesByRound).sort((a, b) => {
            // For date-based rounds (Apr 14 format), sort chronologically
            if (a.match(/[A-Za-z]+\s\d+/) && b.match(/[A-Za-z]+\s\d+/)) {
              const monthsOrder = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
              };
              
              const [aMonth, aDay] = a.split(' ');
              const [bMonth, bDay] = b.split(' ');
              
              if (monthsOrder[aMonth] !== monthsOrder[bMonth]) {
                return monthsOrder[aMonth] - monthsOrder[bMonth];
              }
              return parseInt(aDay) - parseInt(bDay);
            }
            
            // Default to numeric sorting for round numbers
            return parseInt(a) - parseInt(b);
          }).map(roundNum => (
            <div key={roundNum} className="mb-3">
              <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">{formatRoundDisplay(roundNum)}</h5>
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
                      <div key={index} className="px-3 py-2 sm:px-4 sm:py-3">
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
      
      {scenario.needsOneMoreResult && (
        <div className="mt-3 text-xs text-blue-700 bg-blue-50 p-2 border border-blue-100 rounded">
          <span className="font-semibold">Note:</span> This scenario assumes all earlier rounds play out optimally for {teamName}.
        </div>
      )}
    </div>
  );
} 