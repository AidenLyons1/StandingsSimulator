import { Team, Match } from './simulator';

// Helper function to get the correct API URL based on environment - no longer used
// Keeping for reference in case needed in the future
/*
function getApiUrl() {
  // Check if we're in Node.js (server-side rendering or build time)
  if (typeof window === 'undefined') {
    return 'https://corsproxy.io/?https://api.sofascore.com';
  }
  
  // Check if we're in a browser and on the production domain
  if (window.location.hostname === 'aidenlyons.com' || 
      window.location.hostname.includes('github.io') ||
      window.location.hostname.includes('vercel.app')) {
    // Use CORS proxy in production and on Vercel
    return 'https://corsproxy.io/?https://api.sofascore.com';
  }
  
  // In local development, use the local rewrites
  return '/api/sofascore';
}
*/

// Get the API key from environment variables
function getRapidAPIKey() {
  // For client-side, we need to use NEXT_PUBLIC_ prefixed env variables
  return process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';
}

// Function to fetch Scottish Championship data from our server-side API route
export async function fetchScottishChampionshipData() {
  try {
    // Call our own server-side API route
    const response = await fetch('/api/scottish-championship');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the data with league name and isLiveData flag
    return {
      teams: data.teams,
      matches: data.matches,
      leagueName: 'Scottish Championship',
      isLiveData: true
    };
  } catch (error) {
    console.error('Error fetching Scottish Championship data:', error);
    return null;
  }
}

// Function to fetch English Premier League data from our server-side API route
export async function fetchEnglishPremierLeagueData() {
  try {
    // Call our own server-side API route
    const response = await fetch('/api/english-premier-league');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the data with league name and isLiveData flag
    return {
      teams: data.teams,
      matches: data.matches,
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
      
      // Format match date instead of using API round info
      const roundInfo = matchDate ? {
        round: formatDateForRound(matchDate),
        isDateBased: true,
        originalRound: event.roundInfo?.round // Keep original round for reference if available
      } : event.roundInfo;
      
      const match = new Match(
        event.homeTeam.name,
        event.awayTeam.name,
        false, // not played
        0,     // home goals
        0,     // away goals
        roundInfo, // Use formatted date as round
        matchDate  // Include match date
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
      
      // Create a date for the match, starting from 2 weeks from now
      // Then add 1 week for each subsequent match
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 14 + (i * 7));
      
      // Create a date-based round info object
      const roundInfo = {
        round: formatDateForRound(matchDate),
        isDateBased: true
      };
      
      if (isHome) {
        matches.push(new Match(team.name, teams[opponentIndex].name, false, 0, 0, roundInfo, matchDate));
      } else {
        matches.push(new Match(teams[opponentIndex].name, team.name, false, 0, 0, roundInfo, matchDate));
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

// Parse the teams data from the RapidAPI format
function parseRapidAPITeamsData(apiData) {
  if (!apiData?.['league-table']?.teams) {
    throw new Error('Invalid API data format');
  }
  
  const teams = [];
  const apiTeams = apiData['league-table'].teams;
  
  // Map API team data to our Team model
  apiTeams.forEach(teamData => {
    const team = new Team(
      teamData.name,
      teamData['all-matches'].played,
      teamData['all-matches'].won,
      teamData['all-matches'].drawn,
      teamData['all-matches'].lost,
      teamData['all-matches'].for,
      teamData['all-matches'].against,
      teamData['total-points']
    );
    teams.push(team);
  });
  
  return teams;
}

// Parse fixtures data from the RapidAPI format
function parseRapidAPIFixturesData(apiData) {
  if (!apiData?.['fixtures-results']?.matches) {
    throw new Error('Invalid fixtures data format');
  }
  
  const matches = [];
  const apiMatches = apiData['fixtures-results'].matches;
  
  // Filter for upcoming matches only (those without a final score)
  const upcomingMatches = apiMatches.filter(match => {
    // Check if the match status indicates it's not played yet
    // Examples: "3pm", "7.45pm", etc.
    return !match.status.short.includes('FT') && 
           !match.status.full.includes('Full Time');
  });
  
  // Map API fixture data to our Match model
  upcomingMatches.forEach(matchData => {
    const homeTeam = matchData['home-team'].name;
    const awayTeam = matchData['away-team'].name;
    
    // Create a date object from the date and time
    let matchDate = null;
    if (matchData.date && matchData.time) {
      // Format: "2025-03-29" and "15:00"
      const dateStr = `${matchData.date}T${matchData.time}`;
      matchDate = new Date(dateStr);
    }
    
    // Use date formatting for roundInfo instead of estimating a round number
    const roundInfo = matchDate ? {
      round: formatDateForRound(matchDate),
      isDateBased: true  // Flag to indicate this is a date, not a numeric round
    } : null;
    
    const match = new Match(
      homeTeam,
      awayTeam,
      false, // not played
      0,     // home goals
      0,     // away goals
      roundInfo,
      matchDate
    );
    
    matches.push(match);
  });
  
  return matches;
}

// Format date to be used instead of round numbers
function formatDateForRound(date) {
  if (!date) return "";
  
  // Create a simple date string like "Mar 21"
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  
  return `${month} ${day}`;
} 