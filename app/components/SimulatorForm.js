'use client';

import { useState, useEffect } from 'react';
import { StandingsSimulator } from '../utils/simulator';
import { fetchScottishChampionshipData } from '../utils/apiService';

export default function SimulatorForm({ setResults, setLoading }) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [simMethod, setSimMethod] = useState('exact');
  const [error, setError] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch live data when component mounts
  useEffect(() => {
    async function loadLiveData() {
      setDataLoading(true);
      try {
        const scottishData = await fetchScottishChampionshipData();
        if (scottishData) {
          setLiveData(scottishData);
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
  }, []);

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
          leagueName: 'Scottish Championship',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {dataLoading ? (
        <div className="flex justify-center items-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading league data...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Scottish Championship Data
            </h3>
            {liveData && (
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live Data
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
                Select Team
              </label>
              <select
                id="team"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">-- Select a team --</option>
                {getTeams().map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Target Position
              </label>
              <input
                type="number"
                id="position"
                min="1"
                max={getTeamCount()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                placeholder={`Enter position (1-${getTeamCount()})`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Simulation Method
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-500"
                  name="simMethod"
                  value="exact"
                  checked={simMethod === 'exact'}
                  onChange={() => setSimMethod('exact')}
                />
                <span className="ml-2">Exact Calculation</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-500"
                  name="simMethod"
                  value="monteCarlo"
                  checked={simMethod === 'monteCarlo'}
                  onChange={() => setSimMethod('monteCarlo')}
                />
                <span className="ml-2">Monte Carlo Simulation</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {simMethod === 'exact' 
                ? 'Calculates exact probabilities but may be slow for many remaining matches' 
                : 'Uses statistical approximation, faster but provides estimated results'}
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!liveData || dataLoading}
            >
              Run Simulation
            </button>
          </div>
        </>
      )}
    </form>
  );
} 