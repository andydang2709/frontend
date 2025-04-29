import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GameBoard() {
  const [gameData, setGameData] = useState(null);
  const [showdownData, setShowdownData] = useState(null); // 👈 Hold final showdown info
  const [gameEnded, setGameEnded] = useState(false);      // 👈 Flag for end of hand

  async function fetchGameState() {
    try {
      const response = await axios.get('http://localhost:8000/state');
      setGameData(response.data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  }

  async function startGame() {
    try {
      await axios.get('http://localhost:8000/start');
      setShowdownData(null);
      setGameEnded(false);
      await fetchGameState();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

  async function playerAction(name, action, amount = 0) {
    try {
      const response = await axios.post('http://localhost:8000/action', null, {
        params: { name, action, amount }
      });

      setGameData(response.data.state);

      if (response.data.showdown) {
        await triggerShowdown();
      }
    } catch (error) {
      console.error('Error during player action:', error);
    }
  }

  async function triggerShowdown() {
    try {
      const response = await axios.get('http://localhost:8000/showdown');
      setShowdownData(response.data);
      setGameEnded(true); // ✅ Mark that the game has ended
    } catch (error) {
      console.error('Error during showdown:', error);
    }
  }

  async function nextHand() {
    try {
      await axios.get('http://localhost:8000/next_hand');
      setShowdownData(null);
      setGameEnded(false);
      await fetchGameState();
    } catch (error) {
      console.error('Error starting next hand:', error);
    }
  }

  return (
    <div>
      <h1>Poker Game</h1>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={startGame}>Start New Game</button>
      </div>

      {gameData && (
        <div>
          <h2>Pot: {gameData.pot} BB</h2>

          <h2>Players:</h2>
          {gameData.players.map((player, idx) => (
            <div key={idx}>
              <h3>
                {player.name} ({player.bb} BB) {player.folded ? "(Folded)" : ""}
              </h3>
              <p>Hand: {player.hand.join(', ')}</p>

              {/* Only show action buttons if it's this player's turn and not folded and game not ended */}
              {gameData.current_turn === player.name && !player.folded && !gameEnded && (
                <div style={{ marginBottom: '10px' }}>
                  <button onClick={() => playerAction(player.name, 'call')}>Call</button>
                  <button onClick={() => {
                    const amount = prompt('Enter bet amount (in BB):');
                    if (amount) playerAction(player.name, 'bet', parseFloat(amount));
                  }}>Bet</button>
                  <button onClick={() => playerAction(player.name, 'fold')}>Fold</button>
                </div>
              )}
            </div>
          ))}

          <h2>Community Cards:</h2>
          <p>{gameData.community_cards.join(', ')}</p>
        </div>
      )}

      {/* ✅ Showdown Screen */}
      {showdownData && (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid black', borderRadius: '10px' }}>
          <h2>🏆 Final Showdown</h2>

          <p><strong>Board:</strong> {showdownData.board.join(', ')}</p>

          <h3>Player Hands:</h3>
          {showdownData.results.map((res, idx) => (
            <div key={idx}>
              <p><strong>{res.name}</strong>: {res.hand.join(', ')} — {res.hand_name}</p>
            </div>
          ))}

          <h3 style={{ color: 'green' }}>
            Winner(s): {showdownData.winners.join(', ')}
          </h3>

          <button onClick={nextHand} style={{ marginTop: '20px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', borderRadius: '5px' }}>
            ➡️ Start Next Hand
          </button>
        </div>
      )}
    </div>
  );
}

export default GameBoard;