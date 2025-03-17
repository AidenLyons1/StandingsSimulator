import * as math from 'mathjs';

// Points awarded for each result
const POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0
};

/**
 * Represents a team in the league
 */
class Team {
  constructor(name, played, won, drawn, lost, goalsFor, goalsAgainst, points) {
    this.name = name;
    this.played = played;
    this.won = won;
    this.drawn = drawn;
    this.lost = lost;
    this.goalsFor = goalsFor;
    this.goalsAgainst = goalsAgainst;
    this.points = points;
    this.goalDifference = goalsFor - goalsAgainst;
  }

  clone() {
    return new Team(
      this.name,
      this.played,
      this.won,
      this.drawn,
      this.lost,
      this.goalsFor,
      this.goalsAgainst,
      this.points
    );
  }
}

/**
 * Represents a match between two teams
 */
class Match {
  constructor(homeTeam, awayTeam, played = false, homeGoals = 0, awayGoals = 0, roundInfo = null) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.played = played;
    this.homeGoals = homeGoals;
    this.awayGoals = awayGoals;
    this.roundInfo = roundInfo; // Used to track which round/week the match is part of
  }
}

/**
 * Main class that handles the standings simulation
 */
export class StandingsSimulator {
  constructor(teams, matches) {
    this.teams = teams;
    this.matches = matches;
    this.remainingMatches = matches.filter(match => !match.played);
    this.totalGames = this.remainingMatches.length;
    this.totalPossibleOutcomes = Math.pow(3, this.totalGames); // 3 possibilities (W/D/L) for each game
  }

  /**
   * Get all possible combinations of wins, draws, and losses for a team
   * that sum up to the total number of games
   */
  getPossibleOutcomeCombinations(teamName) {
    const teamMatches = this.remainingMatches.filter(
      match => match.homeTeam === teamName || match.awayTeam === teamName
    );
    const totalTeamGames = teamMatches.length;
    
    // Get all combinations of wins, draws, and losses that sum to totalTeamGames
    const combinations = [];
    
    for (let wins = 0; wins <= totalTeamGames; wins++) {
      for (let draws = 0; draws <= totalTeamGames - wins; draws++) {
        const losses = totalTeamGames - wins - draws;
        combinations.push({ wins, draws, losses });
      }
    }
    
    return combinations;
  }
  
  /**
   * Calculate the number of possible ways to achieve a specific outcome combination
   * using multinomial coefficients
   */
  getNumberOfWaysToAchieveOutcome(teamGames, outcome) {
    const { wins, draws, losses } = outcome;
    // Calculate multinomial coefficient: n! / (k1! * k2! * ... * kn!)
    // Where n is total games and k's are the counts of each outcome
    return math.multinomial([wins, draws, losses]);
  }

  /**
   * Calculate the final points for a team given an outcome combination
   */
  calculateTeamPoints(team, outcome) {
    const { wins, draws, losses } = outcome;
    return team.points + (wins * POINTS.WIN) + (draws * POINTS.DRAW);
  }

  /**
   * Check if a team can achieve a specific position with a given outcome
   */
  canTeamAchievePosition(targetTeam, targetPosition, outcome) {
    // Clone teams to avoid modifying original data
    const simulatedTeams = this.teams.map(team => team.clone());
    
    // Find the target team in the cloned array
    const targetTeamIndex = simulatedTeams.findIndex(team => team.name === targetTeam.name);
    if (targetTeamIndex === -1) return false;
    
    // Update target team's stats based on the outcome
    const team = simulatedTeams[targetTeamIndex];
    team.won += outcome.wins;
    team.drawn += outcome.draws;
    team.lost += outcome.losses;
    team.played += outcome.wins + outcome.draws + outcome.losses;
    team.points = this.calculateTeamPoints(targetTeam, outcome);
    
    // Simple simulation for other teams (this is simplified and could be enhanced)
    // In a real-world scenario, you would need to simulate actual matches
    
    // Sort teams by points (descending)
    simulatedTeams.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    // Check if the target team is at the target position
    return simulatedTeams.findIndex(team => team.name === targetTeam.name) === targetPosition - 1;
  }

