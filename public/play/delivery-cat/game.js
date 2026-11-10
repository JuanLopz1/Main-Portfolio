const $ = id => document.getElementById(id);
const root = $("game");
const field = $("field");
const actors = $("actors");
const overlay = $("overlay");
const party = $("party");
const video = $("city-video");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const storageKey = "delivery-cat-lab1b-scores-v1";
let bridge;
const moveButtons = [...document.querySelectorAll("[data-direction]")];
const keyboard = new Map([["ArrowUp", 0], ["ArrowDown", 1], ["ArrowLeft", 2], ["ArrowRight", 3]]);
const held = new Map();
const nodes = new Map();
const clips = new Map();
const labels = { Pizza: "Pizza", Burger: "Burger", HotDog: "Hot dog", IceCream: "Ice cream" };
const soundFiles = {
  pickup: "Pickup.wav", delivery: "Delivery.wav", level: "LevelComplete.wav",
  hit: "Hit.wav", win: "Win.wav", "game-over": "GameOver.wav", party: "CatParty.wav"
};

let game = {
  phase: "menu", paused: false, level: 1, score: 0, lives: 3, served: 0,
  elapsedSeconds: 0, availableBonus: 180, carrying: null, highScores: [],
  food: [], customers: [], cars: [], cues: []
};
let ready = false;
let loading;
let screen = "menu";
let renderedScreen = "";
let ambientState = "";
let scoreNotice = "";
let soundEnabled = false;
let animation = 0;
let previous = 0;

