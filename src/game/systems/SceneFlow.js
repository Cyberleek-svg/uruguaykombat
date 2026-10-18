// Transiciones de escena seguras.
//
// IMPORTANTE: `game.scene.start(key)` (SceneManager) NO detiene la escena que lo
// llama. Si se usa directamente, las escenas se van apilando (Menu + Select +
// Game + GameOver activas a la vez) y sus handlers de teclado (ESC, ENTER) se
// pisan entre si, rompiendo ESC / Reintentar despues de cada pelea.
//
// goToScene() apaga TODAS las demas escenas y luego inicia la deseada usando el
// ScenePlugin (operaciones en cola), que es la via segura dentro del update.

export const SCENE_KEYS = ['BootScene', 'MenuScene', 'SelectScene', 'VersusScene', 'GameScene', 'GameOverScene'];

export function goToScene(fromScene, key, data) {
  const sp = fromScene.scene; // ScenePlugin de la escena actual
  const current = sp.key;

  // Apaga todas las demas escenas (la actual se apaga sola via sp.start).
  SCENE_KEYS.forEach((k) => {
    if (k !== key && k !== current && sp.isActive(k)) sp.stop(k);
  });

  // ScenePlugin.start encola stop(actual) + start(destino)
  sp.start(key, data);
}
