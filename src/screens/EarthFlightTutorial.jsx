import { useEffect, useRef, useState } from "react";
import { GameIcon } from "../components/GameIcon.jsx";
import "../styles/onboarding.css";

const CONTROLS = [
  { mode: "pointer", icon: "mouse", name: "Mouse ou dedo", detail: "Mova o mouse ou arraste o dedo para guiar o foguete." },
  { mode: "keyboard", icon: "keyboard", name: "Teclado", detail: "Use as setas ← → ou as teclas A e D para guiar o foguete." },
];

export function EarthFlightTutorial({ controlMode, onStart, onBack }) {
  const [mode, setMode] = useState(controlMode);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="earth-tutorial" aria-labelledby="earth-tutorial-title" aria-describedby="earth-tutorial-instructions"
      onCancel={(event) => { event.preventDefault(); onBack(); }}>
      <p className="eyebrow">Terra · Nível 1</p>
      <h1 id="earth-tutorial-title">Seu primeiro voo</h1>
      <p id="earth-tutorial-instructions">Desvie dos obstáculos, colete moedas e conduza o foguete até a faixa com a resposta certa. Os acertos aceleram a nave!</p>
      <fieldset className="earth-tutorial__controls">
        <legend>Como você quer jogar?</legend>
        {CONTROLS.map(({ mode: value, icon, name, detail }) => (
          <label key={value} className="earth-tutorial__choice">
            <input type="radio" name="earth-control-mode" value={value} checked={mode === value}
              onChange={() => setMode(value)} />
            <GameIcon name={icon} />
            <span><strong>{name}</strong><small>{detail}</small></span>
          </label>
        ))}
      </fieldset>
      <p className="earth-tutorial__note">Você pode mudar o controle depois, nas configurações.</p>
      <div className="mission-intro__actions">
        <button className="btn btn--ghost" type="button" onClick={onBack}>Voltar à seleção</button>
        <button className="btn" type="button" onClick={() => onStart(mode)}>Começar voo</button>
      </div>
    </dialog>
  );
}
