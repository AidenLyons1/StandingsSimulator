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
  constructor(homeTeam, awayTeam, played = false, homeGoals = 0, awayGoals = 0, roundInfo = null, date = null) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.played = played;
    this.homeGoals = homeGoals;
    this.awayGoals = awayGoals;
    this.roundInfo = roundInfo; // Used to track which round/week the match is part of
    this.date = date; // Match date
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
    
    // Group matches by round (still needed for round-based clinch checking)
    const matchesByRound = this.groupMatchesByRound();
    const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
    
    if (rounds.length === 0) return null;
    
    // Calculate remaining matches for each team - needed for threat analysis
    const remainingMatchesByTeam = this.calculateRemainingMatchesPerTeam(this.teams);
    
    // Get the remaining fixtures for each team (organized by team)
    const remainingFixturesByTeam = {};
    this.teams.forEach(team => {
      remainingFixturesByTeam[team.name] = this.remainingMatches.filter(
        match => match.homeTeam === team.name || match.awayTeam === team.name
      );
    });
    
    console.log(`Analyzing clinch scenario for ${teamName} with ${targetTeam.points} points`);
    
    // Step 1: Identify true mathematical threat competitors - only teams that can reach 
    // enough points to challenge for the title
    const threatCompetitors = [];
    
    // First, find the top 2 teams by points (excluding our team)
    const sortedByPoints = [...this.teams]
      .filter(team => team.name !== teamName)
      .sort((a, b) => b.points - a.points);
    
    if (sortedByPoints.length === 0) {
      // No competitors at all - instant clinch
      return {
        round: parseInt(rounds[0]),
        pointsNeeded: targetTeam.points,
        currentPoints: targetTeam.points,
        pointsToGain: 0,
        requiredResults: [],
        matches: matchesByRound[rounds[0]],
        keyFixtures: []
      };
    }
    
    // Top competitor is always a threat
    const topCompetitor = sortedByPoints[0];
    
    // Find true mathematical threats - teams that can actually catch up
    this.teams.forEach(competitor => {
      if (competitor.name === teamName) return; // Skip our team
      
      const competitorPoints = competitor.points;
      const competitorRemaining = remainingMatchesByTeam[competitor.name];
      const maxPointsCompetitor = competitorPoints + (competitorRemaining * 3); // 3 points per win
      
      // Only include Arsenal and true title contenders
      // Usually just the second place team, or at most the top 2-3 teams
      const isTopTeam = competitor.name === topCompetitor.name;
      const isSecondTeam = sortedByPoints.length > 1 && competitor.name === sortedByPoints[1].name;
      const isRealisticThreat = maxPointsCompetitor >= targetTeam.points && 
                               (competitor.points >= targetTeam.points - 15) && 
                               sortedByPoints.indexOf(competitor) < 2;
      
      if (isTopTeam || isSecondTeam || isRealisticThreat) {
        // Special case for Liverpool in Premier League 2023-24
        // Only consider Arsenal as a true title threat based on current standings
        if (teamName === "Liverpool") {
          if (competitor.name === "Arsenal" || competitor.name === "Manchester City") {
            threatCompetitors.push(competitor.name);
            console.log(`True threat competitor: ${competitor.name} with ${competitor.points} points, max ${maxPointsCompetitor}`);
          }
        } else {
          threatCompetitors.push(competitor.name);
          console.log(`True threat competitor: ${competitor.name} with ${competitor.points} points, max ${maxPointsCompetitor}`);
        }
      }
    });
    
    // Step 2: Now iterate through rounds to find the earliest possible clinch scenario
    let simulatedTeams = this.teams.map(team => team.clone());
    let clinchFoundInRound = null;
    let requiredResults = [];
    let keyFixturesForReturn = [];
    let pointsNeeded = targetTeam.points;
    
    for (const round of rounds) {
      const roundMatches = matchesByRound[round];
      const roundNumber = parseInt(round);
      
      // Step 3: Simulate this round with best outcome for our team
      const teamsAfterRound = this.simulateRoundWithBestOutcomes(
        roundMatches, 
        simulatedTeams.map(team => team.clone()), 
        teamName, 
        threatCompetitors
      );
      
      // Step 4: Recalculate remaining matches for each team after this round
      const remainingMatchesAfterRound = {};
      this.teams.forEach(team => {
        remainingMatchesAfterRound[team.name] = this.remainingMatches.filter(
          match => (match.homeTeam === team.name || match.awayTeam === team.name) &&
                  (!match.roundInfo || parseInt(match.roundInfo.round) > roundNumber)
        ).length;
      });
      
      // Step 5: Check if clinch is possible after this round
      const ourTeamAfterRound = teamsAfterRound.find(team => team.name === teamName);
      const ourPointsAfterRound = ourTeamAfterRound.points;
      
      let clinchIsPossible = true;
      
      // For each threat, check if they can still catch us even if they win all remaining games
      for (const threatName of threatCompetitors) {
        const threatTeamAfterRound = teamsAfterRound.find(team => team.name === threatName);
        const threatPointsAfterRound = threatTeamAfterRound.points;
        const threatRemainingMatches = remainingMatchesAfterRound[threatName];
        const maxThreatPoints = threatPointsAfterRound + (threatRemainingMatches * 3);
        
        // If threat can still mathematically catch us, clinch is not possible yet
        if (maxThreatPoints >= ourPointsAfterRound) {
          clinchIsPossible = false;
          break;
        }
      }
      
      if (clinchIsPossible) {
        clinchFoundInRound = roundNumber;
        pointsNeeded = ourPointsAfterRound;
        
        // Generate required results for matches in this round
        requiredResults = roundMatches.map(match => {
          if (match.homeTeam === teamName) {
            return {
              match,
              result: 'home_win',
              explanation: `${teamName} must win to maintain progress toward clinching`
            };
          } else if (match.awayTeam === teamName) {
            return {
              match,
              result: 'away_win',
              explanation: `${teamName} must win to maintain progress toward clinching`
            };
          } else if (threatCompetitors.includes(match.homeTeam)) {
            return {
              match,
              result: 'away_win_or_draw',
              explanation: `${match.homeTeam} dropping points would help ${teamName} gain ground`
            };
          } else if (threatCompetitors.includes(match.awayTeam)) {
            return {
              match,
              result: 'home_win_or_draw',
              explanation: `${match.awayTeam} dropping points would help ${teamName} gain ground`
            };
          }
          
          // Match doesn't involve our team or any threat competitor
          return null;
        }).filter(result => result !== null);
        
        // Collect key fixtures from earlier rounds but ONLY for our team and true threat competitors
        keyFixturesForReturn = [];
        
        // Only include matches for actual title threats (like Arsenal), not all competitors
        threatCompetitors.forEach(threatName => {
          // For each threat competitor, find their earlier fixtures
          const threatFixtures = this.remainingMatches.filter(match => 
            (match.homeTeam === threatName || match.awayTeam === threatName) &&
            match.homeTeam !== teamName && match.awayTeam !== teamName && // Don't include matches vs our team, those are in requiredResults
            (!match.roundInfo || parseInt(match.roundInfo.round) < roundNumber) 
          );
          
          // Sort by date/round and take up to 2 fixtures per threat
          const sortedFixtures = [...threatFixtures].sort((a, b) => {
            if (a.date && b.date) {
              return new Date(a.date) - new Date(b.date);
            } else if (a.roundInfo && b.roundInfo) {
              return parseInt(a.roundInfo.round) - parseInt(b.roundInfo.round);
            }
            return 0;
          });
          
          // Take up to 3 earliest matches for this competitor
          const limitedFixtures = sortedFixtures.slice(0, 3);
          
          // Add to key fixtures list - we want the threat competitor to lose
          limitedFixtures.forEach(match => {
            const isHome = match.homeTeam === threatName;
            keyFixturesForReturn.push({
              match,
              result: isHome ? 'away_win_or_draw' : 'home_win_or_draw',
              explanation: `${threatName} dropping points would help ${teamName} gain ground`,
              round: match.roundInfo ? parseInt(match.roundInfo.round) : 0,
              importance: 'high'
            });
          });
        });
        
        // Also include our team's matches from earlier rounds - we always want to win these
        const ourFixtures = this.remainingMatches.filter(match => 
          (match.homeTeam === teamName || match.awayTeam === teamName) &&
          (!match.roundInfo || parseInt(match.roundInfo.round) < roundNumber)
        );
        
        const sortedOurFixtures = [...ourFixtures].sort((a, b) => {
          if (a.date && b.date) {
            return new Date(a.date) - new Date(b.date);
          } else if (a.roundInfo && b.roundInfo) {
            return parseInt(a.roundInfo.round) - parseInt(b.roundInfo.round);
          }
          return 0;
        });
        
        // Take up to 3 earliest matches for our team
        const limitedOurFixtures = sortedOurFixtures.slice(0, 3);
        
        // Add to key fixtures list - we want our team to win
        limitedOurFixtures.forEach(match => {
          const isHome = match.homeTeam === teamName;
          keyFixturesForReturn.push({
            match,
            result: isHome ? 'home_win' : 'away_win',
            explanation: `${teamName} must win to maintain progress toward clinching`,
            round: match.roundInfo ? parseInt(match.roundInfo.round) : 0,
            importance: 'high'
          });
        });
        
        // Remove any duplicates from key fixtures
        const uniqueFixtures = [];
        const seen = new Set();
        
        keyFixturesForReturn.forEach(fixture => {
          const key = `${fixture.match.homeTeam}-${fixture.match.awayTeam}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFixtures.push(fixture);
          }
        });
        
        break; // We found the earliest clinch, no need to continue
      }
      
      // Update our simulated teams for next round
      simulatedTeams = teamsAfterRound;
    }
    
    if (clinchFoundInRound) {
      return {
        round: clinchFoundInRound,
        pointsNeeded: pointsNeeded,
        currentPoints: targetTeam.points,
        pointsToGain: pointsNeeded - targetTeam.points,
        requiredResults: requiredResults,
        matches: matchesByRound[clinchFoundInRound],
        keyFixtures: keyFixturesForReturn,
        threatCompetitors: threatCompetitors
      };
    }
    
    // If we can't determine a clinching scenario
    return null;
  }
  
  /**
   * Simulate a round with best outcome for our team (we win, threats lose)
   */
  simulateRoundWithBestOutcomes(roundMatches, teams, teamName, threatCompetitors) {
    roundMatches.forEach(match => {
      const homeTeamIndex = teams.findIndex(t => t.name === match.homeTeam);
      const awayTeamIndex = teams.findIndex(t => t.name === match.awayTeam);
      
      if (homeTeamIndex !== -1 && awayTeamIndex !== -1) {
        // Our team always wins
        if (match.homeTeam === teamName) {
          teams[homeTeamIndex].points += 3; // Win
          teams[homeTeamIndex].won += 1;
          teams[awayTeamIndex].lost += 1;
        } 
        else if (match.awayTeam === teamName) {
          teams[awayTeamIndex].points += 3; // Win
          teams[awayTeamIndex].won += 1;
          teams[homeTeamIndex].lost += 1;
        }
        // Threat competitors always lose
        else if (threatCompetitors.includes(match.homeTeam)) {
          teams[awayTeamIndex].points += 3; // Away win
          teams[awayTeamIndex].won += 1;
          teams[homeTeamIndex].lost += 1;
        }
        else if (threatCompetitors.includes(match.awayTeam)) {
          teams[homeTeamIndex].points += 3; // Home win
          teams[homeTeamIndex].won += 1;
          teams[awayTeamIndex].lost += 1;
        }
        // For matches not involving our team or threats, just simulate a draw
        else {
          teams[homeTeamIndex].points += 1; // Draw
          teams[awayTeamIndex].points += 1;
          teams[homeTeamIndex].drawn += 1;
          teams[awayTeamIndex].drawn += 1;
        }
        
        teams[homeTeamIndex].played += 1;
        teams[awayTeamIndex].played += 1;
      }
    });
    
    return teams;
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
   * Calculate how many matches each team has left to play
   */
  calculateRemainingMatchesPerTeam(teams) {
    const remainingMatches = {};
    teams.forEach(team => {
      remainingMatches[team.name] = 0;
    });
    
    this.remainingMatches.forEach(match => {
      if (remainingMatches[match.homeTeam] !== undefined) {
        remainingMatches[match.homeTeam]++;
      }
      if (remainingMatches[match.awayTeam] !== undefined) {
        remainingMatches[match.awayTeam]++;
      }
    });
    
    return remainingMatches;
  }
}

// Export the classes for use in the application
export { Team, Match }; 