import React, { useState, useEffect } from 'react';
import axios from 'axios';

function getCardImage(cardStr) {
  const rankMap = {
    'J': 'jack',
    'Q': 'queen',
    'K': 'king',
    'A': 'ace'
  };

  const suitMap = {
    '♠': 'spades',
    '♣': 'clubs',
    '♥': 'hearts',
    '♦': 'diamonds'
  };

  const rank = cardStr.slice(0, -1);
  const suit = cardStr.slice(-1);

  const fileRank = rankMap[rank] || rank;
  const fileSuit = suitMap[suit];

  return `/cards/${fileRank}_of_${fileSuit}.png`;  // adjust path as needed
}

function GameBoard() {
  const [gameData, setGameData] = useState(null);
  const [showdownData, setShowdownData] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);

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
      setGameEnded(true);
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
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>♠ Poker Game ♣</h1>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button onClick={startGame} style={{ padding: '10px 20px', fontWeight: 'bold' }}>
          Start New Game
        </button>
      </div>

      {gameData && (
        <div>
          <h2 style={{ color: '#444' }}>Pot: <span style={{ color: '#008000' }}>{gameData.pot} BB</span></h2>

          <div>
            <h2 style={{ borderBottom: '1px solid #ccc' }}>Players</h2>
            {gameData.players.map((player, idx) => {
              const isCurrentTurn = gameData.current_turn === player.name && !player.folded && !gameEnded;
              return (
                <div key={idx} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: isCurrentTurn ? '#f0f8ff' : '#fafafa',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ margin: 0 }}>
                    {player.name} — <span style={{ color: '#000080' }}>{player.bb} BB</span>
                    {player.is_small_blind && <span style={{ marginLeft: '10px', color: '#e67e22' }}>🟡 Small Blind</span>}
                    {player.is_big_blind && <span style={{ marginLeft: '10px', color: '#2980b9' }}>🔵 Big Blind</span>}
                    {player.folded && <span style={{ marginLeft: '10px', color: '#aaa' }}>(Folded)</span>}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', margin: '5px 0' }}>
                    {player.hand.map((card, idx) => (
                      <img key={idx} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />
                    ))}
                  </div>

                  {isCurrentTurn && (
                    <div style={{ marginTop: '10px' }}>
                      <button onClick={() => playerAction(player.name, 'call')} style={{ marginRight: '10px' }}>
                        Call
                      </button>
                      <button onClick={() => {
                        const amount = prompt('Enter bet amount (in BB):');
                        if (amount) playerAction(player.name, 'bet', parseFloat(amount));
                      }} style={{ marginRight: '10px' }}>
                        Bet
                      </button>
                      <button onClick={() => playerAction(player.name, 'fold')} style={{ color: 'red' }}>
                        Fold
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '30px' }}>
            <h2>Community Cards</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              {gameData.community_cards.length === 0 ? (
                <p style={{ fontSize: '18px' }}>None yet</p>
              ) : (
                gameData.community_cards.map((card, idx) => (
                  <img key={idx} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Showdown Screen */}
      {showdownData && (
        <div style={{
          marginTop: '40px',
          padding: '20px',
          border: '2px solid #444',
          borderRadius: '12px',
          backgroundColor: '#fdfdfd'
        }}>
          <h2 style={{ color: '#b30000' }}>🏆 Final Showdown</h2>

          <p><strong>Board:</strong> {showdownData.board.join(', ')}</p>

          <h3>Player Hands</h3>
          {showdownData.results.map((res, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              <strong>{res.name}</strong>: 
              <div style={{ display: 'flex', gap: '8px', margin: '5px 0' }}>
                {res.hand.map((card, i) => (
                  <img key={i} src={getCardImage(card)} alt={card} style={{ width: '60px', height: '90px' }} />
                ))}
              </div>
              <i>{res.hand_name}</i>
            </div>
          ))}

          <h3 style={{ color: 'green', marginTop: '20px' }}>
            Winner(s): {showdownData.winners.join(', ')}
          </h3>

          <button
            onClick={nextHand}
            style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', borderRadius: '8px' }}
          >
            ➡️ Start Next Hand
          </button>
        </div>
      )}
    </div>
  );
}

export default GameBoard;