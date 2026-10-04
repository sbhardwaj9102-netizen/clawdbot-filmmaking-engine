/* eslint-disable @next/next/no-img-element */
import type { Asset } from "@/lib/types";
import styles from "./motion.module.css";

type Props = { asset: Asset; className?: string; priority?: boolean; style?: React.CSSProperties };

/** Image or looping video. Swap any asset in /data without touching components. */
export function Media({ asset, className, priority, style }: Props) {
  const cls = `${styles.media} ${className ?? ""}`;
  if (asset.video) {
    return (
      <video
        className={cls}
        src={asset.video}
        poster={asset.src}
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        aria-label={asset.alt}
        style={style}
      />
    );
  }
  return (
    <img
      className={cls}
      src={asset.src}
      alt={asset.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      style={style}
    />
  );
}
