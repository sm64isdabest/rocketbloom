export function getActiveQuestion(snapshot) {
  return snapshot?.question ?? null;
}
