import { NextResponse } from 'next/server';
import { Team, Match } from '../../utils/simulator';

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

// This is the main API route handler function
export async function GET() {
  try {
    // IMPORTANT: No NEXT_PUBLIC_ prefix means this is only available server-side
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RapidAPI key is missing. Set RAPIDAPI_KEY in environment variables' },
        { status: 500 }
      );
    }
    
    // Fetch standings from the RapidAPI endpoint for EPL (comp=1)
    const standingsResponse = await fetch('https://football-web-pages1.p.rapidapi.com/league-table.json?comp=1', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'football-web-pages1.p.rapidapi.com',
        'Accept': 'application/json'
      }
    });
    
    if (!standingsResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch EPL standings data: ${standingsResponse.status}` },
        { status: standingsResponse.status }
      );
    }
    
    const standingsData = await standingsResponse.json();
    
    // Parse teams data
    const teams = parseRapidAPITeamsData(standingsData);
    
    // Fetch fixtures
    const fixturesResponse = await fetch('https://football-web-pages1.p.rapidapi.com/fixtures-results.json?comp=1', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'football-web-pages1.p.rapidapi.com',
        'Accept': 'application/json'
      }
    });
    
    if (!fixturesResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch EPL fixtures data: ${fixturesResponse.status}` },
        { status: fixturesResponse.status }
      );
    }
    
    const fixturesData = await fixturesResponse.json();
    
    // Parse fixtures data
    const matches = parseRapidAPIFixturesData(fixturesData);
    
    // Return the data
    return NextResponse.json({ teams, matches });
    
  } catch (error) {
    console.error('Error in English Premier League API route:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching data' },
      { status: 500 }
    );
  }
} 