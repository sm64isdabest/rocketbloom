export function cullOffscreen(entities, viewHeight) {
  let retained = 0;
  for (const entity of entities) {
    if (entity.alive && entity.y <= viewHeight + 80) {
      entities[retained] = entity;
      retained += 1;
    } else {
      entity.alive = false;
    }
  }
  entities.length = retained;
  return entities;
}
