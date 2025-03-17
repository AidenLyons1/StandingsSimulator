'use client';

import { useState, useEffect } from 'react';
import { StandingsSimulator } from '../utils/simulator';
import { fetchScottishChampionshipData, fetchEnglishPremierLeagueData } from '../utils/apiService';

export default function SimulatorForm({ setResults, setLoading }) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [simMethod, setSimMethod] = useState('exact');
  const [error, setError] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('scottish');

  // Fetch live data when component mounts or league changes
  useEffect(() => {
    async function loadLiveData() {
      setDataLoading(true);
      setSelectedTeam(''); // Reset selected team when league changes
      
      try {
        let leagueData;
        
        if (selectedLeague === 'scottish') {
          leagueData = await fetchScottishChampionshipData();
        } else if (selectedLeague === 'english') {
          leagueData = await fetchEnglishPremierLeagueData();
        }
        
        if (leagueData) {
          setLiveData(leagueData);
        } else {
          setError('Could not load league data. Please try again later.');
        }
      } catch (error) {
        console.error('Error loading live data:', error);
        setError('Could not load league data. Please try again later.');
      } finally {
        setDataLoading(false);
      }
    }
    
    loadLiveData();
  }, [selectedLeague]);

  // Get the teams from live data
  const getTeams = () => {
    return liveData?.teams || [];
  };

  // Get the fixtures from live data
  const getFixtures = () => {
    return liveData?.matches || [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const teams = getTeams();

    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

    if (!targetPosition || isNaN(parseInt(targetPosition)) || 
        parseInt(targetPosition) < 1 || parseInt(targetPosition) > teams.length) {
      setError(`Please enter a valid position between 1 and ${teams.length}`);
      return;
    }

    if (teams.length === 0 || getFixtures().length === 0) {
      setError('No league data available. Please try again later.');
      return;
    }

    setLoading(true);
    
    // Simulate with a small delay to allow UI to update
    setTimeout(() => {
      try {
        const fixtures = getFixtures();
        const simulator = new StandingsSimulator(teams, fixtures);
        
        let simulationResults;
        
        if (simMethod === 'exact' && fixtures.length <= 15) {
          // For smaller number of fixtures, calculate exact outcomes
          simulationResults = simulator.findValidOutcomes(selectedTeam, parseInt(targetPosition));
        } else {
          // For larger number of fixtures, use Monte Carlo simulation
          simulationResults = simulator.monteCarloSimulation(
            selectedTeam, 
            parseInt(targetPosition),
            10000 // Number of iterations
          );
        }
        
        // Get team-specific remaining matches
        const teamRemainingMatches = simulator.remainingMatches.filter(
          match => match.homeTeam === selectedTeam || match.awayTeam === selectedTeam
        );
        
        // Calculate earliest first place clinch if target position is 1
        let clinchScenario = null;
        if (parseInt(targetPosition) === 1) {
          clinchScenario = simulator.findEarliestFirstPlaceClinch(selectedTeam);
        }
        
        // Generate the most probable end-of-season table
        const projectedTable = simulator.generateMostProbableTable(5000);
        
        setResults({
          teamName: selectedTeam,
          targetPosition: parseInt(targetPosition),
          results: simulationResults,
          teams: teams,
          method: simMethod,
          remainingMatches: teamRemainingMatches,
          allRemainingMatches: simulator.remainingMatches, // All remaining matches for all teams
          isLiveData: true,
          leagueName: selectedLeague === 'scottish' ? 'Scottish Championship' : 'English Premier League',
          clinchScenario: clinchScenario, // Add the clinch scenario for 1st place
          projectedTable: projectedTable // Add the projected end-of-season table
        });
      } catch (error) {
        console.error('Simulation error:', error);
        setError('An error occurred during simulation. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  // Safe method to get the number of teams
  const getTeamCount = () => {
    const teams = getTeams();
    return teams ? teams.length : 0;
  };

  return (
    <div>
      {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Select League</label>
          <div className="flex gap-4">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg flex-1 ${
                selectedLeague === 'scottish' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setSelectedLeague('scottish')}
            >
              Scottish Championship
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg flex-1 ${
                selectedLeague === 'english' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setSelectedLeague('english')}
            >
              English Premier League
            </button>
          </div>
        </div>
        
        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading {selectedLeague === 'scottish' ? 'Scottish Championship' : 'English Premier League'} data...</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="team" className="block text-gray-700 font-semibold mb-2">Select Team</label>
              <select
                id="team"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={dataLoading}
              >
                <option value="">Select a team</option>
                {getTeams().map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="position" className="block text-gray-700 font-semibold mb-2">
                Target Position (1-{getTeamCount()})
              </label>
              <input
                id="position"
                type="number"
                min="1"
                max={getTeamCount()}
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={dataLoading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Simulation Method</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg flex-1 ${
                    simMethod === 'exact' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setSimMethod('exact')}
                  disabled={dataLoading}
                >
                  Exact Calculation
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg flex-1 ${
                    simMethod === 'monte' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setSimMethod('monte')}
                  disabled={dataLoading}
                >
                  Monte Carlo
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {simMethod === 'exact' 
                  ? 'Calculates all possible outcomes (may be slow with many remaining fixtures)' 
                  : 'Uses random sampling for faster results with many fixtures'}
              </p>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                disabled={dataLoading}
              >
                Run Simulation
              </button>
            </div>
          </>
        )}
      </form>
      
      {liveData && !dataLoading && (
        <div className="mt-4 text-sm text-gray-500">
          <p>League: {liveData.leagueName}</p>
          <p>Teams: {getTeamCount()}</p>
          <p>Remaining Fixtures: {getFixtures().length}</p>
        </div>
      )}
    </div>
  );
} 