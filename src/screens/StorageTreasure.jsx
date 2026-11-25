import { memo, useLayoutEffect, useRef, useState } from "react";
import { getTreasureArt, VAULT_BASE_ART } from "../assets/storageAssets.js";
import { StorageArt } from "../components/StorageArt.jsx";

const SPARKS = Array.from({ length: 14 }, (_, index) => {
  const angle = index * Math.PI * 2 / 14;
  return {
    "--spark-x": `${Math.cos(angle) * (58 + index % 3 * 18)}px`,
    "--spark-y": `${Math.sin(angle) * (42 + index % 3 * 15)}px`,
    "--spark-delay": `${index % 4 * 24}ms`,
  };
});

const PILE_WIDTHS = ["18%", "31%", "43%", "53%", "63%", "74%"];

export const StorageTreasure = memo(function StorageTreasure({ treasure, hasGold, isFinal, reducedMotion }) {
  const shown = useRef(treasure);
  const [transition, setTransition] = useState(null);

  useLayoutEffect(() => {
    if (shown.current !== treasure) {
      setTransition(reducedMotion ? null : { from: shown.current, to: treasure });
      shown.current = treasure;
    } else if (reducedMotion) {
      setTransition(null);
    }
  }, [reducedMotion, treasure]);

  const previous = !reducedMotion && transition?.to === treasure ? transition.from : null;
  return (
    <figure className="gold-treasure" aria-label={treasure.name} data-treasure-level={treasure.level}>
      <div className="gold-treasure__chamber">
        {isFinal ? <span className="gold-treasure__aura" aria-hidden="true" /> : null}
        <StorageArt src={VAULT_BASE_ART} className="gold-treasure__platform" />
        <div key={treasure.level} className={`gold-treasure__art${previous ? " is-transforming" : ""}`}>
          {previous ? (
            <div className="gold-treasure__pile gold-treasure__image--previous" style={{ width: PILE_WIDTHS[previous.level] }}>
              <StorageArt src={getTreasureArt(previous.level)} className="gold-treasure__image" />
            </div>
          ) : null}
          {hasGold ? (
            <div className="gold-treasure__pile gold-treasure__image--current" style={{ width: PILE_WIDTHS[treasure.level] }}>
              <StorageArt src={getTreasureArt(treasure.level)} className="gold-treasure__image" />
            </div>
          ) : null}
          {previous ? (
            <div className="gold-treasure__burst" aria-hidden="true" onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setTransition(null);
            }}>
              {SPARKS.map((style, index) => <i key={index} style={style} />)}
            </div>
          ) : null}
        </div>
      </div>
    </figure>
  );
});
