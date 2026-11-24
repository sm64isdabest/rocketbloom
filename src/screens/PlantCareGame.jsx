import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { GameIcon } from "../components/GameIcon.jsx";
import "../styles/plant-care.css";

const assetBase = import.meta.env.BASE_URL;
const labAssets = `${assetBase}assets/laboratory/`;
const careAssets = `${labAssets}care/`;
const slots = [0, 1, 2];
const waterGoal = 100;
const cleaningGoal = 3;

const games = {
  water: {
    title: "Irrigação das raízes",
    instructions: "Escolha uma raiz e mantenha Regar pressionado até encher o medidor.",
    backdrop: "irrigation.webp",
    play: WaterCare,
  },
  bees: {
    title: "Polinização assistida",
    instructions: "Escolha uma abelha na bandeja e leve-a até uma flor livre.",
    backdrop: "pollination.webp",
    play: BeeCare,
  },
  clean: {
    title: "Limpeza do vaso",
    instructions: "Esfregue ou toque três vezes em cada mancha do vaso.",
    backdrop: "cleaning.webp",
    play: CleanCare,
  },
};

const rootPositions = ["28%", "50%", "72%"];
const flowerPositions = [["24%", "46%"], ["50%", "23%"], ["76%", "46%"]];
const patchPositions = [["35%", "69%"], ["65%", "69%"], ["50%", "83%"]];

function addCare(amounts, index, increment, goal) {
  if (amounts[index] >= goal) return amounts;
  return amounts.map((amount, slot) => slot === index ? Math.min(goal, amount + increment) : amount);
}

function position(x, y) {
  return { "--care-x": x, "--care-y": y };
}

function CareScene({ backdrop, plantImage, plantName, children, ...interaction }) {
  return (
    <div className="plant-care__scene" {...interaction}>
      <img className="plant-care__backdrop" src={`${careAssets}${backdrop}`} alt="" draggable="false" />
      <div className="plant-care__workbench">
        <img className="plant-care__pot" src={`${careAssets}pot.webp`} alt="" draggable="false" />
        <img className="plant-care__plant" src={plantImage} alt={plantName} draggable="false" />
        {children}
      </div>
    </div>
  );
}

function CareControls({ count, progressLabel, onFinish, children }) {
  const complete = count === slots.length;

  return (
    <div className="plant-care__controls" data-has-tools={Boolean(children)}>
      <div className="plant-care__status" role="status" aria-atomic="true">
        <span className="plant-care__status-meter" aria-hidden="true">
          {slots.map((index) => <span key={index} data-done={index < count} />)}
        </span>
        <span>{count} de {slots.length} {progressLabel}</span>
      </div>
      {children && <div className="plant-care__tools">{children}</div>}
      <button className="plant-care__action" type="button" onClick={complete ? onFinish : undefined} disabled={!complete}>
        Concluir
      </button>
    </div>
  );
}

function WaterCare({ onFinish, ...scene }) {
  const [water, setWater] = useState([0, 0, 0]);
  const [root, setRoot] = useState(0);
  const [pouring, setPouring] = useState(false);
  const waterButton = useRef(null);
  const progress = water[root];
  const canWater = progress < waterGoal;
  const watering = canWater && pouring;
  const count = water.filter((amount) => amount === waterGoal).length;

  useEffect(() => {
    if (!watering) return undefined;

    const interval = window.setInterval(() => {
      setWater((amounts) => addCare(amounts, root, 10, waterGoal));
    }, 70);
    return () => window.clearInterval(interval);
  }, [root, watering]);

  const stopWater = () => setPouring(false);

  function startWater() {
    if (!canWater) return;
    setWater((amounts) => addCare(amounts, root, 12, waterGoal));
    setPouring(true);
  }

  function handleWaterKeyDown(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) startWater();
  }

  function handleWaterKeyUp(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    stopWater();
  }

  return (
    <>
      <CareScene {...scene}>
        <div className="plant-care__pour" data-pouring={watering} data-facing-left={root === 2} style={position(rootPositions[root], "65%")} aria-hidden="true">
          <img src={`${careAssets}can.webp`} alt="" draggable="false" />
          <span className="plant-care__water-stream">
            <i /><i /><i />
          </span>
        </div>
        {rootPositions.map((x, index) => (
          <button
            key={x}
            className="plant-care__target plant-care__root"
            type="button"
            style={position(x, "73%")}
            aria-label={`Raiz ${index + 1}, ${water[index] === waterGoal ? "regada" : `${water[index]}% de água`}`}
            aria-pressed={root === index}
            data-done={water[index] === waterGoal}
            onClick={(event) => {
              stopWater();
              setRoot(index);
              if (event.detail === 0) waterButton.current?.focus();
            }}
          >
            {water[index] === waterGoal ? <GameIcon name="check" className="plant-care__root-check" /> : index + 1}
          </button>
        ))}
      </CareScene>
      <CareControls count={count} progressLabel="raízes regadas" onFinish={onFinish}>
        <label className="plant-care__gauge">
          <span>Raiz {root + 1}</span>
          <progress max={waterGoal} value={progress} />
        </label>
        <button
          className="plant-care__action plant-care__action--water"
          type="button"
          ref={waterButton}
          aria-disabled={!canWater}
          data-pouring={watering}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0 || !canWater) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            startWater();
          }}
          onPointerUp={stopWater}
          onPointerCancel={stopWater}
          onLostPointerCapture={stopWater}
          onKeyDown={handleWaterKeyDown}
          onKeyUp={handleWaterKeyUp}
          onBlur={stopWater}
          onClick={(event) => {
            if (event.detail === 0) setWater((amounts) => addCare(amounts, root, 20, waterGoal));
          }}
        >
          Regar
        </button>
      </CareControls>
    </>
  );
}

