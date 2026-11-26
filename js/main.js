//--------------------------------------------------------VARIABLES
const arena = document.getElementById("arena");
const arenaBackground = document.getElementById("arenaBackground");
const apiTimeout = 1000;

let gameOver = false;
let whoseTurn = "Aliado";
let matchDelayMultiplier = 1;

let activeAliado;
let activeEnemigo;
let enemySwitchPromise = Promise.resolve();
let climate = "";
let mochilaMenuState = null;
let preguntaAccion = "";

const items = {
  "pocion-normal": { name: "Poción Normal", effect: "Recovery", ps: 25, rarity: 1 },
  "super-pocion": { name: "Super Poción", effect: "Recovery", ps: 67, rarity: 2 },
  "hiper-pocion": { name: "Híperpoción", effect: "Recovery", ps: 150, rarity: 3 },
  "restaurador-total": { name: "Restaurador Total", effect: "FullRestore", ps: "Full", pp: "Full", rarity: 4 },
  "revivir": { name: "Revivir", effect: "Revive", ps: "30%", rarity: 4 },
  "revivir-max": { name: "Revivir Max", effect: "ReviveMax", ps: "Full", pp: "Full", rarity: 7 }
};
const teamInventories = { Aliado: {}, Enemigo: {} };

const characterType = ["Fuego", "Agua", "Planta", "Pelea", "Volador", "Piedra"]
const regularAttackMoves = [
  { name: "Porrazo", type: "Normal", accuracy: 10, category: "contact", pp: 25, multiplier: 2 },
  { name: "Tortazo vital", type: "Normal", accuracy: 10, category: "contact", pp: 15, multiplier: 2.5 },
  { name: "Ataque currado", type: "Normal", accuracy: 10, category: "contact", pp: 20, multiplier: 3 }
];

const typeEffectiveness = {
  Fuego: { Planta: 2.5, Agua: 0.75, Fuego: 1, Pelea: 1, Volador: 1, Piedra: 1, Normal: 1 },
  Planta: { Agua: 2.5, Fuego: 0.75, Planta: 1, Pelea: 1, Volador: 1, Piedra: 1, Normal: 1 },
  Agua: { Fuego: 2.5, Planta: 0.75, Agua: 1, Pelea: 1, Volador: 1, Piedra: 1, Normal: 1 },
  Pelea: { Planta: 1, Agua: 1, Fuego: 1, Pelea: 1, Volador: 0.75, Piedra: 2.5, Normal: 1 },
  Volador: { Agua: 1, Fuego: 1, Planta: 1, Pelea: 2.5, Volador: 1, Piedra: 0.75, Normal: 1 },
  Piedra: { Fuego: 1, Planta: 1, Agua: 1, Pelea: 0.75, Volador: 2.5, Piedra: 1, Normal: 1 },
  Normal: { Fuego: 1, Planta: 1, Agua: 1, Pelea: 1, Volador: 1, Piedra: 1, Normal: 1 }
};

const emojiTypes = { Normal: "✊", Planta: "🍃", Fuego: "🔥", Agua: "💦", Pelea : "🤜", Volador : "💨", Piedra : "🌑", Healing : "💊" };
const typedAttackMoves = {
  Fuego: [
    { name: "Llamarada", type: "Fuego", accuracy: 95, category: "ranged", pp: 8, multiplier: 2.5 },
    { name: "Bola de fuego", type: "Fuego", accuracy: 100, category: "ranged", pp: 15, multiplier: 2.25 },
    { name: "Explosión ígnea", type: "Fuego", accuracy: 80, category: "aoe", pp: 5, multiplier: 2.75 }
  ],
  Agua: [
    { name: "Chorro de agua", type: "Agua", accuracy: 95, category: "ranged", pp: 25, multiplier: 2.25 },
    { name: "Tsunami", type: "Agua", accuracy: 80, category: "aoe", pp: 3, multiplier: 3 },
    { name: "67 de agua", type: "Agua", accuracy: 95, category: "contact", pp: 10, multiplier: 2.5 }
  ],
  Planta: [
    { name: "Latigazo de lianas", type: "Planta", accuracy: 100, category: "contact", pp: 10, multiplier: 2.5 },
    { name: "Hoja afilada", type: "Planta", accuracy: 95, category: "ranged", pp: 25, multiplier: 2.25 },
    { name: "Onda vital", type: "Planta", accuracy: 80, category: "aoe", pp: 5, multiplier: 2.75 }
  ],
  Pelea: [
    { name: "Zapesote", type: "Pelea", accuracy: 100, category: "contact", pp: 8, multiplier: 2.5 },
    { name: "Chiricuazo", type: "Pelea", accuracy: 95, category: "contact", pp: 15, multiplier: 2.25 },
    { name: "Quebradora", type: "Pelea", accuracy: 80, category: "contact", pp: 5, multiplier: 2.75 }
  ],
  Volador: [
    { name: "Ciudad Juarez", type: "Volador", accuracy: 90, category: "ranged", pp: 25, multiplier: 2.25 },
    { name: "Polvadero", type: "Volador", accuracy: 90, category: "contacto", pp: 3, multiplier: 3 },
    { name: "Rafaga de pura tierra", type: "Volador", accuracy: 100, category: "aoe", pp: 10, multiplier: 2.5 }
  ],
  Piedra: [
    { name: "Bomba de tubo", type: "Piedra", accuracy: 95, category: "aoe", pp: 10, multiplier: 2.5 },
    { name: "Apiedrada", type: "Piedra", accuracy: 100, category: "ranged", pp: 25, multiplier: 2.25 },
    { name: "Meteoro casero", type: "Piedra", accuracy: 80, category: "contact", pp: 5, multiplier: 3 }
  ]
};


const randomNames = ["Dem", "Dani", "Arlet", "Alberto, no Adalberto", "5000", "Tonto", "Gato", "Gatillo", "Feline", "Cesaron", "Victorin"];
const insults = ["Knob", "Blockhead", "Silly", "Stupid", "Idiotic", "Moronic", "Baboso/e", "Taradeitor 2000", "Tonoto", "Smelly", "Loser"];
const randomInsultFallback = () => insults[Math.floor(Math.random() * insults.length)];
const randomAge = () => Math.floor(Math.random() * 21) + 50;

const climates = ["Soleado", "Lluvioso", "Caluroso"];
const ClimateMultiplier = {
  Soleado: { Fuego: 1.25, Agua: 0.9, Planta: 1.5, Pelea: 1.3, Volador: 0.8, Piedra: 0.9, Normal: 1 },
  Lluvioso: { Fuego: 0.8, Agua: 1.5, Planta: 1.25, Pelea: 1.1, Volador: 1.25, Piedra: 0.8, Normal: 1 },
  Caluroso: { Fuego: 1.5, Agua: 0.9, Planta: 0.75, Pelea: 0.75, Volador: 1, Piedra: 1.3, Normal: 1 }
};

