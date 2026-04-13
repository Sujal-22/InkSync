import "./Leaderboard.css";

export default function Leaderboard({ players, currentPlayerId }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="leaderboard-wrapper">
      <h3 className="leaderboard-title">🏆 Leaderboard</h3>
      <div className="leaderboard-list">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`leaderboard-row 
              ${i === 0 ? "first" : ""} 
              ${p.id === currentPlayerId ? "me" : ""}`}
          >
            <span className="lb-rank">{getRankIcon(i)}</span>
            <span className="lb-avatar">{p.name.charAt(0).toUpperCase()}</span>
            <span className="lb-name">
              {p.name}
              {p.id === currentPlayerId && (
                <span className="lb-you"> (You)</span>
              )}
            </span>
            <span className="lb-score">{p.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