function setText(id, value) {
  const element = $(id);
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

function asset(kind) {
  if (kind === "car") return "assets/car.svg";
  if (kind === "IceCream") return "assets/IceCream.svg";
  return "assets/" + kind + ".webp";
}

function image(kind) {
  const item = document.createElement("img");
  item.alt = "";
  item.draggable = false;
  item.src = asset(kind);
  return item;
}

function readScores() {
  try { return localStorage.getItem(storageKey) || ""; }
  catch { return ""; }
}

function saveScores() {
  try {
    localStorage.setItem(storageKey, game.scoreText);
    scoreNotice = "Saved in this browser.";
  } catch {
    scoreNotice = "This browser could not save the score. It is available until you close the game.";
  }
}

function invoke(method, ...args) {
  return JSON.parse(bridge[method](...args));
}

function boot() {
  if (loading) return loading;
  loading = (async () => {
    const { dotnet } = await import("./_framework/dotnet.js");
    const runtime = await dotnet.create();
    const config = runtime.getConfig();
    await runtime.runMain(config.mainAssemblyName, []);
    const exports = await runtime.getAssemblyExports(config.mainAssemblyName);
    bridge = exports.DeliveryCat.Browser.GameBridge;
    game = invoke("Load", readScores());
    ready = true;
  })();
  return loading;
}

function canMove() {
  return !game.paused && ["play", "complete", "road"].includes(game.phase);
}

function canAdvance() {
  return ready && !game.paused && ["play", "complete", "road", "hit", "transition"].includes(game.phase);
}

function clearHeld() {
  held.clear();
  for (const button of moveButtons) delete button.dataset.held;
  previous = 0;
}

function soundClip(name) {
  if (!clips.has(name)) {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = "assets/sounds/" + soundFiles[name];
    audio.volume = name === "party" ? .28 : .42;
    audio.loop = name === "party";
    clips.set(name, audio);
  }
  return clips.get(name);
}

function playCue(name) {
  if (!soundEnabled || game.paused || name === "party") return;
  const clip = soundClip(name);
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function syncAmbient() {
  const state = [game.phase, game.paused, reducedMotion.matches, soundEnabled].join("/");
  if (ambientState === state) return;
  ambientState = state;

  if (reducedMotion.matches) {
    video.pause();
    video.hidden = true;
    if (video.hasAttribute("src")) {
      video.removeAttribute("src");
      video.load();
    }
  } else if (canMove()) {
    if (!video.hasAttribute("src")) video.src = "assets/city.mp4";
    video.play().catch(() => { video.hidden = true; });
  } else {
    video.pause();
    if (["menu", "won", "lost"].includes(game.phase)) video.hidden = true;
  }

  if (game.phase === "party" && soundEnabled && !game.paused) {
    soundClip("party").play().catch(() => {});
  } else if (clips.has("party")) {
    const clip = clips.get("party");
    clip.pause();
    if (game.phase !== "party") clip.currentTime = 0;
  }
}

function button(label, action, primary = false) {
  const result = document.createElement("button");
  result.type = "button";
  result.dataset.action = action;
  result.textContent = label;
  if (primary) result.className = "primary";
  return result;
}

function panelState() {
  if (game.paused) return "pause";
  if (game.phase === "menu") return screen;
  return game.phase;
}

function renderPanel() {
  const panel = panelState();
  if (renderedScreen === panel) return;
  renderedScreen = panel;
  overlay.hidden = ["play", "complete", "road"].includes(panel);
  if (overlay.hidden) return;

  const details = $("screen-details");
  details.replaceChildren();
  const actions = $("screen-actions");
  actions.replaceChildren();
  const show = (title, copy, buttons = []) => {
    setText("screen-title", title);
    setText("screen-copy", copy);
    actions.append(...buttons);
  };
  const back = () => button("Back to menu", "menu");
  switch (panel) {
    case "help":
      show("How to play", "Use arrow keys or the directional buttons. Pick up one item and match it to a cat’s order. Avoid traffic from level 2. Unused time and remaining lives earn bonuses at the end of a level.", [back()]);
      break;
    case "scores": {
      show("High scores", game.highScores.length ? "Best completed runs in this browser." : "Finish a run to set your first score.", [back()]);
      if (game.highScores.length) {
        const scores = document.createElement("ol");
        for (const score of game.highScores) {
          const item = document.createElement("li");
          item.textContent = score + " points";
          scores.append(item);
        }
        details.append(scores);
      }
      break;
    }
    case "loading":
      show("Getting the game ready", "Loading the local game runtime.");
      break;
    case "error":
      show("The game could not load", "Reload the page to try again.", [button("Reload game", "reload", true)]);
      break;
    case "pause":
      show("Paused", "The clock and traffic are stopped.", [button("Resume delivery", "resume", true)]);
      break;
    case "hit":
      show("Ouch!", game.lives ? "−1 life. Your carried item comes with you." : "No lives left.");
      break;
    case "transition":
      show("Level " + (game.level + 1),
        "+" + game.lastTimeBonus + " time bonus · +" + game.lastLifeBonus + " lives bonus");
      break;
    case "party":
      show("Secret cat party", "Your delivery score is safe.");
      break;
    case "won":
    case "lost": {
      const title = panel === "won" ? "You win!" : "Game over";
      const record = game.newRecord ? "New high score. " : "";
      show(title, record + "Final score " + game.score + ". " + scoreNotice,
        [button("Play again", "start", true), back()]);
      const breakdown = document.createElement("dl");
      breakdown.className = "breakdown";
      for (const [label, value] of [["Deliveries", game.deliveryScore], ["Time bonus", game.timeBonus], ["Lives bonus", game.lifeBonus]]) {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const points = document.createElement("dd");
        term.textContent = label;
        points.textContent = value;
        row.append(term, points);
        breakdown.append(row);
      }
      details.append(breakdown);
      break;
    }
    default:
      show("Ready for the night shift?", "Four levels of orders, shortcuts, and traffic.",
        [button("Start delivery", "start", true), button("How to play", "help"), button("High scores", "scores")]);
  }
}

function paintWorld() {
  const current = new Set();
  const put = (tile, id) => {
    current.add(id);
    let actor = nodes.get(id);
    if (!actor) {
      actor = document.createElement("div");
      actor.className = "actor";
      actor.dataset.piece = tile.kind;
      actor.append(image(tile.kind));
      nodes.set(id, actor);
      actors.append(actor);
    }
    actor.style.left = 100 * tile.x / 900 + "%";
    actor.style.top = 100 * tile.y / 760 + "%";
    actor.style.width = 100 * tile.w / 900 + "%";
    actor.style.height = 100 * tile.h / 760 + "%";
    actor.style.zIndex = tile.kind === "courier" ? 3 : tile.kind === "car" ? 2 : 1;
    actor.dataset.served = String(tile.served);
    actor.dataset.flip = String(tile.kind === "car" && !tile.right);
    if (tile.order) {
      const order = tile.order.join("/");
      if (actor.dataset.order !== order) {
        actor.dataset.order = order;
        actor.querySelector(".order")?.remove();
        if (tile.order.length) {
          const bubble = document.createElement("div");
          bubble.className = "order";
          bubble.append(...tile.order.map(image));
          actor.append(bubble);
        }
      }
    }
  };

  if (!["menu", "party"].includes(game.phase)) {
    game.food.forEach(food => put(food, food.kind + "@" + food.x + "," + food.y));
    game.customers.forEach(cat => put(cat, cat.kind));
    game.cars.forEach((car, index) => put(car, "car-" + index));
    put(game.player, "courier");
  }
  for (const [id, node] of nodes) {
    if (!current.has(id)) {
      node.remove();
      nodes.delete(id);
    }
  }

  party.hidden = game.phase !== "party";
  if (!party.hidden && !party.hasChildNodes()) {
    for (let i = 0; i < 12; i++) party.append(image("cat-" + i % 3));
  }
}

function render() {
  root.dataset.phase = game.phase;
  root.dataset.paused = String(game.paused);
  setText("level", game.level + " / 4");
  setText("score", game.score);
  setText("served", game.served + " / 3");
  setText("lives", game.lives);
  setText("carrying", labels[game.carrying] || "Nothing");
  setText("clock", String(Math.floor(game.elapsedSeconds / 60)).padStart(2, "0") + ":" +
    String(game.elapsedSeconds % 60).padStart(2, "0"));
  setText("bonus", "+" + game.availableBonus);
  $("pause").disabled = ["menu", "won", "lost"].includes(game.phase) || game.paused;
  $("restart").disabled = ["menu", "won", "lost"].includes(game.phase);
  for (const control of moveButtons) control.disabled = !canMove();
  $("finish-area").hidden = !["complete", "road", "party"].includes(game.phase) || game.paused;
  const hints = {
    complete: "All orders delivered. Finish here or explore the road to the right.",
    road: "Cross to the upper-right exit to find the party.",
    party: "Celebrate and finish your run."
  };
  setText("route-hint", hints[game.phase] || "");
  paintWorld();
  renderPanel();
  syncAmbient();
}

function apply(next) {
  game = next;
  for (const cue of game.cues) {
    if (cue === "win" || cue === "game-over") saveScores();
    if (cue === "pickup") setText("announcements", "Picked up " + labels[game.carrying]);
    if (cue === "delivery") setText("announcements", "Order delivered. Score " + game.score + ".");
    if (cue === "hit") setText("announcements", "Traffic hit. " + game.lives + " lives remaining.");
    playCue(cue);
  }
  render();
  if (canAdvance() && !animation) animation = requestAnimationFrame(tick);
}

function tick(now) {
  animation = 0;
  if (!canAdvance()) { previous = 0; return; }
  if (!previous) previous = now;
  if (now - previous >= 25) {
    const elapsed = now - previous;
    previous = now;
    const latest = [...held.values()].at(-1);
    apply(invoke("Frame", elapsed, latest && now - latest.since >= 115 ? latest.direction : -1));
  }
  if (!animation && canAdvance()) animation = requestAnimationFrame(tick);
}

async function act(action) {
  if (action === "reload") { location.reload(); return; }
  if (action === "help" || (action === "menu" && !ready)) {
    screen = action;
    render();
    return;
  }
  if (!ready) {
    screen = "loading";
    render();
    try { await boot(); }
    catch (error) {
      console.error("Delivery Cat runtime could not start", error);
      screen = "error";
      render();
      return;
    }
  }
  clearHeld();
  screen = action === "scores" ? "scores" : "menu";
  if (action === "scores") { render(); return; }
  apply(invoke("Command", action));
  if (action === "start" || action === "resume") field.focus({ preventScroll: true });
  if (action === "pause" && document.hasFocus()) {
    overlay.querySelector('[data-action="resume"]')?.focus({ preventScroll: true });
  }
}

function press(token, direction) {
  if (!canMove() || held.has(token)) return;
  held.set(token, { direction, since: performance.now() });
  apply(invoke("Move", direction));
}

function pauseOnExit() {
  clearHeld();
  if (ready && !game.paused && !["menu", "won", "lost"].includes(game.phase)) void act("pause");
}

root.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action) void act(action);
});
$("pause").addEventListener("click", () => void act("pause"));
$("restart").addEventListener("click", () => void act("start"));
$("sound").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("sound").setAttribute("aria-pressed", String(soundEnabled));
  setText("sound", soundEnabled ? "Sound on" : "Sound off");
  if (!soundEnabled) for (const clip of clips.values()) clip.pause();
  syncAmbient();
});
video.addEventListener("playing", () => { if (!reducedMotion.matches) video.hidden = false; });
video.addEventListener("error", () => { video.hidden = true; });
reducedMotion.addEventListener("change", syncAmbient);
window.addEventListener("blur", pauseOnExit);
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseOnExit(); });

root.addEventListener("keydown", event => {
  if (event.key === "Escape" && ready && !["menu", "won", "lost"].includes(game.phase)) {
    event.preventDefault();
    if (!event.repeat) void act(game.paused ? "resume" : "pause");
    return;
  }
  const direction = keyboard.get(event.key);
  if (direction === undefined || !canMove()) return;
  event.preventDefault();
  if (!event.repeat) press(event.key, direction);
});
window.addEventListener("keyup", event => held.delete(event.key));

for (const control of moveButtons) {
  const direction = Number(control.dataset.direction);
  control.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !canMove()) return;
    event.preventDefault();
    control.setPointerCapture(event.pointerId);
    control.dataset.held = "true";
    press(event.pointerId, direction);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    control.addEventListener(type, event => {
      held.delete(event.pointerId);
      delete control.dataset.held;
    });
  }
  control.addEventListener("click", event => {
    if (event.detail === 0 && canMove()) apply(invoke("Move", direction));
  });
}

render();