const msgBox = document.getElementById("textColumn")
let defaultMsgBox = `
        <div class="box msg has-text-black" id="mensajeAccion">
          <span><span class= "has-text-weight-bold" id="turnoActual">Equipo ${whoseTurn}</span> • Turno en progreso.</span>
          <p id="preguntaAccion">¿Qué quieres que haga -Insertar Gate-?</p>
          <span id="instruccionesAccion">(Haz click, o usa teclado para elegir un botón)</span>
        </div>`
let msgAccion = document.getElementById("mensajeAccion");
let pregAccion = document.getElementById("preguntaAccion");
let btnsAccion = document.getElementById("botonesAccion");

const botonPelear = document.getElementById("botonPelear");
const botonPersonajes = document.getElementById("botonPersonajes");
const botonMochila = document.getElementById("botonMochila");
const botonHuir = document.getElementById("botonHuir");

const elegirPersonaje = document.getElementById("botonElegirPersonaje")
const cancelarMochila = document.getElementById("botonCancelarMochila")

const enviarPersonaje = document.getElementById("enviarPersonaje")
const cancelarPersonaje = document.getElementById("cancelarPersonaje")

const reiniciar = document.getElementById("reiniciar")
const salir = document.getElementById("salir")

const actionButtons = [botonPelear, botonPersonajes, botonMochila, botonHuir];
const mochilaButtons = [elegirPersonaje, cancelarMochila];
const personajeButtons = [enviarPersonaje, cancelarPersonaje]
const endgameButtons = [reiniciar, salir]

//--------------------------------------------------------FUNCTIONS

async function killTeam(team, message) {
  team.forEach(character => {
    character.health = 0;
  });

  const affiliation = team[0].afiliation;
  const activeCharacter = affiliation === "Aliado" ? activeAliado : activeEnemigo;
  if (activeCharacter) loadPlayerData(activeCharacter);

  const endgameMessage = message;
  await endGame(endgameMessage);
}

//-------CREATE STUFF 

function mainScreen() {
  const portraitsAliados = window.equipoAliado.slice(0, 3).map((character, index) => {
    const portraitIds = ["firstPortrait", "secondPortrait", "thirdPortrait"];
    return `<span class="personajes-retratos-main-screen" id="${portraitIds[index]}"><img src="${character.portrait}" alt="Retrato de ${character.firstName}"></span>`;
  }).join("");

  const portraitsEnemigos = window.equipoEnemigo.slice(0, 3).map((character, index) => {
    const portraitIds = ["firstPortrait", "secondPortraitPartTwo", "thirdPortrait"];
    return `<span class="personajes-retratos-main-screen" id="${portraitIds[index]}"><img src="${character.portrait}" alt="Retrato de ${character.firstName}"></span>`;
  }).join("");

  document.getElementById("Aliados").innerHTML = `${portraitsAliados}`
  document.getElementById("Enemigos").innerHTML = `${portraitsEnemigos}`
}

function randomClimate() {
  const selectedClimate = climates[Math.floor(Math.random() * climates.length)];
  const climateClass = {
    Soleado: "clima-soleado",
    Lluvioso: "clima-lluvioso",
    Caluroso: "clima-caluroso"
  };

  arenaBackground.classList.remove("clima-soleado", "clima-lluvioso", "clima-caluroso");
  arenaBackground.classList.add(climateClass[selectedClimate]);
  return selectedClimate;
}

function updatePreguntaAccion(personaje) {
  preguntaAccion = "¿Qué quieres que haga " + personaje.firstName + "?";
  document.getElementById("preguntaAccion").textContent = preguntaAccion;
}

function generateUserInfoFallback() {
  const name = randomNames[Math.floor(Math.random() * randomNames.length)];
  return {
    name,
    age: randomAge(),
  };
}