  /**
   * Find all valid outcomes for a team to achieve a specific position
   */
  findValidOutcomes(teamName, targetPosition) {
    const team = this.teams.find(t => t.name === teamName);
    if (!team) return { validOutcomes: [], totalPossible: 0 };
    
    const possibleCombinations = this.getPossibleOutcomeCombinations(teamName);
    const validOutcomes = possibleCombinations.filter(outcome => 
      this.canTeamAchievePosition(team, targetPosition, outcome)
    );
    
    let totalValidWays = 0;
    validOutcomes.forEach(outcome => {
      const teamMatches = this.remainingMatches.filter(
        match => match.homeTeam === teamName || match.awayTeam === teamName
      );
      totalValidWays += this.getNumberOfWaysToAchieveOutcome(teamMatches.length, outcome);
    });
    
    return {
      validOutcomes,
      totalPossible: this.totalPossibleOutcomes,
      totalValidWays,
      probability: (totalValidWays / this.totalPossibleOutcomes) * 100
    };
  }

  /**
   * Monte Carlo simulation to estimate probability when there are too many combinations
   */
  monteCarloSimulation(teamName, targetPosition, iterations = 10000) {
    const team = this.teams.find(t => t.name === teamName);
    if (!team) return { probability: 0, successCount: 0, iterations };
    
    let successCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      // Clone teams
      const simulatedTeams = this.teams.map(t => t.clone());
      const teamIndex = simulatedTeams.findIndex(t => t.name === teamName);
      
      // Randomly simulate all remaining matches
      for (const match of this.remainingMatches) {
        const outcome = Math.floor(Math.random() * 3); // 0 = home win, 1 = draw, 2 = away win
        
        const homeTeamIndex = simulatedTeams.findIndex(t => t.name === match.homeTeam);
        const awayTeamIndex = simulatedTeams.findIndex(t => t.name === match.awayTeam);
        
        if (homeTeamIndex !== -1 && awayTeamIndex !== -1) {
          if (outcome === 0) { // Home win
            simulatedTeams[homeTeamIndex].points += POINTS.WIN;
            simulatedTeams[homeTeamIndex].won += 1;
            simulatedTeams[awayTeamIndex].lost += 1;
          } else if (outcome === 1) { // Draw
            simulatedTeams[homeTeamIndex].points += POINTS.DRAW;
            simulatedTeams[awayTeamIndex].points += POINTS.DRAW;
            simulatedTeams[homeTeamIndex].drawn += 1;
            simulatedTeams[awayTeamIndex].drawn += 1;
          } else { // Away win
            simulatedTeams[awayTeamIndex].points += POINTS.WIN;
            simulatedTeams[awayTeamIndex].won += 1;
            simulatedTeams[homeTeamIndex].lost += 1;
          }
          
          simulatedTeams[homeTeamIndex].played += 1;
          simulatedTeams[awayTeamIndex].played += 1;
        }
      }
      
      // Sort teams by points
      simulatedTeams.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
      
      // Check if team achieved target position
      if (simulatedTeams.findIndex(t => t.name === teamName) === targetPosition - 1) {
        successCount++;
      }
    }
    
