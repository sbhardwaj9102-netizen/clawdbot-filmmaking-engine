import styles from "./FilmGrain.module.css";

/** Moving film grain + a whisper of gate weave, layered over everything. */
export function FilmGrain() {
  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.grain} />
    </div>
  );
}