function BeeCare({ onFinish, ...scene }) {
  const [assignments, setAssignments] = useState([null, null, null]);
  const [selected, setSelected] = useState(null);
  const beeButtons = useRef([]);
  const flowerButtons = useRef([]);
  const count = assignments.filter((bee) => bee !== null).length;

  function chooseBee(bee, keyboard) {
    setSelected(bee);
    if (keyboard) flowerButtons.current[assignments.indexOf(null)]?.focus();
  }

  function placeBee(bee, flower, keyboard) {
    if (!slots.includes(bee) || assignments.includes(bee) || assignments[flower] !== null) return;
    setAssignments((previous) => {
      if (previous.includes(bee) || previous[flower] !== null) return previous;
      return previous.map((occupant, index) => index === flower ? bee : occupant);
    });
    setSelected(null);
    if (keyboard) {
      const nextBee = slots.find((index) => index !== bee && !assignments.includes(index));
      beeButtons.current[nextBee]?.focus();
    }
  }

  return (
    <>
      <CareScene {...scene}>
        {flowerPositions.map(([x, y], index) => {
          const bee = assignments[index];
          const occupied = bee !== null;

          return (
            <button
              key={x}
              className="plant-care__target plant-care__flower"
              type="button"
              ref={(element) => { flowerButtons.current[index] = element; }}
              style={position(x, y)}
              aria-label={`Flor ${index + 1}, ${occupied ? "polinizada" : "livre"}`}
              aria-disabled={occupied}
              data-available={!occupied && selected !== null}
              data-done={occupied}
              onClick={(event) => placeBee(selected, index, event.detail === 0)}
              onDragOver={(event) => {
                if (!occupied && event.dataTransfer.types.includes("application/x-rocketbloom-bee")) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => {
                const dragBee = event.dataTransfer.getData("application/x-rocketbloom-bee");
                if (dragBee === "") return;
                event.preventDefault();
                placeBee(Number(dragBee), index, false);
              }}
            >
              <span className="plant-care__flower-head" aria-hidden="true">
                <img src={`${labAssets}plant-05.webp`} alt="" draggable="false" />
              </span>
              {occupied && <img className="plant-care__flower-bee" src={`${careAssets}bee.webp`} alt="" draggable="false" />}
              {occupied && <GameIcon name="check" className="plant-care__target-check" />}
            </button>
          );
        })}
      </CareScene>
      <CareControls count={count} progressLabel="flores polinizadas" onFinish={onFinish}>
        <div className="plant-care__bee-tray" role="group" aria-label="Bandeja de abelhas">
          {slots.map((bee) => {
            const placed = assignments.includes(bee);

            return (
              <button
                key={bee}
                className="plant-care__bee"
                type="button"
                ref={(element) => { beeButtons.current[bee] = element; }}
                aria-label={`Abelha ${bee + 1}${placed ? ", na flor" : ""}`}
                aria-pressed={selected === bee}
                disabled={placed}
                draggable={!placed}
                onClick={(event) => chooseBee(bee, event.detail === 0)}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-rocketbloom-bee", String(bee));
                  event.dataTransfer.effectAllowed = "move";
                  chooseBee(bee, false);
                }}
              >
                <img src={`${careAssets}bee.webp`} alt="" draggable="false" />
                {placed && <GameIcon name="check" className="plant-care__bee-check" />}
              </button>
            );
          })}
        </div>
      </CareControls>
    </>
  );
}

