import { memo, useLayoutEffect, useRef, useState } from "react";
import { getTreasureArt } from "../assets/storageAssets.js";
import { StorageArt } from "../components/StorageArt.jsx";

const SPARKS = Array.from({ length: 14 }, (_, index) => {
  const angle = index * Math.PI * 2 / 14;
  return {
    "--spark-x": `${Math.cos(angle) * (58 + index % 3 * 18)}px`,
    "--spark-y": `${Math.sin(angle) * (42 + index % 3 * 15)}px`,
    "--spark-delay": `${index % 4 * 24}ms`,
  };
});

export const StorageTreasure = memo(function StorageTreasure({ treasure, isFinal, reducedMotion }) {
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
    <figure className="gold-treasure" aria-label="Tesouro atual" data-treasure-level={treasure.level}>
      <div className="gold-treasure__chamber">
        <span className="gold-treasure__grid" aria-hidden="true" />
        {isFinal ? <span className="gold-treasure__aura" aria-hidden="true" /> : null}
        <div key={treasure.level} className={`gold-treasure__art${previous ? " is-transforming" : ""}`}>
          {previous ? <StorageArt src={getTreasureArt(previous.level)} className="gold-treasure__image gold-treasure__image--previous" /> : null}
          <StorageArt src={getTreasureArt(treasure.level)} className="gold-treasure__image gold-treasure__image--current" />
          {previous ? (
            <div className="gold-treasure__burst" aria-hidden="true" onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setTransition(null);
            }}>
              {SPARKS.map((style, index) => <i key={index} style={style} />)}
            </div>
          ) : null}
        </div>
      </div>
      <figcaption className="laboratory-plant-caption gold-treasure__caption">
        <h2>{treasure.name}</h2>
      </figcaption>
    </figure>
  );
});
