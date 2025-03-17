import { Team, Match } from './simulator';

// Helper function to get the correct API URL based on environment
function getApiUrl() {
  // Check if we're in Node.js (server-side rendering or build time)
  if (typeof window === 'undefined') {
    return '/api/sofascore';
  }
  
  // Check if we're in a browser and on the production domain
  if (window.location.hostname === 'aidenlyons.com' || 
      window.location.hostname.includes('github.io')) {
    // Use CORS proxy in production
    return 'https://corsproxy.io/?https://api.sofascore.com';
  }
  
  // In local development, use the local rewrites
  return '/api/sofascore';
}

// Function to fetch Scottish Championship standings from Sofascore API
export async function fetchScottishChampionshipData() {
  try {
    // Fetch standings
    const standingsResponse = await fetch(`${getApiUrl()}/api/v1/unique-tournament/206/season/62411/standings/total`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!standingsResponse.ok) {
      throw new Error(`Failed to fetch standings data: ${standingsResponse.status}`);
    }
    
    const standingsData = await standingsResponse.json();
    
    // Parse teams data first
    const teams = parseTeamsData(standingsData);
    
    // Fetch upcoming matches
    const matchesData = await fetchUpcomingMatches('206', '62411');
    
    // Parse matches data
    const matches = parseUpcomingMatches(matchesData, teams);
    
    return {
      teams,
      matches,
      leagueName: 'Scottish Championship',
      isLiveData: true
    };
  } catch (error) {
    console.error('Error fetching Scottish Championship data:', error);
    return null;
  }
}

// Function to fetch English Premier League standings from Sofascore API
export async function fetchEnglishPremierLeagueData() {
  try {
    // Fetch standings
    const standingsResponse = await fetch(`${getApiUrl()}/api/v1/unique-tournament/17/season/61627/standings/total`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!standingsResponse.ok) {
      throw new Error(`Failed to fetch EPL standings data: ${standingsResponse.status}`);
    }
    
    const standingsData = await standingsResponse.json();
    
    // Parse teams data first
    const teams = parseTeamsData(standingsData);
    
    // Fetch upcoming matches
    const matchesData = await fetchUpcomingMatches('17', '61627');
    
    // Parse matches data
    const matches = parseUpcomingMatches(matchesData, teams);
    
    return {
      teams,
      matches,
      leagueName: 'English Premier League',
      isLiveData: true
    };
  } catch (error) {
    console.error('Error fetching English Premier League data:', error);
    return null;
  }
}

// Function to fetch all upcoming matches with pagination handling
async function fetchUpcomingMatches(tournamentId, seasonId) {
  let allMatches = [];
  let page = 0;
  let hasMorePages = true;
  
  while (hasMorePages) {
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/events/next/${page}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch upcoming matches on page ${page}: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.events || data.events.length === 0) {
        hasMorePages = false;
      } else {
        allMatches = [...allMatches, ...data.events];
        
        // Check if there are more pages
        hasMorePages = data.hasNextPage === true;
        page++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`Error fetching upcoming matches page ${page}:`, error);
      hasMorePages = false;
    }
  }
  
  return allMatches;
}

// Parse the teams data from the API
function parseTeamsData(apiData) {
  if (!apiData?.standings?.[0]?.rows) {
    throw new Error('Invalid API data format');
  }
  
  const teams = [];
  const apiTeams = apiData.standings[0].rows;
  
  // Map API team data to our Team model
  apiTeams.forEach(teamData => {
    const team = new Team(
      teamData.team.name,
      teamData.matches,
      teamData.wins,
      teamData.draws,
      teamData.losses,
      teamData.scoresFor,
      teamData.scoresAgainst,
      teamData.points
    );
    teams.push(team);
  });
  
  return teams;
}

// Parse the upcoming matches data from API into our Match model
function parseUpcomingMatches(matchesData, teams) {
  if (!matchesData || !Array.isArray(matchesData) || matchesData.length === 0) {
    return generateFixtures(teams); // Generate fallback fixtures if no data is available
  }
  
  const parsedMatches = [];
  
  matchesData.forEach(event => {
    if (event.status?.type === 'notstarted' || event.status?.type === 'postponed') {
      // Only include matches that haven't been played yet
      const matchDate = event.startTimestamp ? new Date(event.startTimestamp * 1000) : null;
      
      const match = new Match(
        event.homeTeam.name,
        event.awayTeam.name,
        false, // not played
        0,     // home goals
        0,     // away goals
        event.roundInfo, // Include round information
        matchDate      // Include match date
      );
      
      parsedMatches.push(match);
    }
  });
  
  return parsedMatches;
}

// Generate fixtures based on teams when API data is unavailable
function generateFixtures(teams) {
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return [];
  }
  
  const matches = [];
  const numberOfMatches = 3; // Generate 3 remaining matches per team
  
  teams.forEach((team, index) => {
    for (let i = 0; i < numberOfMatches; i++) {
      const opponentIndex = (index + i + 1) % teams.length;
      const isHome = i % 2 === 0; // Alternate home and away
      
      // Create a pseudo round info object
      const roundInfo = {
        round: Math.floor(i / 2) + 1 // Distribute matches across rounds
      };
      
      if (isHome) {
        matches.push(new Match(team.name, teams[opponentIndex].name, false, 0, 0, roundInfo));
      } else {
        matches.push(new Match(teams[opponentIndex].name, team.name, false, 0, 0, roundInfo));
      }
    }
  });
  
  // Remove duplicates (inevitable with the simple generation method above)
  const uniqueMatches = [];
  const matchStrings = new Set();
  
  matches.forEach(match => {
    const matchString = `${match.homeTeam}-${match.awayTeam}`;
    if (!matchStrings.has(matchString)) {
      matchStrings.add(matchString);
      uniqueMatches.push(match);
    }
  });
  
  return uniqueMatches;
} 