function CleanCare({ onFinish, ...scene }) {
  const [strokes, setStrokes] = useState([0, 0, 0]);
  const [brushPatch, setBrushPatch] = useState(null);
  const drag = useRef(null);
  const count = strokes.filter((amount) => amount === cleaningGoal).length;
  const brushPosition = brushPatch === null ? ["75%", "56%"] : patchPositions[brushPatch];

  function scrub(index) {
    setBrushPatch(index);
    setStrokes((amounts) => addCare(amounts, index, 1, cleaningGoal));
  }

  function startScrub(event) {
    const patch = event.target.closest("[data-care-patch]");
    if (!event.isPrimary || event.button !== 0 || !patch) return;
    patch.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, swiped: false };
  }

  function moveScrub(event) {
    const movement = drag.current;
    if (movement?.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - movement.x, event.clientY - movement.y);
    if (distance < 15) return;
    const patch = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-care-patch]");
    if (!patch || !event.currentTarget.contains(patch)) return;
    drag.current = { ...movement, x: event.clientX, y: event.clientY, swiped: true };
    scrub(Number(patch.dataset.carePatch));
  }

  function endScrub(event) {
    if (drag.current?.id === event.pointerId) drag.current.id = null;
  }

  return (
    <>
      <CareScene
        {...scene}
        onPointerDown={startScrub}
        onPointerMove={moveScrub}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onLostPointerCapture={endScrub}
      >
        <img
          className="plant-care__brush"
          src={`${careAssets}brush.webp`}
          style={position(...brushPosition)}
          data-used={brushPatch !== null}
          alt=""
          draggable="false"
        />
        {patchPositions.map(([x, y], index) => {
          const remaining = cleaningGoal - strokes[index];
          const clean = remaining === 0;
          const patchStatus = remaining === 1 ? "1 passada restante" : `${remaining} passadas restantes`;

          return (
            <button
              key={x}
              className="plant-care__target plant-care__patch"
              type="button"
              style={{ ...position(x, y), "--care-dirt": remaining / cleaningGoal }}
              aria-label={`Mancha ${index + 1}, ${clean ? "limpa" : patchStatus}`}
              aria-disabled={clean}
              data-care-patch={index}
              data-done={clean}
              onClick={(event) => {
                if (!clean && (event.detail === 0 || !drag.current?.swiped)) scrub(index);
              }}
            >
              <img src={`${careAssets}dirt.webp`} alt="" draggable="false" />
              {clean && <GameIcon name="check" className="plant-care__target-check" />}
            </button>
          );
        })}
      </CareScene>
      <CareControls count={count} progressLabel="manchas removidas" onFinish={onFinish} />
    </>
  );
}

export function PlantCareGame({ gameId, planetName, plantName, currentPlantImage, nextPlantImage, targetStage, onComplete, onClose }) {
  const dialog = useRef(null);
  const heading = useRef(null);
  const committed = useRef(false);
  const [complete, setComplete] = useState(false);
  const titleId = useId();
  const detailId = useId();
  const game = games[gameId];

  useLayoutEffect(() => {
    const modal = dialog.current;
    if (!modal) return undefined;
    modal.showModal();
    heading.current?.focus();
    return () => {
      if (modal.open) modal.close();
    };
  }, []);

  useLayoutEffect(() => {
    if (complete) heading.current?.focus();
  }, [complete]);

  function finish() {
    if (committed.current) return;
    committed.current = true;
    setComplete(true);
    onComplete();
  }

  if (!game) return null;

  const Play = game.play;
  return (
    <dialog
      ref={dialog}
      className={`plant-care plant-care--${gameId}`}
      aria-labelledby={titleId}
      aria-describedby={detailId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="plant-care__header">
        <div>
          <p className="plant-care__context">{planetName} <span aria-hidden="true">·</span> Estágio {targetStage}</p>
          <h2 id={titleId} ref={heading} tabIndex={-1}>{complete ? "Planta cresceu!" : game.title}</h2>
          <p className="plant-care__instructions" id={detailId}>
            {complete ? `${plantName} chegou ao estágio ${targetStage}.` : game.instructions}
          </p>
        </div>
        <button className="plant-care__close" type="button" aria-label="Fechar minijogo" onClick={onClose}>
          <img src={`${assetBase}assets/menu/close.webp`} alt="" draggable="false" />
        </button>
      </header>
      {complete ? (
        <>
          <div className="plant-care__success">
            <CareScene backdrop={game.backdrop} plantImage={nextPlantImage} plantName={plantName} />
          </div>
          <div className="plant-care__controls plant-care__controls--success">
            <button className="plant-care__action" type="button" onClick={onClose}>Voltar ao laboratório</button>
          </div>
        </>
      ) : (
        <Play plantImage={currentPlantImage} plantName={plantName} backdrop={game.backdrop} onFinish={finish} />
      )}
    </dialog>
  );
}
