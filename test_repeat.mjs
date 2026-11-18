// Automated test for Repeat Match integration (no browser)
import { saveCurrentMatch, loadMatchHistory, deleteMatchFromHistory, factoryReset } from './src/utils/storage.js';
import { v4 as uuidv4 } from 'crypto';

function cloneMatchForRepeat(prevMatch) {
  // Simulate the logic in CreateMatch.handleSelectPreviousMatch
  const newMatch = {
    ...prevMatch,
    id: `repeat-${Date.now()}`,
    name: `${prevMatch.name} (Rematch)`,
    matchType: prevMatch.matchType || (prevMatch.overs === 10 ? 'T10' : prevMatch.overs === 20 ? 'T20' : 'Custom'),
    overs: prevMatch.overs,
    teamA: {
      ...prevMatch.teamA,
      players: (prevMatch.teamA.players || []).map(p => ({
        id: p.id || `pa-${Date.now()}-${Math.random()}`,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        isCaptain: !!p.isCaptain,
      })),
    },
    teamB: {
      ...prevMatch.teamB,
      players: (prevMatch.teamB.players || []).map(p => ({
        id: p.id || `pb-${Date.now()}-${Math.random()}`,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        isCaptain: !!p.isCaptain,
      })),
    },
    // Do NOT copy innings or scores
    innings: [],
    status: 'new',
  };
  return newMatch;
}

function runTests() {
  console.log('--- Repeat Match Automated Tests ---');
  // Clean any existing data
  factoryReset();

  // 1. Create a previous match with full data
  const prevMatch = {
    id: 'match-12345',
    name: 'Test Match',
    overs: 10,
    matchType: 'T10',
    teamA: {
      name: 'Team A',
      players: [
        { id: 'pa-1', name: 'Alice', jerseyNumber: '10', isCaptain: true },
        { id: 'pa-2', name: 'Bob', jerseyNumber: '11' },
      ],
    },
    teamB: {
      name: 'Team B',
      players: [
        { id: 'pb-1', name: 'Carol', jerseyNumber: '12', isCaptain: true },
        { id: 'pb-2', name: 'Dave', jerseyNumber: '13' },
      ],
    },
    innings: [
      { battingTeamId: 'teamA', deliveries: [{ ball: 1, runs: 4 }], overs: 1 },
    ],
    status: 'completed',
    winMargin: '5 runs',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    numericMatchId: '12345',
  };

  // Save it to history
  saveCurrentMatch(prevMatch);
  // Verify it appears in history
  const history1 = loadMatchHistory();
  console.log('History after saving previous match:', history1.length === 1 ? 'OK' : 'FAIL');

  // 2. Clone for repeat
  const repeatMatch = cloneMatchForRepeat(prevMatch);

  // Verify player IDs are preserved
  const idsPreserved = repeatMatch.teamA.players[0].id === 'pa-1' && repeatMatch.teamB.players[0].id === 'pb-1';
  console.log('Player IDs preserved:', idsPreserved ? 'OK' : 'FAIL');

  // Verify no innings data copied
  const inningsEmpty = repeatMatch.innings.length === 0;
  console.log('Innings cleared:', inningsEmpty ? 'OK' : 'FAIL');

  // Verify overs are copied but not score
  const oversCopied = repeatMatch.overs === prevMatch.overs;
  console.log('Overs copied:', oversCopied ? 'OK' : 'FAIL');

  // 3. Save the repeated match as a new match
  saveCurrentMatch(repeatMatch);
  const history2 = loadMatchHistory();
  console.log('History after saving repeat match (should have 2 entries):', history2.length === 2 ? 'OK' : 'FAIL');

  // Verify numericMatchId is generated uniquely for the new match
  const ids = new Set(history2.map(m => m.numericMatchId));
  console.log('Unique numericMatchId for both matches:', ids.size === 2 ? 'OK' : 'FAIL');

  // 4. Ensure previous match's score is unchanged in history
  const original = history2.find(m => m.id === prevMatch.id);
  const originalScore = original?.innings?.[0]?.deliveries?.length || 0;
  console.log('Original match score untouched:', originalScore === 1 ? 'OK' : 'FAIL');

  // Cleanup
  deleteMatchFromHistory(prevMatch.id);
  deleteMatchFromHistory(repeatMatch.id);
  const finalHistory = loadMatchHistory();
  console.log('History cleaned (should be empty):', finalHistory.length === 0 ? 'OK' : 'FAIL');
}

runTests();
