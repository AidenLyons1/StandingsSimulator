# Football Standings Simulator

A web application that calculates the possible combinations of match outcomes to allow a team to finish in a specific position in the league table.

## Features

- Select any team from the Scottish Championship
- Specify the target finishing position
- Choose between exact calculation or Monte Carlo simulation methods
- View detailed results including probability of achieving the target position
- See a list of valid outcome combinations (for exact calculations)
- Display of the current league table
- View earliest possible round a team can clinch first place

## Technologies Used

- Next.js - React framework for building the UI
- Tailwind CSS - For styling components
- Math.js - For complex mathematical calculations (multinomial coefficients)
- Sofascore API - For live Scottish Championship data

## How It Works

The application uses two main approaches to calculate the probabilities:

1. **Exact Calculation**: Enumerates all possible combinations of wins, draws, and losses for the selected team's remaining matches. It then filters for outcome combinations that would result in the team finishing in the desired position. This method is precise but can be computationally expensive when there are many remaining matches.

2. **Monte Carlo Simulation**: For scenarios with many remaining matches, the application uses statistical simulation to estimate probabilities. It runs thousands of simulated seasons with random outcomes for all matches and calculates the percentage of simulations in which the team finishes in the target position.

The mathematical foundation includes:
- Multinomial coefficients to calculate the number of ways to achieve a specific combination of outcomes
- League table sorting based on standard tiebreaker rules (points, goal difference, goals scored)
- Probability calculation based on valid outcomes vs. total possible outcomes

## Getting Started

To run the application locally:

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploying to aidenlyons.com/StandingsSimulator

This application is configured for static export with a base path of `/StandingsSimulator`. To deploy to your website:

1. Build the application:
```bash
npm run build
```

2. This will create an `out` directory with the static export files

3. Copy these files to your main website repository:
```bash
# Create directory in your website repo (if it doesn't exist)
mkdir -p /path/to/your/website/StandingsSimulator

# Copy all built files
cp -r out/* /path/to/your/website/StandingsSimulator/

# Commit and push to your website repository
cd /path/to/your/website
git add StandingsSimulator
git commit -m "Update Football Standings Simulator"
git push
```

4. Your application will be available at `aidenlyons.com/StandingsSimulator`

You can also use the included `deploy.sh` script which will build the application and provide these instructions.

### API Configuration

The application is configured to use a CORS proxy (corsproxy.io) when deployed to production, which allows it to fetch data from the Sofascore API.

## Live Data

The application connects to the Sofascore API to fetch live data for the Scottish Championship, including:
- Current league standings and team statistics
- Upcoming fixtures with round information
- Automatic calculation of remaining matches for each team

## Future Improvements

- Support for additional leagues and tournaments
- Allow custom team and fixture input
- Implement more advanced tie-breaker rules (head-to-head records)
- Add visualizations of outcome probabilities
- Enable configuration of simulation parameters 