async function requestWithFallback(request, fallback, errorMessage) {
  let timeoutId;
  try {
    const controller = new AbortController();
    const requestPromise = request(controller.signal);
    const timeoutFallback = new Promise(resolve => {
      timeoutId = setTimeout(() => {
        controller.abort();
        console.error(`${errorMessage} (request timed out)`);
        resolve(fallback());
      }, apiTimeout);
    });

    return await Promise.race([requestPromise, timeoutFallback]);
  } catch (error) {
    console.error(errorMessage, error);
    return fallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadPortraitFallback(name) {
  const portraitUrl = `https://cataas.com/avatar/${encodeURIComponent(name)}?`;
  try {
    return await new Promise(resolve => {
      const image = new Image();
      let timeoutId;
      const finish = portrait => {
        clearTimeout(timeoutId);
        image.onload = null;
        image.onerror = null;
        resolve(portrait);
      };

      timeoutId = setTimeout(() => {
        console.error("Character portrait request timed out");
        finish("resources/placeholder.webp");
      }, apiTimeout);
      image.onload = () => finish(portraitUrl);
      image.onerror = () => {
        console.error("Unable to load character portrait");
        finish("resources/placeholder.webp");
      };
      image.src = portraitUrl;
    });
  } catch (error) {
    console.error("Unable to load character portrait:", error);
    return "resources/placeholder.webp";
  }
}

async function generateUser() {
  const userPromise = requestWithFallback(async signal => {
    const response = await fetch(
      "https://randomuser.me/api/?inc=name,dob&noinfo",
      { signal }
    );
    if (!response.ok) {
      throw new Warning("Failed to generate user");
    }

    const data = await response.json();
    const user = data.results[0];
    if (user.dob.age < 40) {
      user.dob.age = user.dob.age + 35;
    }

    return { name: user.name.first, age: user.dob.age };
  }, generateUserInfoFallback, "Error generating user name and age");

  const insultPromise = requestWithFallback(async signal => {
    const response = await fetch("https://insult.mattbas.org/api/adjective", { signal });
    if (!response.ok) {
      throw new Warning("Failed to fetch insult");
    }

    const insult = (await response.text()).trim();
    if (!insult) {
      throw new Warning("Empty insult response");
    }
    return insult;
  }, randomInsultFallback, "Error generating user insult");

  const user = await userPromise;
  const [insult, portrait] = await Promise.all([
    insultPromise,
    loadPortraitFallback(user.name)
  ]);

  const speed = Math.max(51, user.age < 50 ? user.age * 2 : user.age);

  return {
    firstName: `${insult.charAt(0).toUpperCase()}${insult.slice(1)} ${user.name}`,
    age: user.age,
    portrait,
    speed
  };
}

function assignAttacks(character) {
  const typeAttacks = typedAttackMoves[character.type];
  const selectTwo = moves => {
    const available = [...moves];
    const selected = [];

    for (let i = 0; i < 2; i++) {
      const move = available.splice(Math.floor(Math.random() * available.length), 1)[0];
      selected.push({ ...move, category: move.category, maxPP: move.pp });
    }

    return selected;
  };

  character.attacks = [...selectTwo(regularAttackMoves), ...selectTwo(typeAttacks)];
}

function calculateStats(character) {
  character.health = Math.round(200 - 120 * Math.exp(-character.age / 40));
  character.initialHealth = character.health;
  character.attack = character.age * 1.5;
  character.defense = character.age * 0.5;
  character.speed = 120 - character.age;
  character.type = characterType[Math.floor(Math.random() * characterType.length)];

  return character;
}

async function generateTeam(afiliation) {
  const team = [];

  for (let i = 0; i < 3; i++) {
    const character = await generateUser();

    if (!character) continue;

    character.afiliation = afiliation;
    calculateStats(character);
    assignAttacks(character);
    team.push(character);
  }

  return team;
}

function generateInventory() {
  const inventory = {};
  const itemIds = Object.keys(items);
  const rolls = 3 + Math.floor(Math.random() * 5);
  const totalWeight = itemIds.reduce((total, itemId) => total + 1 / items[itemId].rarity, 0);

  for (let roll = 0; roll < rolls; roll++) {
    let choice = Math.random() * totalWeight;
    for (const itemId of itemIds) {
      choice -= 1 / items[itemId].rarity;
      if (choice <= 0) {
        inventory[itemId] = (inventory[itemId] || 0) + 1;
        break;
      }
    }
  }
  return inventory;
}

//------------UPDATE STUFF

function updateHud(climate) {
  document.getElementById("clima").textContent = `Dia ${climate}`;
  document.getElementById("ventajaElemental").textContent = `(Fuego x${ClimateMultiplier[climate].Fuego}, Agua x${ClimateMultiplier[climate].Agua}, Planta x${ClimateMultiplier[climate].Planta}<br>Pelea x${ClimateMultiplier[climate].Pelea}, Volador x${ClimateMultiplier[climate].Volador}, Piedra x${ClimateMultiplier[climate].Piedra})`;
}

function loadPlayerData(personaje) {
  team = personaje.afiliation;
  const teamCharacters = window[`equipo${team}`];
  const healthProgress = document.getElementById("barraVida" + team);
  healthProgress.max = personaje.initialHealth;
  healthProgress.value = personaje.health;
  const healthRatio = Math.max(0, Math.min(1, personaje.health / personaje.initialHealth));
  healthProgress.parentElement.style.setProperty("--health-ratio", healthRatio);
  document.getElementById("vida" + team).textContent = `${personaje.health} / ${personaje.initialHealth}`;
  document.getElementById("indicadores" + team).textContent = teamCharacters
    .map(character => character.health > 0 ? "🟢" : "🔘")
    .join("");

  document.getElementById("nombre" + team).textContent = personaje.firstName;
  document.getElementById("tipo" + team).textContent = personaje.type;
  document.getElementById("nivel" + team).textContent = "Nivel " + personaje.age;
  document.getElementById("imagen" + team).src = personaje.portrait;
}

function animateHealthBarDamage(afiliation) {
  const healthBar = document.getElementById(`barraVida${afiliation}`).closest(".health-bar");
  void runAttackAnimation(healthBar, "taking-damage");
}

function manageButtons(buttons, toggle) {
  for (const button of buttons) {
    button.style.display = toggle ? "" : "none";
  }
}

//===============================================================================================================
//----------------------------------------------------GAMEPLAY---------------------------------------------------
//===============================================================================================================

//---------------------------------------ATTACK
//--------------ATTACK ANIMATIONS

function getArenaPoint(element) {
  const arenaRect = arena.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  return {
    x: elementRect.left + elementRect.width / 2 - arenaRect.left - arena.clientLeft,
    y: elementRect.top + elementRect.height / 2 - arenaRect.top - arena.clientTop
  };
}

function createAttackEffect(emoji, point, extraClass = "") {
  const effect = document.createElement("span");
  effect.className = `attack-effect ${extraClass}`.trim();
  effect.textContent = emoji;
  effect.setAttribute("aria-hidden", "true");
  effect.style.left = `${point.x}px`;
  effect.style.top = `${point.y}px`;
  arena.appendChild(effect);
  return effect;
}

function createEmojiSplash(type, point, directions) {
  const emoji = emojiTypes[type];
  return Promise.all(directions.map(async direction => {
    const particle = createAttackEffect(emoji, point, `attack-particle-${direction}`);
    await runAttackAnimation(particle, "attack-particle", true);
    particle.remove();
  }));
}

function runAttackAnimation(animatee, animationClass, keepClass = false) {
  return new Promise(resolve => {
    const handleAnimationEnd = event => {
      if (event.target !== animatee) return;

      animatee.removeEventListener("animationend", handleAnimationEnd);
      if (!keepClass) animatee.classList.remove(animationClass);
      resolve();
    };

    animatee.addEventListener("animationend", handleAnimationEnd);
    animatee.classList.add(animationClass);
  });
}

async function preloadPortrait(portrait) {
  const image = new Image();
  image.src = portrait;

  try {
    await image.decode();
  } catch (error) {
    console.error("Unable to preload character portrait:", error);
  }
}

async function attackAnimation(attacker, attackMove, defender, onImpact) {
  const attackerImage = document.getElementById(`imagen${attacker.afiliation}`);
  const defenderImage = document.getElementById(`imagen${defender.afiliation}`);
  const attackerCanvas = document.getElementById(`canvas${attacker.afiliation}`);
  const start = getArenaPoint(attackerImage);
  const target = getArenaPoint(defenderImage);
  const x = target.x - start.x;
  const y = target.y - start.y;
  const emoji = emojiTypes[attackMove.type];

  const applyImpact = () => {
    if (onImpact) {
      onImpact();
      const defenderCanvas = document.getElementById(`canvas${defender.afiliation}`);
      void runAttackAnimation(defenderCanvas, "hit-shake");
    }
  };

  if (attackMove.category === "contact") {
    const approachX = x * 0.68;
    const hand = createAttackEffect("👋", { x: start.x, y: start.y - 24 });
    attackerCanvas.style.setProperty("--attack-travel-x", `${approachX}px`);
    hand.style.setProperty("--attack-travel-x", `${approachX}px`);
    const approach = runAttackAnimation(attackerCanvas, "attack-contact");
    await runAttackAnimation(hand, "attack-hand-contact", true);
    applyImpact();
    hand.textContent = "👏";
    const splash = attackMove.type === "Normal"
      ? Promise.resolve()
      : createEmojiSplash(attackMove.type, { x: start.x + approachX, y: start.y - 24 }, [1, 3, 5, 7]);

    await Promise.all([approach, splash]);
    hand.remove();
    attackerCanvas.style.removeProperty("--attack-travel-x");
    return;
  }

  if (attackMove.category === "aoe") {
    const splash = createEmojiSplash(attackMove.type, getArenaPoint(attackerImage), [1, 2, 3, 4, 5, 6, 7, 8]);
    applyImpact();
    await splash;
    return;
  }

  const projectile = createAttackEffect(emoji, start);
  projectile.style.setProperty("--attack-travel-x", `${x}px`);
  projectile.style.setProperty("--attack-travel-y", `${y}px`);
  await runAttackAnimation(projectile, "attack-projectile", true);
  applyImpact();
  projectile.remove();
}

async function endGame(message) {
  if (gameOver) return;
  gameOver = true;

  await new Promise((resolve) => setTimeout(resolve, 2000 * matchDelayMultiplier));

  const losingSide = window.equipoAliado.every(character => character.health <= 0)
    ? "Aliado"
    : "Enemigo";
  const losingHud = document.getElementById(`estado${losingSide}`);
  const losingCanvas = document.getElementById(`canvas${losingSide}`);
  const losingCard = document.getElementById(`tarjeta${losingSide}`);
  losingHud.classList.add("endgame-loser");
  losingCanvas.classList.add("endgame-loser");
  losingCard.classList.add("endgame-loser");

  manageButtons(personajeButtons, false);
  manageButtons(mochilaButtons, false);
  manageButtons(actionButtons, false);
  btnsAccion.classList.replace("grid-4", "grid-2");
  manageButtons(endgameButtons, true);

  endgameButtons.forEach(button => button.disabled = false);

  document.getElementById("preguntaAccion").textContent = `${message}`;

  await Promise.all([
    runAttackAnimation(document.getElementById("canvasAliado"), "endgame-exit-left", true),
    runAttackAnimation(document.getElementById("canvasEnemigo"), "endgame-exit-right", true),
    runAttackAnimation(document.getElementById("tarjetaAliado"), "endgame-exit-left", true),
    runAttackAnimation(document.getElementById("tarjetaEnemigo"), "endgame-exit-right", true),
    runAttackAnimation(document.getElementById("estadoAliado"), "endgame-exit-up", true),
    runAttackAnimation(document.getElementById("estadoEnemigo"), "endgame-exit-up", true),
    runAttackAnimation(document.getElementById("ronda"), "endgame-exit-up", true),
  ]);

  mainScreen();
  const gameOverTitle = document.createElement("img");
  gameOverTitle.className = "main-title";
  gameOverTitle.src = "resources/GameOver.webp";
  gameOverTitle.alt = "";

  const losingPortraits = document.getElementById(losingSide === "Aliado" ? "Aliados" : "Enemigos");
  const allyPortraits = Array.from(document.querySelectorAll("#Aliados .personajes-retratos-main-screen"));
  const enemyPortraits = Array.from(document.querySelectorAll("#Enemigos .personajes-retratos-main-screen"));
  const endgameScreen = document.createElement("div");
  endgameScreen.id = "endgameScreen";
  endgameScreen.className = "endgame-screen";
  losingPortraits.classList.add("endgame-loser");
  endgameScreen.append(
    gameOverTitle,
    document.getElementById("Aliados"),
    document.getElementById("Enemigos")
  );
  arena.appendChild(endgameScreen);

  await Promise.all([
    runAttackAnimation(gameOverTitle, "endgame-main-title-enter", true),
    ...allyPortraits.map(portrait => runAttackAnimation(portrait, "endgame-portrait-ally-enter", true)),
    ...enemyPortraits.map(portrait => runAttackAnimation(portrait, "endgame-portrait-enemy-enter", true))
  ]);
}

function handleMorido(character) {
  if (character.health > 0) return;

  const team = character.afiliation === "Aliado"
    ? window.equipoAliado
    : window.equipoEnemigo;
  const replacement = team.find(member => member.health > 0 && member !== character);

  if (character.afiliation === "Enemigo") {
    setTimeout(() => {
      document.getElementById("imagenEnemigo").classList.add("derrotado");
    }, 1000);

    if (!replacement) {
      endGame("¡Todo el equipo enemigo ha sido derrotado! ¡Ganaste!");
      return;
    }

    const replacementPortraitReady = preloadPortrait(replacement.portrait);
    document.getElementById("preguntaAccion").textContent = `${character.firstName} fue debilitado.`;
    enemySwitchPromise = new Promise(resolve => setTimeout(resolve, 3000)).then(async () => {
      if (gameOver || activeEnemigo !== character) return;

      await animateCharacterSwitch("Enemigo", replacement, replacementPortraitReady);
      document.getElementById("preguntaAccion").textContent = `${replacement.firstName} entra en combate.`;
    });
    return;
  }

  setTimeout(() => {
    if (gameOver) return;
    if (!replacement) {
      endGame("Todo tu equipo ha sido debilitado. Fin del combate.");
      return;
    }

    whoseTurn = "Aliado";
    characterSwitch(true);
  }, 3000);
}

//------------------ATTACK LOGIC

function doesAttackLand(attacker, attackMove) {
  const accuracy = Math.max(0, Math.min(100, Number(attackMove.accuracy)));
  if (Math.random() * 100 < accuracy) return true;

  const speedChance = Math.max(0, Math.min(100, Number(attacker.speed)));
  return Math.random() * 100 < speedChance;
}

async function attack(attacker, attackMove, defender) {
  if (whoseTurn !== attacker.afiliation || defender.health <= 0 || attackMove.pp <= 0) return false;

  const effectiveness = typeEffectiveness[attackMove.type][defender.type];
  const damage = Math.round((attacker.attack * attackMove.multiplier * ClimateMultiplier[climate][attackMove.type] * effectiveness) / (defender.defense * 0.5));
  attackMove.pp = Math.max(attackMove.pp - 1, 0);

  if (!doesAttackLand(attacker, attackMove)) {
    await attackAnimation(attacker, attackMove, defender, null);
    msgBox.innerHTML = defaultMsgBox;
    msgAccion = document.getElementById("mensajeAccion");
    document.getElementById("turnoActual").textContent = `Equipo ${whoseTurn}`;
    document.getElementById("instruccionesAccion").remove();
    document.getElementById("preguntaAccion").textContent = `${attacker.firstName} usó ${attackMove.name}, pero falló.`;
    loadPlayerData(attacker);
    loadPlayerData(defender);
    console.log(`${attacker.firstName} usó ${attackMove.name} contra ${defender.firstName}, pero falló.`);
    return true;
  }

  await attackAnimation(attacker, attackMove, defender, () => {
    console.log(`${attacker.firstName} usa ${attackMove.name} contra ${defender.firstName}, infligiendo ${damage} de daño.`);
    defender.health = Math.max(defender.health - damage, 0);
    console.log(`${defender.firstName} ahora tiene ${defender.health} de salud.`);
    animateHealthBarDamage(defender.afiliation);

    msgBox.innerHTML = defaultMsgBox;
    msgAccion = document.getElementById("mensajeAccion");
    document.getElementById("turnoActual").textContent = `Equipo ${whoseTurn}`;
    document.getElementById("instruccionesAccion").remove();
    document.getElementById("preguntaAccion").textContent = `${attacker.firstName} usó ${attackMove.name} y causó ${damage} de daño a ${defender.firstName}.`;

    if (effectiveness === 0) {
      msgAccion.insertAdjacentHTML("beforeend", "<span>No tuvo efecto.</span>");
    } else if (effectiveness > 1) {
      msgAccion.insertAdjacentHTML("beforeend", "<span>¡Es super efectivo!</span>");
    } else if (effectiveness < 1) {
      msgAccion.insertAdjacentHTML("beforeend", "<span> No es muy efectivo.</span>");
    }

    loadPlayerData(attacker);
    loadPlayerData(defender);
    handleMorido(defender);
  });

  return true;
}

//------------------ITEMS

async function useItem(item, personaje) {
  const inventory = teamInventories[personaje.afiliation];
  const data = items[item];
  if (whoseTurn !== personaje.afiliation || !data || !inventory || inventory[item] < 1) return false;

  const isRevive = data.effect === "Revive" || data.effect === "ReviveMax";
  if ((isRevive && personaje.health > 0) || (!isRevive && personaje.health <= 0)) return false;

  if (data.effect === "Recovery") {
    if (personaje.health >= personaje.initialHealth) return false;
    personaje.health = Math.min(personaje.initialHealth, personaje.health + data.ps);
  } else if (data.effect === "FullRestore") {
    if (personaje.health >= personaje.initialHealth && personaje.attacks.every(move => move.pp === move.maxPP)) return false;
    personaje.health = personaje.initialHealth;
    personaje.attacks.forEach(move => move.pp = move.maxPP);
  } else if (data.effect === "Revive") {
    personaje.health = Math.max(1, Math.round(personaje.initialHealth * 0.3));
  } else if (data.effect === "ReviveMax") {
    personaje.health = personaje.initialHealth;
    personaje.attacks.forEach(move => move.pp = move.maxPP);
  }

  inventory[item]--;
  loadPlayerData(personaje);
  document.getElementById("preguntaAccion").textContent = personaje.afiliation === "Aliado"
    ? `Usaste ${data.name} en tu aliado ${personaje.firstName}.`
    : `${personaje.firstName} recibió ${data.name}.`;
  const targetLocation = getArenaPoint(document.getElementById(`imagen${personaje.afiliation}`))
  const splash = createEmojiSplash("Healing", targetLocation, [1, 2, 3, 4, 5, 6, 7, 8]);
  await splash;
  const activeCharacter = personaje.afiliation === "Aliado" ? activeAliado : activeEnemigo;
  if (activeCharacter && activeCharacter !== personaje) loadPlayerData(activeCharacter);
  return true;
}

//------------------PERSONAJES

async function animateCharacterSwitch(afiliation, character, portraitReady = preloadPortrait(character.portrait)) {
  await portraitReady;

  const canvas = document.getElementById(`canvas${afiliation}`);
  const portraitImage = document.getElementById(`imagen${afiliation}`);
  const animationClass = `cambio-${afiliation.toLowerCase()}`;

  await runAttackAnimation(canvas, animationClass, true);

  if (afiliation === "Aliado") {
    activeAliado = character;
  } else {
    activeEnemigo = character;
  }

  loadPlayerData(character);
  try {
    await portraitImage.decode();
  } catch (error) {
    console.error("Unable to decode character portrait:", error);
  }

  portraitImage.classList.remove("derrotado");
  const entranceClass = `entrada-${afiliation.toLowerCase()}`;
  const entranceAnimation = runAttackAnimation(canvas, entranceClass);
  canvas.classList.remove(animationClass);
  await entranceAnimation;
}

function characterSwitch(forced = false) {
  msgBox.innerHTML = defaultMsgBox;
  document.getElementById("preguntaAccion").textContent = forced
    ? `${activeAliado.firstName} fue debilitado. Debes elegir otro personaje.`
    : "¿Qué gato enviarás al combate?";

  if (whoseTurn !== "Aliado" || !activeAliado) return;

  arena.style.display = "none";
  const personajes = document.getElementById("personajes");
  const team = window.equipoAliado;
  if (!personajes) return;

  const statusOf = character => character.health <= 0
    ? { label: "Debilitado", state: "debilitado"}
    : character === activeAliado
      ? { label: "En combate", state: "combate"}
      : { label: "Disponible", state: "disponible"};

  const portraits = team.slice(0, 3).map(character =>
    `<img src="${character.portrait}" alt="Retrato de ${character.firstName}">`
  ).join("");

  manageButtons(actionButtons, false)
  manageButtons(personajeButtons, true)
  const sendButton = document.getElementById("enviarPersonaje");
  const cancelButton = document.getElementById("cancelarPersonaje");
  sendButton.disabled = true;
  cancelButton.style.display = "";
  cancelButton.disabled = forced;
  btnsAccion.classList.replace("grid-4", "grid-2")

  personajes.style.display = "block";
  personajes.innerHTML = `
    <div class="menuGui-ventana main-gui">
      <header class="menuGui-titulo">
        <span class="personajes-retratos">${portraits}</span>PERSONAJES
      </header>
      <div class="columns m-2" aria-label="Personajes del equipo" style="min-height: 88%; overflow-y: auto;">
        ${team.map((character, index) => {
          const status = statusOf(character);
          if (status.state === "disponible"){tag = `tag is-success`} else if (status.state === "combate"){tag = `tag is-warning`} else {tag = `tag is-danger`}
          if (character.type === "Planta"){typeTag = `tag is-success`} else if (character.type === "Agua"){typeTag = `tag is-info`} else if (character.type === "Fuego") {typeTag = `tag is-danger`} else if (character.type === "Volador") {typeTag = `tag is-link`} else if (character.type === "Piedra") {typeTag = `tag is-warning`} else if (character.type === "Pelea") {typeTag = `tag is-danger`}
          const selectable = character.health > 0 && character !== activeAliado;
          return `<div class="column is-one-third">
            <div class="card personaje-tarjeta ${status.state} has-text-black" style="height: 100%; margin: auto;" data-personaje="${index}" title="${status.tooltip}" aria-label="${character.firstName}: ${status.label}. ${status.tooltip}" aria-disabled="${!selectable}" tabindex="${selectable ? 0 : -1}">
              <div class="mx-4">
                <div class="personaje-estado mt-2 px-0"><span class="${tag}">${status.label}</span><span>Nivel ${character.age}</span></div>
                <div class="personaje-retrato my-2 ${status.state}"><img src="${character.portrait}" alt=""></div>
                <div class="personaje-datos">
                  <h3 class="has-text-weight-bold">${character.firstName}</h3>
                  <span class="${typeTag}">${character.type}</span>
                  <span>${character.health} / ${character.initialHealth} PS</span><progress class="progress is-success my-2 personaje-vida" value="${character.health}" max="${character.initialHealth}">${character.health} / ${character.initialHealth}</progress>
                </div>
                <div class="column is-full has-text-right" style="margin-top: 40%;">
                  <span class="has-text-weight-bold" data-personaje-estado="${index}">${status.state === "combate" ? "En combate" : character === activeAliado ? "Seleccionado" : character.health > 0 ? "Puede combatir" : "No puede combatir"}</span>
                </div>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;

  let selectedCharacter = null;
  personajes.querySelectorAll("[data-personaje]").forEach(button => {
    button.addEventListener("click", () => {
      selectedCharacter = team[Number(button.dataset.personaje)];
      if (!selectedCharacter || selectedCharacter.health <= 0 || selectedCharacter === activeAliado) return;
      personajes.querySelectorAll(".personaje-tarjeta").forEach(card => card.classList.toggle("seleccionado", card === button));
      personajes.querySelectorAll("[data-personaje-estado]").forEach(label => {
        const character = team[Number(label.dataset.personajeEstado)];
        label.textContent = character === selectedCharacter ? "Seleccionado" : character.health > 0 ? "Puede combatir" : "No puede combatir";
      });
      sendButton.disabled = false;
      document.getElementById("preguntaAccion").textContent = `¿Enviar a ${selectedCharacter.firstName} al combate?`;
    });
  });

  const closeScreen = () => {
    personajes.style.display = "none";
    personajes.innerHTML = "";
    personajes.className = "";
    document.getElementById("arena").style.display = "";
    document.getElementById("menuAcciones").style.display = "";

    manageButtons(personajeButtons, false)
    manageButtons(actionButtons, true)
    btnsAccion.classList.replace("grid-2", "grid-4")
  };
  sendButton.onclick = async () => {
    if (whoseTurn !== "Aliado" || !selectedCharacter || selectedCharacter.health <= 0) return;
    const nextCharacter = selectedCharacter;
    sendButton.disabled = true;
    closeScreen();
    for (const button of actionButtons) {
      button.disabled = true;
    }

    await animateCharacterSwitch("Aliado", nextCharacter);
    document.getElementById("preguntaAccion").textContent = `${activeAliado.firstName} entra en combate.`;
    completePlayerMove();
  };
  cancelButton.onclick = () => {
    if (forced) return;
    closeScreen();
    actionButtons.forEach(button => button.disabled = false);
    msgBox.innerHTML = defaultMsgBox;
    document.getElementById("preguntaAccion").textContent = `¿Qué quieres que haga ${activeAliado.firstName}?`;
  };
}

//------------MOCHILA

function mostrarMochila(personaje) {
  const mochila = document.getElementById("mochila");
  let selectedItem = Object.keys(items).find(itemId => teamInventories[personaje.afiliation][itemId] > 0) || Object.keys(items)[0];

  msgBox.innerHTML = defaultMsgBox;
  mochila.innerHTML = `
    <div class="menuGui-ventana main-gui" id="ventanaMochila">

      <!-- ENCABEZADO -->
      <header class="menuGui-titulo" id="tituloMochila">
        <span class="menuGui-titulo-icono" id="iconoTituloMochila"></span>
        <span id="textoTituloMochila">MOCHILA</span>
      </header>

      <!-- CUERPO: detalle (izquierda) + lista de objetos (derecha) -->
      <div class="menuGui-cuerpo" id="cuerpoMochila">

        <!-- DETALLE DEL OBJETO SELECCIONADO -->
        <aside class="menuGui-detalle" id="detalleItem" style="align-self: start;">
          <div class="menuGui-detalle-cabecera">
              <div class="menuGui-icono" id="detalleIcono">🎒</div>
              <h2 class="menuGui-detalle-nombre" id="detalleNombre"></h2>
          </div>

          <p class="menuGui-detalle-efecto" id="detalleEfecto">
            <span id="detalleCantidadPS"></span>
          </p>

          <p class="menuGui-detalle-descripcion" id="detalleDescripcion">
            <span id="detalleDescripcion"></span>
          </p>

          <ul class="menuGui-detalle-reglas" id="detalleReglas">
            <li id="reglaMaximo">No puede superar los PS máximos.</li>
            <li id="reglaDebilitado">No funciona en un Gato debilitado.</li>
          </ul>

          <div class="menuGui-detalle-nota" id="detalleNota">
            <span class="menuGui-nota-icono">ⓘ</span>
            <span id="textoNota">Al usar la poción, consumes un turno</span>
          </div>
        </aside>

        <!-- LISTA DE OBJETOS -->
        <div class="menuGui-lista" id="listaItems">

          <!-- Objeto seleccionado: lleva la clase "seleccionado" -->
          ${Object.entries(items).filter(([itemId]) => teamInventories[personaje.afiliation][itemId] > 0).map(([itemId, item]) => `
            <button class="menuGui-item" data-item="${itemId}">
              <span class="menuGui-item-flecha">▶</span>
              <span class="menuGui-icono ${itemId}">🎒</span>
              <span class="menuGui-item-info">
                <span class="menuGui-item-nombre">${item.name}</span>
                <span class="menuGui-item-efecto">${item.ps === "Full" ? "Recuperación completa" : item.effect === "Revive" ? "Revivir con 30% PS" : `Recuperas ${item.ps} PS`}</span>
              </span>
              <span class="menuGui-item-cantidad">×${teamInventories[personaje.afiliation][itemId]}</span>
            </button>`).join("")}
        </div>
      </div>

    </div>
  `;

  document.getElementById("preguntaAccion").textContent = "¿Qué item deseas usar?";
  manageButtons(actionButtons, false);
  manageButtons(mochilaButtons, true);
  btnsAccion.classList.replace("grid-4", "grid-2")
  
  arena.style.display = "none";
  mochila.style.display = "block";

  const showItemDetails = () => {
    const item = items[selectedItem];
    document.getElementById("detalleNombre").textContent = item.name;
    document.getElementById("detalleCantidadPS").textContent = item.ps === "Full" ? "PS y PP completos" : `${item.ps} PS`;
    document.getElementById("detalleDescripcion").textContent = item.effect.startsWith("Revive") ? "Reanima a un personaje debilitado." : "Recupera salud del personaje seleccionado.";
    document.querySelectorAll(".menuGui-item").forEach(button => button.classList.toggle("seleccionado", button.dataset.item === selectedItem));
  };
  document.querySelectorAll(".menuGui-item").forEach(button => button.addEventListener("click", () => {
    selectedItem = button.dataset.item;
    showItemDetails();
    pregAccion.textContent = `Elige ${items[selectedItem].name}`;
  }));
  showItemDetails();
  
  const openTargetScreen = () => {
    const equipo = personaje.afiliation === "Aliado" ? window.equipoAliado : window.equipoEnemigo;
    const data = items[selectedItem];
    const canApplyItem = target => {
      if (data.effect === "Revive" || data.effect === "ReviveMax") return target.health <= 0;
      if (target.health <= 0) return false;
      if (data.effect === "Recovery") return target.health < target.initialHealth;
      return target.health < target.initialHealth || target.attacks.some(move => move.pp < move.maxPP);
    };
    const personajes = document.getElementById("personajes");
    const portraits = equipo.slice(0, 3).map(target =>
      `<img src="${target.portrait}" alt="Retrato de ${target.firstName}">`
    ).join("");

    personajes.className = "menuGui";
    personajes.style.display = "block";
    mochila.style.display = "none";
    manageButtons(mochilaButtons, false);
    manageButtons(personajeButtons, true);
    enviarPersonaje.disabled = true;
    enviarPersonaje.innerHTML = `<span>✅ Aplicar ${data.name}</span>`;
    cancelarPersonaje.innerHTML = `<span>↩ Volver a mochila</span>`;
    document.getElementById("preguntaAccion").textContent = `¿Quién recibirá ${data.name}?`;
    personajes.innerHTML = `
      <div class="menuGui-ventana main-gui">
        <header class="menuGui-titulo">
          <span class="personajes-retratos">${portraits}</span>¿Usar ${data.name}?
        </header>
        <div class="columns m-2" aria-label="Personajes del equipo" style="min-height: 88%; overflow-y: auto;">
          ${equipo.map((target, index) => {
            const selectable = canApplyItem(target);
            const state = target.health <= 0 ? "debilitado" : target === activeAliado ? "combate" : "disponible";
            const label = target.health <= 0 ? "Debilitado" : state === "combate" ? "En combate" : "Disponible";
            const statusTag = state === "disponible" ? "tag is-success" : state === "combate" ? "tag is-warning" : "tag is-danger";
            const typeTag = target.type === "Planta" ? "tag is-success" : target.type === "Agua" ? "tag is-info" : target.type === "Pelea" ? "tag is-pelea" : target.type === "Volador" ? "tag is-link" : "tag is-warning";
            return `
              <div class="column is-one-third">
                <div class="card personaje-tarjeta ${state} has-text-black" style="height: 100%; margin: auto; ${selectable ? "" : "opacity: 0.6; cursor: not-allowed;"}" data-target="${index}" aria-label="${target.firstName}: ${label}" aria-disabled="${!selectable}" tabindex="${selectable ? 0 : -1}">
                  <div class="mx-4">
                    <div class="personaje-estado mt-2 px-0"><span class="${statusTag}">${label}</span><span>Nivel ${target.age}</span></div>
                    <div class="personaje-retrato my-2 ${state}"><img src="${target.portrait}" alt=""></div>
                    <div class="personaje-datos">
                      <h3 class="has-text-weight-bold">${target.firstName}</h3>
                      <span class="${typeTag}">${target.type}</span>
                      <span>${target.health} / ${target.initialHealth} PS</span><progress class="progress is-success my-2 personaje-vida" value="${target.health}" max="${target.initialHealth}">${target.health} / ${target.initialHealth} PS</progress>
                    </div>
                    <div class="column is-full has-text-right" style="margin-top: 40%;">
                      <span class="has-text-weight-bold" data-item-target-state="${index}">${selectable ? "Puede recibir el objeto" : "No puede recibir el objeto"}</span>
                    </div>
                  </div>
                </div>
              </div>`;
          }).join("")}
        </div>
      </div>`;

    let selectedTarget = null;
    personajes.querySelectorAll("[data-target]").forEach(button => button.addEventListener("click", () => {
      selectedTarget = equipo[Number(button.dataset.target)];
      if (!selectedTarget || !canApplyItem(selectedTarget)) return;
      personajes.querySelectorAll(".personaje-tarjeta").forEach(card => card.classList.toggle("seleccionado", card === button));
      personajes.querySelectorAll("[data-item-target-state]").forEach(label => {
        const target = equipo[Number(label.dataset.itemTargetState)];
        label.textContent = target === selectedTarget ? "Seleccionado" : canApplyItem(target) ? "Puede recibir el objeto" : "No puede recibir el objeto";
      });
      enviarPersonaje.disabled = false;
      document.getElementById("preguntaAccion").textContent = `¿Usar ${data.name} en ${selectedTarget.firstName}?`;
    }));
    enviarPersonaje.onclick = async () => {
      if (!selectedTarget) return;
      const target = selectedTarget;
      const item = selectedItem;
      personajes.style.display = "none";
      personajes.className = "";
      personajes.innerHTML = "";
      enviarPersonaje.innerHTML = `<span>✅ Enviar Gato</span>`;
      cancelarPersonaje.innerHTML = `<span>❌ Cancelar</span>`;
      manageButtons(personajeButtons, false);
      cerrarMochila();
      for (const button of actionButtons) button.disabled = true;
      const itemUsed = await useItem(item, target);
      if (!itemUsed) {
        document.getElementById("preguntaAccion").textContent = "No se pudo usar el objeto.";
        for (const button of actionButtons) button.disabled = false;
        return;
      }
      completePlayerMove();
    };
    cancelarPersonaje.onclick = () => {
      personajes.style.display = "none";
      personajes.className = "";
      personajes.innerHTML = "";
      enviarPersonaje.innerHTML = `<span>✅ Enviar Gato</span>`;
      cancelarPersonaje.innerHTML = `<span>❌ Cancelar</span>`;
      manageButtons(personajeButtons, false);
      mochila.style.display = "block";
      manageButtons(mochilaButtons, true);
      document.getElementById("preguntaAccion").textContent = `Elige ${data.name} o selecciona otro objeto.`;
    };
  };
  elegirPersonaje.onclick = openTargetScreen;
  cancelarMochila.onclick = () => cerrarMochila();
}

function cerrarMochila(message = "") {
  const mochila = document.getElementById("mochila");
  mochila.style.display = "none";
  manageButtons(actionButtons, true);
  manageButtons(mochilaButtons, false);
  btnsAccion.classList.replace("grid-2", "grid-4")
  arena.style.display = "";
  msgBox.innerHTML = defaultMsgBox;
  updatePreguntaAccion(activeAliado);
  if (message) document.getElementById("preguntaAccion").textContent = message;
  loadPlayerData(activeAliado, "Aliado");
}

//-----------------------------TURN MANAGEMENT
function completePlayerMove() {
  for (const button of actionButtons) {
    button.disabled = true;
  }
  if (whoseTurn !== "Aliado" || gameOver) return;
  whoseTurn = "Enemigo";
  document.getElementById("turnoActual").textContent = "Equipo Enemigo";
  setTimeout(() => {
    playTurn();
  }, 3000 * matchDelayMultiplier);
}

async function playEnemyMove() {
  if (activeEnemigo.health <= 0) {
    await enemySwitchPromise;
    if (gameOver || activeEnemigo.health <= 0) return;
  }

  const enemyTeam = window.equipoEnemigo;
  const inventory = teamInventories.Enemigo;
  const actions = [];
  const availableMoves = activeEnemigo.attacks.filter(move => move.pp > 0);

  availableMoves.forEach(move => {
    const effectiveness = typeEffectiveness[move.type][activeAliado.type];
    const expectedDamage = activeEnemigo.attack * move.multiplier * ClimateMultiplier[climate][move.type] * effectiveness / (activeAliado.defense * 0.5);
    actions.push({ type: "attack", move, weight: 1 + expectedDamage / 50 });
  });

  const healthRatio = activeEnemigo.health / activeEnemigo.initialHealth;
  if (healthRatio < 0.5) {
    const healingOptions = Object.keys(items)
      .filter(itemId => (inventory[itemId] || 0) > 0)
      .filter(itemId => items[itemId].effect === "Recovery" || items[itemId].effect === "FullRestore")
      .map(itemId => {
        const item = items[itemId];
        const healAmount = item.effect === "FullRestore" ? activeEnemigo.initialHealth : item.ps;
        const actualHealing = Math.min(healAmount, activeEnemigo.initialHealth - activeEnemigo.health);
        return { itemId, actualHealing };
      })
      .filter(option => option.actualHealing > 0)
      .sort((a, b) => a.actualHealing - b.actualHealing);
    const healingNeeded = activeEnemigo.initialHealth * (0.7 - healthRatio);
    const healingOption = healingOptions.find(option => option.actualHealing >= healingNeeded)
      || healingOptions[healingOptions.length - 1];

    if (healingOption) {
      actions.push({
        type: "heal",
        itemId: healingOption.itemId,
        weight: 1 + 2 * healingOption.actualHealing / activeEnemigo.initialHealth
      });
    }
  }

  const currentThreat = activeEnemigo.attacks.filter(move => move.pp > 0).reduce((best, move) =>
    Math.max(best, typeEffectiveness[move.type][activeAliado.type]), 0);
  if (healthRatio < 0.5 || currentThreat < 1) {
    enemyTeam.filter(character => character.health > 0 && character !== activeEnemigo).forEach(character => {
      const matchup = character.attacks.filter(move => move.pp > 0).reduce((best, move) =>
        Math.max(best, typeEffectiveness[move.type][activeAliado.type]), 0);
      if (character.health / character.initialHealth > healthRatio && matchup > currentThreat) {
        actions.push({ type: "switch", character, weight: 1 + matchup + 2 * (1 - healthRatio) });
      }
    });
  }

  if (actions.length === 0) {
    document.getElementById("preguntaAccion").textContent = `${activeEnemigo.firstName} no puede realizar ningún movimiento.`;
  } else {
    const totalWeight = actions.reduce((total, action) => total + action.weight, 0);
    let roll = Math.random() * totalWeight;
    const chosenAction = actions.find(action => (roll -= action.weight) <= 0) || actions[actions.length - 1];

    if (chosenAction.type === "attack") {
      await attack(activeEnemigo, chosenAction.move, activeAliado);
      if (gameOver || activeAliado.health <= 0) return;
    } else if (chosenAction.type === "heal") {
      await useItem(chosenAction.itemId, activeEnemigo);
    } else {
      await animateCharacterSwitch("Enemigo", chosenAction.character);
      document.getElementById("preguntaAccion").textContent = `${activeEnemigo.firstName} entra en combate.`;
    }
  }

  setTimeout(() => {
    whoseTurn = "Aliado";
    playTurn();
  }, 3000 * matchDelayMultiplier);
}

function playTurn() {
  if (gameOver) return;
  
  if (whoseTurn === "Aliado") {
    for (const button of mochilaButtons) {
      button.disabled = false;
    }
    for (const button of personajeButtons) {
      button.disabled = false;
    }
    for (const button of actionButtons) {
      button.disabled = false;
    }
    msgBox.innerHTML = defaultMsgBox;
    updatePreguntaAccion(activeAliado);
    return;

  } else if (whoseTurn === "Enemigo") {//------------------------------------AI ENEMY TURN
    for (const button of actionButtons) {
      button.disabled = true;
    }
    msgBox.innerHTML = defaultMsgBox;
    document.getElementById("turnoActual").textContent = "Equipo Enemigo";
    document.getElementById("preguntaAccion").textContent = "El enemigo está haciendo su movimiento...";


    setTimeout(playEnemyMove, 1000 * matchDelayMultiplier);
    return;
  }

  for (const button of actionButtons) {
    button.disabled = false;
  }
//  msgBox.innerHTML = defaultMsgBox;
}

//------------------------------------------------------------------------------------------------------INITIALIZE

async function setGame() {
  climate = randomClimate();

  const aliado = await generateTeam("Aliado");
  const enemigo = await generateTeam("Enemigo");
  window.equipoAliado = aliado;
  console.log(window.equipoAliado)
  window.equipoEnemigo = enemigo;
  console.log(window.equipoEnemigo)

  mainScreen()
  
  document.getElementById(`startGame`).addEventListener("click", async () => {
    const startButton = document.getElementById("startGame");
    startButton.disabled = true;
    await Promise.all([
      preloadPortrait(activeAliado.portrait),
      preloadPortrait(activeEnemigo.portrait)
    ]);

    document.getElementById(`mainMenu`).style.display = "none";
    document.getElementById(`arena`).style.display = "";
    document.getElementById(`menuAcciones`).style.display = "";

    actionButtons.forEach(button => button.disabled = true);
    await Promise.all([
      runAttackAnimation(document.getElementById("canvasAliado"), "entrada-aliado"),
      runAttackAnimation(document.getElementById("canvasEnemigo"), "entrada-enemigo"),
      runAttackAnimation(document.getElementById("tarjetaAliado"), "entrada-aliado"),
      runAttackAnimation(document.getElementById("tarjetaEnemigo"), "entrada-enemigo")
    ]);
    playTurn();
  });

  teamInventories.Aliado = generateInventory();
  teamInventories.Enemigo = generateInventory();

  console.log("Equipo aliado:", aliado);
  console.log("Equipo enemigo:", enemigo);

  activeAliado = aliado[0];
  activeEnemigo = enemigo[0];
  document.getElementById("turnoActual").textContent = "Equipo Aliado";
  updatePreguntaAccion(activeAliado);

  updateHud(climate);
  loadPlayerData(activeAliado, "Aliado");
  loadPlayerData(activeEnemigo, "Enemigo");

  document.getElementById("botonPelear").addEventListener("click", () => {
    msgBox.innerHTML = `
      <div class="btns grid-4 msg" id="botonesAccion">
        ${activeAliado.attacks.map((attackMove, index) => {
          const buttonClass = {
            Normal: "button",
            Fuego: "button is-danger",
            Agua: "button is-info",
            Planta: "button is-success",
            Pelea: "button is-danger",
            Volador: "button is-link",
            Piedra: "button is-warning"
          }[attackMove.type];
          const icon = {
            Normal: "👊",
            Fuego: "🔥",
            Agua: "💧",
            Planta: "🌿",
            Pelea: "🤜",
            Volador: "💨",
            Piedra: "🪨"
          }[attackMove.type];

          return `
            <button class="${buttonClass} is-dark" id="botonAtaque${index}" ${activeAliado.attacks[index].pp <= 0 ? "disabled" : ""}>
              <span>${icon} ${attackMove.name} (PP: ${activeAliado.attacks[index].pp})</span><span class="k">${index + 1}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    activeAliado.attacks.forEach((attackMove, index) => {
      document.getElementById(`botonAtaque${index}`).addEventListener("click", async () => {
        document.querySelectorAll("#botonesAccion .button").forEach(button => button.disabled = true);
        if (await attack(activeAliado, attackMove, activeEnemigo)) {
          completePlayerMove();
        }
      });
    });
  });

  document.getElementById("botonMochila").addEventListener("click", () => {
    mostrarMochila(activeAliado);
  });

  document.getElementById("botonPersonajes").addEventListener("click", () => characterSwitch());

  document.getElementById("botonHuir").addEventListener("click", () => {
    document.getElementById("preguntaAccion").textContent = "No puedes huir, estás amarrado a un boiler.";
    completePlayerMove();
  });

  actionButtons.forEach(button => button.disabled = true);
playTurn();

  const loadingScreen = document.getElementById("loadingScreen");
  loadingScreen.addEventListener("animationend", () => {
    loadingScreen.style.display = "none";
  }, { once: true });
  loadingScreen.classList.add("is-fading");
}

setGame();