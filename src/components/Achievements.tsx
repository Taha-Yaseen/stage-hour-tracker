import { ACHIEVEMENTS } from "../lib/achievements";

type AchievementsProps = {
  earnedKeys: Set<string>;
};

export function Achievements({ earnedKeys }: AchievementsProps) {
  return (
    <section className="card" aria-labelledby="achievements-heading">
      <h2 id="achievements-heading">Achievements</h2>
      <ul className="badges">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = earnedKeys.has(achievement.key);
          return (
            <li key={achievement.key} className={unlocked ? "badge on" : "badge"}>
              <span className="badge-mark" aria-hidden="true">
                {unlocked ? "✓" : "○"}
              </span>
              <span>
                <strong>{achievement.title}</strong>
                <small>{unlocked ? achievement.detail : achievement.locked}</small>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