    return {
      probability: (successCount / iterations) * 100,
      successCount,
      iterations
    };
  }

  /**
   * Generate the most probable final table based on Monte Carlo simulation
   * @param {number} iterations - Number of simulations to run
   * @returns {Array} Array of objects containing teams and their most likely final positions
   */
  generateMostProbableTable(iterations = 1000) {
    // Track position counts for each team
    const positionCounts = {};
    this.teams.forEach(team => {
      positionCounts[team.name] = Array(this.teams.length).fill(0);
    });
    
    // Run multiple simulations
    for (let i = 0; i < iterations; i++) {
      // Clone teams for this simulation
      const simulatedTeams = this.teams.map(t => t.clone());
      
      // Randomly simulate all remaining matches
      for (const match of this.remainingMatches) {
        const outcome = Math.floor(Math.random() * 3); // 0 = home win, 1 = draw, 2 = away win
        
        const homeTeamIndex = simulatedTeams.findIndex(t => t.name === match.homeTeam);
        const awayTeamIndex = simulatedTeams.findIndex(t => t.name === match.awayTeam);
        
        if (homeTeamIndex === -1 || awayTeamIndex === -1) continue;
        
        if (outcome === 0) { // Home win
          simulatedTeams[homeTeamIndex].points += POINTS.WIN;
          simulatedTeams[homeTeamIndex].won += 1;
          simulatedTeams[awayTeamIndex].lost += 1;
        } else if (outcome === 1) { // Draw
          simulatedTeams[homeTeamIndex].points += POINTS.DRAW;
          simulatedTeams[awayTeamIndex].points += POINTS.DRAW;
          simulatedTeams[homeTeamIndex].drawn += 1;
          simulatedTeams[awayTeamIndex].drawn += 1;
        } else { // Away win
          simulatedTeams[awayTeamIndex].points += POINTS.WIN;
          simulatedTeams[awayTeamIndex].won += 1;
          simulatedTeams[homeTeamIndex].lost += 1;
        }
        
        simulatedTeams[homeTeamIndex].played += 1;
        simulatedTeams[awayTeamIndex].played += 1;
      }
      
      // Sort teams by points (descending)
      simulatedTeams.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
      
      // Record the position of each team in this simulation
      simulatedTeams.forEach((team, index) => {
        positionCounts[team.name][index]++;
      });
    }
    
    // Calculate most probable position and probability percentage for each team
    const finalTable = this.teams.map(team => {
      const counts = positionCounts[team.name];
      const mostProbablePosition = counts.indexOf(Math.max(...counts)) + 1;
      const probability = (Math.max(...counts) / iterations) * 100;
      
      // Calculate average points based on current points and expected points from remaining matches
      const teamMatches = this.remainingMatches.filter(
        match => match.homeTeam === team.name || match.awayTeam === team.name
      );
      
      // Estimate expected points from remaining matches (simplified model)
      // For a more accurate model, you could use team strength ratings
      const expectedPointsPerMatch = 1.5; // Average between 0 (loss), 1 (draw), and 3 (win)
      const projectedAdditionalPoints = teamMatches.length * expectedPointsPerMatch;
      const projectedFinalPoints = Math.round(team.points + projectedAdditionalPoints);
      
      return {
        ...team,
        currentPosition: this.teams.indexOf(team) + 1,
        projectedPosition: mostProbablePosition,
        projectedPoints: projectedFinalPoints,
        probability: probability.toFixed(1)
      };
    });
    
    // Sort by projected position (ascending)
    finalTable.sort((a, b) => a.projectedPosition - b.projectedPosition);
    
    return finalTable;
  }

  /**
   * Determine the earliest week a team can clinch first place
   * and the required results for all teams
   */
  findEarliestFirstPlaceClinch(teamName) {
    const targetTeam = this.teams.find(team => team.name === teamName);
    if (!targetTeam) return null;
    
    // Group matches by round
    const matchesByRound = this.groupMatchesByRound();
    const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
    
    if (rounds.length === 0) return null;
    
    // Start with current standings
    const simulatedTeams = this.teams.map(team => team.clone());
    
    // Keep track of key fixtures from earlier rounds
    const keyFixtures = [];
    
    console.log("Looking for clinch scenario across these rounds:", rounds);
    
    // First, collect key fixtures from ALL rounds before checking for clinching
    // This ensures we have all key fixtures regardless of when the clinch happens
    for (const round of rounds) {
      const roundMatches = matchesByRound[round];
      
      // Track key fixtures from this round before moving to the next
      const roundKeyFixtures = this.identifyKeyFixturesInRound(
        roundMatches, 
        simulatedTeams, 
        targetTeam.name, 
        parseInt(round)
      );
      
      if (roundKeyFixtures.length > 0) {
        console.log(`Round ${round} key fixtures:`, roundKeyFixtures.length);
        keyFixtures.push(...roundKeyFixtures);
      }
    }
    
    console.log("Total key fixtures found across all rounds:", keyFixtures.length);
    
    // Now simulate round by round to find the clinching scenario
    const simulatedTeamsForClinch = this.teams.map(team => team.clone());
    
    for (const round of rounds) {
      const roundMatches = matchesByRound[round];
      
      // Calculate current max possible points for each team
      const maxPossiblePoints = this.calculateMaxPossiblePoints(simulatedTeamsForClinch, round, matchesByRound);
      
      // Calculate minimum points needed to guarantee first place
      const minPointsNeeded = this.calculateMinPointsForFirstPlace(targetTeam, simulatedTeamsForClinch, maxPossiblePoints);
      
      // Check if team can achieve these points in this round
      const bestCaseForTargetTeam = this.simulateBestCaseScenario(targetTeam.name, roundMatches, simulatedTeamsForClinch);
      
      // If the team can reach or exceed the minimum points needed, they can clinch
      if (bestCaseForTargetTeam.points >= minPointsNeeded) {
        // For each team, determine what result would prevent them from catching up
        const requiredResults = this.determineRequiredResults(
          targetTeam.name, 
          roundMatches, 
          simulatedTeamsForClinch, 
          maxPossiblePoints,
          minPointsNeeded
        );
        
        // Filter key fixtures to only include those from earlier rounds
        const earlierRoundFixtures = keyFixtures.filter(fixture => fixture.round < parseInt(round));
        
        console.log(`Clinch found in round ${round}. Earlier fixtures: ${earlierRoundFixtures.length}`);
        
        return {
          round: parseInt(round),
          pointsNeeded: minPointsNeeded,
          currentPoints: targetTeam.points,
          pointsToGain: minPointsNeeded - targetTeam.points,
          requiredResults: requiredResults,
          matches: roundMatches,
          keyFixtures: earlierRoundFixtures // Include key fixtures from earlier rounds only
        };
      }
      
      // Simulate this round assuming all favorable results
      this.simulateRound(roundMatches, simulatedTeamsForClinch, teamName);
    }
    
    // If we can't determine a clinching scenario
    return null;
  }
  
  /**
   * Group the remaining matches by round number
   */
  groupMatchesByRound() {
    const matchesByRound = {};
    
    this.remainingMatches.forEach(match => {
      // If roundInfo is missing, use a default placeholder
      const round = match.roundInfo ? match.roundInfo.round : 'unknown';
      
      if (!matchesByRound[round]) {
        matchesByRound[round] = [];
      }
      
      matchesByRound[round].push(match);
    });
    
    return matchesByRound;
  }
  
  /**
   * Calculate the maximum possible points each team can achieve
   */
  calculateMaxPossiblePoints(teams, currentRound, matchesByRound) {
    const maxPoints = {};
    
    teams.forEach(team => {
      // Start with current points
      maxPoints[team.name] = team.points;
      
      // Add maximum possible points from remaining matches (counting only future rounds)
      Object.keys(matchesByRound).forEach(round => {
        if (parseInt(round) >= parseInt(currentRound)) {
          const roundMatches = matchesByRound[round];
          
          roundMatches.forEach(match => {
            if (match.homeTeam === team.name || match.awayTeam === team.name) {
              // Assume win (3 points) for every remaining match
              maxPoints[team.name] += POINTS.WIN;
            }
          });
        }
      });
    });
    
    return maxPoints;
  }
  
  /**
   * Calculate minimum points needed to guarantee first place
   */
  calculateMinPointsForFirstPlace(targetTeam, teams, maxPossiblePoints) {
    let minPointsNeeded = targetTeam.points;
    
    teams.forEach(team => {
      if (team.name !== targetTeam.name) {
        // Need at least 1 more point than the maximum any other team can achieve
        minPointsNeeded = Math.max(minPointsNeeded, maxPossiblePoints[team.name] + 1);
      }
    });
    
    return minPointsNeeded;
  }
  
  /**
   * Simulate best case scenario for the target team in a given round
   */
  simulateBestCaseScenario(teamName, roundMatches, teams) {
    const teamIndex = teams.findIndex(t => t.name === teamName);
    if (teamIndex === -1) return null;
    
    const team = teams[teamIndex].clone();
    
    // For each match in this round involving the target team, assume a win
    roundMatches.forEach(match => {
      if (match.homeTeam === teamName) {
        team.points += POINTS.WIN;
        team.won += 1;
        team.played += 1;
      } else if (match.awayTeam === teamName) {
        team.points += POINTS.WIN;
        team.won += 1;
        team.played += 1;
      }
    });
    
    return team;
  }
  
  /**
   * Determine required results for teams to guarantee first place
   */
  determineRequiredResults(teamName, roundMatches, teams, maxPossiblePoints, minPointsNeeded) {
    const requiredResults = [];
    
    // For the target team, wins are required for their own matches
    const targetTeamMatches = roundMatches.filter(match => 
      match.homeTeam === teamName || match.awayTeam === teamName
    );
    
    targetTeamMatches.forEach(match => {
      requiredResults.push({
        match: match,
        result: match.homeTeam === teamName ? 'home_win' : 'away_win',
        explanation: `${teamName} must win to gain 3 points`
      });
    });
    
    // For other teams, they need to drop points if they're too close
    teams.forEach(team => {
      if (team.name !== teamName) {
        const pointsGap = minPointsNeeded - team.points;
        const teamMatches = roundMatches.filter(match => 
          match.homeTeam === team.name || match.awayTeam === team.name
        );
        
        // If this team can't catch up even with all wins, skip
        if (maxPossiblePoints[team.name] < minPointsNeeded) {
          return;
        }
        
        teamMatches.forEach(match => {
          // This match is already accounted for by the target team's requirements
          if (match.homeTeam === teamName || match.awayTeam === teamName) {
            return;
          }
          
          const isHome = match.homeTeam === team.name;
          const opponent = isHome ? match.awayTeam : match.homeTeam;
          
          requiredResults.push({
            match: match,
            result: isHome ? 'away_win_or_draw' : 'home_win_or_draw',
            explanation: `${team.name} must drop points to prevent them from catching ${teamName}`
          });
        });
      }
    });
    
    return requiredResults;
  }
  
  /**
   * Simulate a round with all favorable results for the target team
   */
  simulateRound(roundMatches, teams, targetTeamName) {
    roundMatches.forEach(match => {
      const homeTeamIndex = teams.findIndex(t => t.name === match.homeTeam);
      const awayTeamIndex = teams.findIndex(t => t.name === match.awayTeam);
      
      if (homeTeamIndex !== -1 && awayTeamIndex !== -1) {
        // Target team wins
        if (match.homeTeam === targetTeamName) {
          teams[homeTeamIndex].points += POINTS.WIN;
          teams[homeTeamIndex].won += 1;
          teams[awayTeamIndex].lost += 1;
        } 
        else if (match.awayTeam === targetTeamName) {
          teams[awayTeamIndex].points += POINTS.WIN;
          teams[awayTeamIndex].won += 1;
          teams[homeTeamIndex].lost += 1;
        }
        // For matches not involving target team, assume results that hurt potential rivals
        else {
          // Both teams draw, minimizing points gain
          teams[homeTeamIndex].points += POINTS.DRAW;
          teams[awayTeamIndex].points += POINTS.DRAW;
          teams[homeTeamIndex].drawn += 1;
          teams[awayTeamIndex].drawn += 1;
        }
        
        teams[homeTeamIndex].played += 1;
        teams[awayTeamIndex].played += 1;
      }
    });
  }

  /**
   * Identify key fixtures in a round that are important for the target team
   */
  identifyKeyFixturesInRound(roundMatches, teams, targetTeamName, roundNumber) {
    const keyFixtures = [];
    const targetTeam = teams.find(t => t.name === targetTeamName);
    
    if (!targetTeam || !roundMatches || roundMatches.length === 0) {
      return [];
    }
    
    // Find competitors within 12 points in EITHER direction (above or below)
    const closeCompetitors = teams
      .filter(team => {
        if (team.name === targetTeamName) return false;
        
        // Consider teams both above and below the target team
        const pointsDifference = Math.abs(targetTeam.points - team.points);
        return pointsDifference <= 12;
      })
      .map(team => team.name);
    
    console.log(`Round ${roundNumber}: Found ${closeCompetitors.length} close competitors within 12 points`);
    
    // If no close competitors, find the top 3 teams by points (excluding target team)
    if (closeCompetitors.length === 0) {
      const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
      sortedTeams.slice(0, 3).forEach(team => {
        if (team.name !== targetTeamName) {
          closeCompetitors.push(team.name);
        }
      });
      console.log(`No close competitors found, using top ${closeCompetitors.length} teams instead`);
    }
    
    // Identify matches where close competitors face each other or potentially drop points
    roundMatches.forEach(match => {
      const isTargetTeamMatch = match.homeTeam === targetTeamName || match.awayTeam === targetTeamName;
      const isCompetitorMatch = closeCompetitors.includes(match.homeTeam) || closeCompetitors.includes(match.awayTeam);
      const isTwoCompetitorsMatch = closeCompetitors.includes(match.homeTeam) && closeCompetitors.includes(match.awayTeam);
      
      // Skip matches involving the target team as they're already covered in required results
      if (isTargetTeamMatch) return;
      
      // If match is between two close competitors or involves a close competitor
      if (isCompetitorMatch) {
        let result = null;
        let explanation = '';
        
        if (isTwoCompetitorsMatch) {
          // For matches between competitors, a draw is usually beneficial
          result = 'draw';
          explanation = `A draw would limit points gained by both ${match.homeTeam} and ${match.awayTeam}`;
        } else {
          // For matches with only one competitor, favor them losing
          const competitor = closeCompetitors.includes(match.homeTeam) ? match.homeTeam : match.awayTeam;
          const isCompetitorHome = match.homeTeam === competitor;
          
          result = isCompetitorHome ? 'away_win' : 'home_win';
          explanation = `${competitor} dropping points would help ${targetTeamName} gain ground`;
        }
        
        keyFixtures.push({
          match: match,
          result: result,
          explanation: explanation,
          round: roundNumber,
          importance: isTwoCompetitorsMatch ? 'high' : 'medium'
        });
      }
    });
    
    // Ensure we always return at least one key fixture per round if possible
    if (keyFixtures.length === 0 && roundMatches.length > 0) {
      // Find any match not involving target team
      const otherMatch = roundMatches.find(match => 
        match.homeTeam !== targetTeamName && match.awayTeam !== targetTeamName
      );
      
      if (otherMatch) {
        keyFixtures.push({
          match: otherMatch,
          result: 'draw',
          explanation: `Other match in the same round that may affect league standings`,
          round: roundNumber,
          importance: 'low'
        });
      }
    }
    
    return keyFixtures;
  }
}

// Export the classes for use in the application
export { Team, Match }; 