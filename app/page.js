'use client';

import { useState } from 'react';
import SimulatorForm from './components/SimulatorForm';
import StandingsTable from './components/StandingsTable';
import SimulationResults from './components/SimulationResults';
import './styles/globals.css';

export default function Home() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Function to handle receiving results from the simulator
  const handleResults = (data) => {
    setResults(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 md:p-12 bg-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Football Standings Simulator
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Calculate all possible combinations that would allow your team to finish in a specific position
          </p>
          <p className="text-gray-500 text-sm">
            {results ? `${results.leagueName} live data from Sofascore API` : 'Live data from Sofascore API'}
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <SimulatorForm setResults={handleResults} setLoading={setLoading} />
        </div>

        {loading && (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg">Running simulation...</span>
          </div>
        )}

        {results && !loading && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Simulation Results</h2>
              <SimulationResults results={results} />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Current League Table</h2>
              <StandingsTable 
                teams={results.teams} 
                highlightTeam={results.teamName} 
                remainingMatches={results.allRemainingMatches} 
              />
            </div>
          </>
        )}

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Created by Aiden Lyons</p>
          <p className="mt-1">Data provided by Sofascore API</p>
        </footer>
      </div>
    </main>
  );
} 