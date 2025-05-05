import React, { useState } from 'react';
import axios from 'axios';

function getCardImage(cardStr) {
  const rankMap = { J: 'jack', Q: 'queen', K: 'king', A: 'ace' };
  const suitMap = { '♠': 'spades', '♣': 'clubs', '♥': 'hearts', '♦': 'diamonds' };
  const rank = cardStr.slice(0, -1);
  const suit = cardStr.slice(-1);
  const fileRank = rankMap[rank] || rank;
  const fileSuit = suitMap[suit];
  return `${process.env.PUBLIC_URL}/cards/${fileRank}_of_${fileSuit}.png`;
}

function GameBoard() {
  const [setupMode, setSetupMode] = useState(true);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(Array(2).fill(''));
  const [sbAmount, setSbAmount] = useState(0.5);
  const [bbAmount, setBbAmount] = useState(1.0);
  const [gameData, setGameData] = useState(null);
  const [showdownData, setShowdownData] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);

  const BASE_URL = 'https://4350b21f-15a7-4d76-9abc-5d8e33ecccc8-00-a0ybye7nectp.riker.replit.dev';

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/state`);
      setGameData(response.data);
    } catch (error) {
      console.error('Error fetching game state:', error);
      alert('Failed to fetch game state. Please try again.');
    }
  };

  const startGame = async () => {
    const filled = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`);
    try {
      const response = await axios.post(`${BASE_URL}/start`, {
        players: filled,
        sb: sbAmount,
        bb: bbAmount
      });      
      setGameData(response.data);
      setSetupMode(false);
      setShowdownData(null);
      setGameEnded(false);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Check console for details.');
    }
  };

  const playerAction = async (name, action, amount = 0) => {
    console.log(`playerAction() →`, { name, action, amount });
    try {
      const response = await axios.post(
        `${BASE_URL}/action`,
        null,
        { params: { name, action, amount } }
      );
      setGameData(response.data.state);
      if (response.data.showdown) {
        setShowdownData(response.data.showdown);
        setGameEnded(true);
      }
    } catch (error) {
      console.error('Error during player action:', error);
      alert('Action failed. Please try again.');
    }
  };

  const nextStage = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/next_stage`);
      const data = response.data;
      if (data.showdown) {
        setShowdownData(data.showdown);
        setGameEnded(true);
      } else {
        setGameData(data);
      }
    } catch (error) {
      console.error('Error advancing stage:', error);
      alert('Failed to advance stage.');
    }
  };

  const nextHand = async () => {
    try {
      await axios.post(`${BASE_URL}/next_hand`);
      await fetchGameState();
      setShowdownData(null);
      setGameEnded(false);
    } catch (error) {
      console.error('Error starting next hand:', error);
      alert('Failed to start next hand.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>♠ Poker Game ♣</h1>

      {setupMode ? (
        <div style={{ textAlign: 'center' }}>
          <h2>Setup Game</h2>
          <label>Number of Players: </label>
          <input
            type="number"
            min={2}
            max={9}
            value={playerCount}
            onChange={e => {
              const count = parseInt(e.target.value, 10);
              setPlayerCount(count);
              setPlayerNames(Array(count).fill(''));
            }}
          />

        {/* Blinds setup */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            alignItems: 'flex-start',
            marginTop: '15px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ marginBottom: '4px' }}>Small Blind (BB):</label>
            <input
              type="number"
              step="0.1"
              value={sbAmount}
              onChange={e => setSbAmount(parseFloat(e.target.value))}
              style={{ width: '100px', padding: '4px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ marginBottom: '4px' }}>Big Blind (BB):</label>
            <input
              type="number"
              step="0.1"
              value={bbAmount}
              onChange={e => setBbAmount(parseFloat(e.target.value))}
              style={{ width: '100px', padding: '4px' }}
            />
          </div>
        </div>

          {playerNames.map((name, idx) => (
            <div key={idx}>
              <label>Player {idx + 1} Name: </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  const newNames = [...playerNames];
                  newNames[idx] = e.target.value;
                  setPlayerNames(newNames);
                }}
              />
            </div>
          ))}
          <button style={{ marginTop: '15px' }} onClick={startGame}>
            Start Game
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              // Return to initial setup
              setSetupMode(true);
              setPlayerCount(2);
              setPlayerNames(Array(2).fill(''));
              setGameData(null);
              setShowdownData(null);
              setGameEnded(false);
            }}
            style={{ padding: '10px 20px', fontWeight: 'bold' }}
          >
            New Game Setup
          </button>
        </div>
      )}

      {gameData && !showdownData && (
        <div>
          <h2 style={{ color: '#444' }}>
            Pot: <span style={{ color: '#008000' }}>{gameData.pot} BB</span>
          </h2>

          <div>
            <h2 style={{ borderBottom: '1px solid #ccc' }}>Players</h2>
            {gameData.players.map((player, idx) => {
              const isCurrent = gameData.current_turn === player.name && !player.folded && !gameEnded;
              return (
                <div key={idx} style={{
                  padding: '10px', marginBottom: '10px',
                  backgroundColor: isCurrent ? '#f0f8ff' : '#fafafa',
                  border: '1px solid #ddd', borderRadius: '8px'
                }}>
                  <h3 style={{ margin: 0 }}>
                    {player.name} — <span style={{ color: '#000080' }}>{player.bb} BB</span>
                    {player.is_small_blind && <span style={{ marginLeft: '10px' }}>🟡 SB</span>}
                    {player.is_big_blind && <span style={{ marginLeft: '10px' }}>🔵 BB</span>}
                    {player.folded && <span style={{ marginLeft: '10px', color: '#aaa' }}>(Folded)</span>}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '5px 0' }}>
                    {player.hand.map((card, cidx) => (
                      <img key={cidx} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />
                    ))}
                  </div>

                  {isCurrent && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button onClick={() => {
                        console.log('Call button clicked for', player.name);
                        playerAction(player.name, 'call');
                      }}>
                        Call
                      </button>
                      <button onClick={() => playerAction(player.name, 'check')}>Check</button>
                      <button onClick={() => {
                        const amt = prompt('Enter bet amount (BB):');
                        const num = parseFloat(amt);
                        if (!amt || isNaN(num)) return alert('Enter a valid number');
                        playerAction(player.name, 'bet', num);
                      }}>Bet</button>
                      <button onClick={() => playerAction(player.name, 'fold')} style={{ color: 'red' }}>Fold</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h2>Community Cards</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {gameData.community_cards.map((card, idx) => (
                <img key={idx} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {showdownData && (
        <div style={{ marginTop: '40px', padding: '20px', border: '2px solid #444', borderRadius: '12px', backgroundColor: '#fdfdfd' }}>
          <h2 style={{ textAlign: 'center' }}>🏆 Final Showdown</h2>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <strong>Board:</strong>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {showdownData.board.map((card, idx) => (
                <img key={idx} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />
              ))}
            </div>
          </div>
          <h3 style={{ textAlign: 'center' }}>Hands</h3>
          {showdownData.results.map((res, idx) => (
            <div key={idx} style={{ textAlign: 'center', marginBottom: '15px' }}>
              <strong>{res.name}</strong> (<em>{res.hand_name}</em>)
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
                {res.hand.map((card, cidx) => <img key={cidx} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />)}
              </div>
            </div>
          ))}
          <h3 style={{ textAlign: 'center' }}>Winner(s): {showdownData.winners.join(', ')}</h3>
          <div style={{ textAlign: 'center' }}>
            <button onClick={nextHand} style={{ padding: '12px 20px', backgroundColor: '#4CAF50', color: '#fff', borderRadius: '8px' }}>
              ➡️ Start Next Hand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameBoard;