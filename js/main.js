//--------------------------------------------------------VARIABLES
let gameOver = false;
const arena = document.getElementById("arena");
let whoseTurn = "Aliado";
let activeAliado;
let activeEnemigo;
let climate = "";
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

const characterType = ["Fuego", "Agua", "Planta"]
const regularAttackMoves = [
  { name: "Porrazo", type: "Normal", pp: 25, multiplier: 1 },
  { name: "Tortazo vital", type: "Normal", pp: 15, multiplier: 1.5 },
  { name: "Ataque currado", type: "Normal", pp: 20, multiplier: 1.25 }
];
const typedAttackMoves = {
  Fuego: [
    { name: "Llamarada", type: "Fuego", pp: 5, multiplier: 2 },
    { name: "Bola de fuego", type: "Fuego", pp: 15, multiplier: 1.5 },
    { name: "Explosión ígnea", type: "Fuego", pp: 5, multiplier: 4 }
  ],
  Agua: [
    { name: "Chorro de agua", type: "Agua", pp: 25, multiplier: 2 },
    { name: "Tsunami", type: "Agua", pp: 3, multiplier: 4.5 },
    { name: "67 de agua", type: "Agua", pp: 10, multiplier: 1.5 }
  ],
  Planta: [
    { name: "Latigazo de lianas", type: "Planta", pp: 10, multiplier: 2.5 },
    { name: "Hoja afilada", type: "Planta", pp: 25, multiplier: 1.75 },
    { name: "Onda vital", type: "Planta", pp: 5, multiplier: 3.5 }
  ]
};

const typeEffectiveness = {
  Fuego: { Planta: 2, Agua: 0.5, Fuego: 1, Normal: 1 },
  Planta: { Agua: 2, Fuego: 0.5, Planta: 1, Normal: 1 },
  Agua: { Fuego: 2, Planta: 0.5, Agua: 1, Normal: 1 },
  Normal: { Fuego: 1, Planta: 1, Agua: 1, Normal: 1  }
};

const climates = ["Soleado", "Lluvioso", "Caluroso"];
const ClimateMultiplier = {
  Soleado: { Fuego: 1.25, Agua: 1, Planta: 1.5, Normal: 1 },
  Lluvioso: { Fuego: 0.5, Agua: 1.5, Planta: 1.25, Normal: 1 },
  Caluroso: { Fuego: 1.5, Agua: 0.5, Planta: 0.75, Normal: 1 }
};

const msgBox = document.getElementById("textColumn")
let defaultMsgBox = `
        <div class="box msg has-text-black" id="mensajeAccion">
          <span><span class= "has-text-weight-bold" id="turnoActual">Equipo ${whoseTurn}</span> • Elige una opción/acción.</span>
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
const cancelarPersonaje = document.getElementById("botonCancelarMochila")

const actionButtons = [botonPelear, botonPersonajes, botonMochila, botonHuir];
const mochilaButtons = [elegirPersonaje, cancelarPersonaje];

let mochilaMenuState = null;

//--------------------------------------------------------FUNCTIONS

//-------CREATE

function randomClimate() {
  return climates[Math.floor(Math.random() * climates.length)];
}

function updatePreguntaAccion(personaje) {
  preguntaAccion = "¿Qué quieres que haga " + personaje.firstName + "?";
  document.getElementById("preguntaAccion").textContent = preguntaAccion;
}

async function generateUser() {
  try {
    const response = await fetch(
      "https://randomuser.me/api/?inc=name,dob&noinfo"
    );

    if (!response.ok) {
      throw new Error("Failed to generate user");
    }

    const data = await response.json();
    const user = data.results[0];
    const adjectiveResponse = await fetch("https://insult.mattbas.org/api/adjective")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch adjective");
        return res.text();
      })
      .catch(() => "Silly");

    return {
      firstName: String(adjectiveResponse).charAt(0).toUpperCase() + String(adjectiveResponse).slice(1) + " " + user.name.first,
      age: user.dob.age,
      portrait: `https://cataas.com/avatar/${user.name.first}?`
    };

  } catch (error) {
    console.error("Error generating user:", error);
    return null;
  }
}

function assignAttacks(character) {
  const typeAttacks = typedAttackMoves[character.type];
  const selectTwo = moves => {
    const available = [...moves];
    const selected = [];

    for (let i = 0; i < 2; i++) {
      selected.push(available.splice(Math.floor(Math.random() * available.length), 1)[0]);
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

//------------UPDATE
function updateHud(round, climate) {
  document.getElementById("clima").textContent = `Dia ${climate}`;
  document.getElementById("numeroRonda").textContent = "Ronda " + round;
  document.getElementById("ventajaElemental").textContent = `(Fuego x${ClimateMultiplier[climate].Fuego}, Agua x${ClimateMultiplier[climate].Agua}, Planta x${ClimateMultiplier[climate].Planta})`;
}

function loadPlayerData(personaje) {
  team = personaje.afiliation;
  document.getElementById("barraVida" + team).max = personaje.initialHealth;
  document.getElementById("barraVida" + team).value = personaje.health;
  document.getElementById("vida" + team).textContent = `${personaje.health} / ${personaje.initialHealth}`;

  document.getElementById("nombre" + team).textContent = personaje.firstName;
  document.getElementById("tipo" + team).textContent = personaje.type;
  document.getElementById("nivel" + team).textContent = "Nivel " + personaje.age;
  document.getElementById("imagen" + team).src = personaje.portrait;
}

function manageButtons(buttons, toggle) {
  const elementId = buttons === "mochila" ? "mochilaButtons" : buttons;
  const buttonGroup = document.getElementById(elementId);
  if (!buttonGroup) return;

  buttonGroup.style.display = toggle ? "" : "none";
}

//===============================================================================================================
//----------------------------------------------------GAMEPLAY---------------------------------------------------
//===============================================================================================================

//---------------------------------------ATTACK
function attackAnimation(attacker, attackMove, defender) {
  const attackerImage = document.getElementById("canvas" + attacker.afiliation);
  const defenderImage = document.getElementById("canvas" + defender.afiliation);

  defenderImage.classList.add("hit-shake");
  setTimeout(() => {
    defenderImage.classList.remove("hit-shake");
  }, 1000);
}

function attack(attacker, attackMove, defender) {
  if (whoseTurn !== attacker.afiliation || defender.health <= 0 || attackMove.pp <= 0) return false;

  const effectiveness = typeEffectiveness[attackMove.type][defender.type];
  const damage = Math.round((attacker.attack * attackMove.multiplier * ClimateMultiplier[climate][attackMove.type] * effectiveness) / (defender.defense * 0.5));
  attacker.attacks[attacker.attacks.indexOf(attackMove)].pp = Math.max(attackMove.pp - 1, 0);
    console.log(`${attacker.firstName} usa ${attackMove.name} contra ${defender.firstName}, infligiendo ${damage} de daño.`);
  defender.health = Math.max(defender.health - damage, 0);
    console.log(`${defender.firstName} ahora tiene ${defender.health} de salud.`);

  attackAnimation(attacker, attackMove, defender);
  msgBox.innerHTML = `
    <div class="box msg has-text-black" id="mensajeAccion">
      <p id="preguntaAccion">${attacker.firstName} usó ${attackMove.name} y causó ${damage} de daño a ${defender.firstName}.</p>
    </div>`;
  msgAccion = document.getElementById("mensajeAccion");

  if (effectiveness === 0) {
    msgAccion.insertAdjacentHTML('beforeend', `<span>No tuvo efecto.</span>`);
  } else if (effectiveness > 1) {
    msgAccion.insertAdjacentHTML('beforeend', `<span>¡Es super efectivo!</span>`);
  } else if (effectiveness < 1) {
    msgAccion.insertAdjacentHTML('beforeend', `<span> No es muy efectivo.</span>`);
  }

      
  loadPlayerData(attacker);
  loadPlayerData(defender);
  return true;
}

//------------------ITEMS

function useItem(item, personaje) {
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
  msgBox.innerHTML = `<div class="box msg has-text-black"><p>${personaje.firstName} recibió ${data.name}.</p></div>`;
  return true;
}

//------------------PERSONAJES

function characterSwitch() {
  if (whoseTurn !== "Aliado" || !activeAliado) return;

  const personajes = document.getElementById("personajes");
  const team = window.equipoAliado || [];
  if (!personajes) return;

  if (!document.getElementById("personajesGuiStyles")) {
    const styles = document.createElement("style");
    styles.id = "personajesGuiStyles";
    styles.textContent = `
      #personajes.personajes-pantalla { position:fixed; inset:0; z-index:1000; overflow:auto; box-sizing:border-box; padding:clamp(16px,4vw,48px); color:#fff; background:radial-gradient(ellipse at top,#344d62,#111923 72%); }
      .personajes-ventana { max-width:1100px; min-height:100%; margin:auto; display:flex; flex-direction:column; gap:22px; }
      .personajes-encabezado,.personajes-pie { display:flex; align-items:center; gap:22px; padding:20px 24px; border:1px solid #ffffff35; border-radius:18px; background:#101923dd; }
      .personajes-retratos { display:flex; align-items:center; padding-left:12px; }
      .personajes-retratos img { width:64px; height:64px; object-fit:cover; border:3px solid white; border-radius:50%; background:#465566; }
      .personajes-retratos img + img { margin-left:-20px; }
      .personajes-afiliacion { margin:0; font-size:clamp(1.4rem,3vw,2rem); }
      .personajes-subtitulo { margin:5px 0 0; color:#c1cedb; }
      .personajes-tarjetas { display:grid; grid-template-columns:repeat(auto-fit,minmax(225px,1fr)); gap:18px; }
      .personaje-tarjeta { overflow:hidden; padding:0; color:white; text-align:left; border:1px solid #ffffff45; border-radius:16px; background:#192532; cursor:pointer; transition:transform .18s,border-color .18s; }
      .personaje-tarjeta:hover:not(:disabled),.personaje-tarjeta.seleccionado { transform:translateY(-3px); border-color:#ffe08a; box-shadow:0 0 0 2px #ffe08a55; }
      .personaje-tarjeta:disabled { cursor:not-allowed; }
      .personaje-estado { display:flex; justify-content:space-between; padding:12px 14px; font-weight:700; }
      .personaje-retrato { position:relative; height:175px; overflow:hidden; }
      .personaje-retrato::after { position:absolute; inset:0; content:""; background:linear-gradient(180deg,transparent 45%,#101923 100%); }
      .personaje-retrato img { width:100%; height:100%; object-fit:cover; }
      .personaje-retrato.disponible { background:linear-gradient(135deg,#237c70,#a0c96b); }
      .personaje-retrato.combate { background:linear-gradient(135deg,#bd7533,#efcf69); }
      .personaje-retrato.debilitado { background:linear-gradient(135deg,#4a4b56,#a4a4aa); filter:grayscale(.85); }
      .personaje-datos { padding:8px 16px 16px; }
      .personaje-datos h3 { margin:0 0 8px; font-size:1.2rem; }
      .personaje-ps { display:flex; justify-content:space-between; margin-bottom:7px; color:#d5deea; }
      .personaje-vida { width:100%; height:10px; accent-color:#68d391; }
      .personajes-pie { justify-content:space-between; }
      .personajes-mensaje { margin:0; color:#e0e8f0; }
      .personajes-acciones { display:flex; gap:10px; }
      .personajes-acciones button { padding:11px 20px; border:0; border-radius:10px; font:inherit; font-weight:700; cursor:pointer; }
      #enviarPersonaje { color:#17212b; background:#ffe08a; }
      #enviarPersonaje:disabled { opacity:.45; cursor:not-allowed; }
      #cancelarPersonaje { color:white; background:#465566; }
      @media(max-width:600px) { .personajes-encabezado { padding:15px; } .personajes-retratos img { width:50px;height:50px; } .personajes-pie { align-items:stretch; flex-direction:column; } .personajes-acciones button { flex:1; } }
    `;
    document.head.appendChild(styles);
  }

  const statusOf = character => character.health <= 0
    ? { label: "Debilitado", state: "debilitado", tooltip: "Está debilitado y no puede combatir." }
    : character === activeAliado
      ? { label: "En combate", state: "combate", tooltip: "Este gato está luchando actualmente." }
      : { label: "Disponible", state: "disponible", tooltip: "Está sano y puede entrar en combate." };
  const portraits = team.slice(0, 3).map(character =>
    `<img src="${character.portrait}" alt="Retrato de ${character.firstName}">`
  ).join("");

  actionButtons.forEach(button => button.disabled = true);
  personajes.className = "personajes-pantalla";
  personajes.style.display = "block";
  personajes.innerHTML = `
    <div class="personajes-ventana">
      <header class="personajes-encabezado">
        <div class="personajes-retratos">${portraits}</div>
        <div><h1 class="personajes-afiliacion">Equipo ${activeAliado.afiliation}</h1><p class="personajes-subtitulo">Elige quién continuará el combate</p></div>
      </header>
      <section class="personajes-tarjetas" aria-label="Personajes del equipo">
        ${team.map((character, index) => {
          const status = statusOf(character);
          const selectable = character.health > 0 && character !== activeAliado;
          return `<button type="button" class="personaje-tarjeta" data-personaje="${index}" title="${status.tooltip}" aria-label="${character.firstName}: ${status.label}. ${status.tooltip}" ${selectable ? "" : "disabled"}>
            <div class="personaje-estado"><span>${status.label}</span><span>Nivel ${character.age}</span></div>
            <div class="personaje-retrato ${status.state}"><img src="${character.portrait}" alt=""></div>
            <div class="personaje-datos"><h3>${character.firstName}</h3><div class="personaje-ps"><span>PS</span><span>${character.health} / ${character.initialHealth}</span></div><progress class="personaje-vida" max="${character.initialHealth}" value="${character.health}"></progress></div>
          </button>`;
        }).join("")}
      </section>
      <footer class="personajes-pie">
        <p class="personajes-mensaje" id="mensajeCambio">Selecciona un gato disponible. Cambiar consume un turno.</p>
        <div class="personajes-acciones"><button type="button" id="enviarPersonaje" disabled>Enviar gato</button><button type="button" id="cancelarPersonaje">Cancelar</button></div>
      </footer>
    </div>`;

  let selectedCharacter = null;
  const sendButton = document.getElementById("enviarPersonaje");
  personajes.querySelectorAll("[data-personaje]").forEach(button => {
    button.addEventListener("click", () => {
      selectedCharacter = team[Number(button.dataset.personaje)];
      personajes.querySelectorAll(".personaje-tarjeta").forEach(card => card.classList.toggle("seleccionado", card === button));
      sendButton.disabled = false;
      document.getElementById("mensajeCambio").textContent = `Enviar a ${selectedCharacter.firstName} al combate. Esta acción consume un turno.`;
    });
  });

  const closeScreen = () => {
    personajes.style.display = "none";
    personajes.innerHTML = "";
    personajes.className = "";
    document.getElementById("arena").style.display = "";
    document.getElementById("menuAcciones").style.display = "";
  };
  sendButton.addEventListener("click", () => {
    if (whoseTurn !== "Aliado" || !selectedCharacter || selectedCharacter.health <= 0) return;
    activeAliado = selectedCharacter;
    loadPlayerData(activeAliado);
    updatePreguntaAccion(activeAliado);
    closeScreen();
    msgBox.innerHTML = `<div class="box msg has-text-black"><p>${activeAliado.firstName} entra en combate.</p></div>`;
    completePlayerMove();
  });
  document.getElementById("cancelarPersonaje").addEventListener("click", () => {
    closeScreen();
    actionButtons.forEach(button => button.disabled = false);
    msgBox.innerHTML = defaultMsgBox;
    updatePreguntaAccion(activeAliado);
  });
}

//------------MOCHILA

function mostrarMochila(personaje) {
  const mochila = document.getElementById("mochila");
  const nombre = personaje.firstName;
  const inventario = teamInventories[personaje.afiliation];
  let selectedItem = Object.keys(items).find(itemId => inventario[itemId] > 0) || Object.keys(items)[0];

  mochila.innerHTML = `
    <div class="mochila-ventana main-gui" id="ventanaMochila">

      <!-- ENCABEZADO -->
      <header class="mochila-titulo" id="tituloMochila">
        <span class="mochila-titulo-icono" id="iconoTituloMochila"></span>
        <span id="textoTituloMochila">MOCHILA DE ${nombre.toUpperCase()}</span>
      </header>

      <!-- CUERPO: detalle (izquierda) + lista de objetos (derecha) -->
      <div class="mochila-cuerpo" id="cuerpoMochila">

        <!-- DETALLE DEL OBJETO SELECCIONADO -->
        <aside class="mochila-detalle" id="detalleItem">
          <div class="mochila-detalle-cabecera">
              <div class="mochila-icono" id="detalleIcono">🎒</div>
              <h2 class="mochila-detalle-nombre" id="detalleNombre"></h2>
          </div>

          <p class="mochila-detalle-efecto" id="detalleEfecto">
            <span id="detalleCantidadPS"></span>
          </p>

          <p class="mochila-detalle-descripcion" id="detalleDescripcion">
            <span id="detalleDescripcion"></span>
          </p>

          <ul class="mochila-detalle-reglas" id="detalleReglas">
            <li id="reglaMaximo">No puede superar los PS máximos.</li>
            <li id="reglaDebilitado">No funciona en un Gato debilitado.</li>
          </ul>

          <div class="mochila-detalle-nota" id="detalleNota">
            <span class="mochila-nota-icono">ⓘ</span>
            <span id="textoNota">Al usar la poción, consumes un turno</span>
          </div>
        </aside>

        <!-- LISTA DE OBJETOS -->
        <div class="mochila-lista" id="listaItems">

          <!-- Objeto seleccionado: lleva la clase "seleccionado" -->
          ${Object.entries(items).filter(([itemId]) => inventario[itemId] > 0).map(([itemId, item]) => `
            <button class="mochila-item" data-item="${itemId}">
              <span class="mochila-item-flecha">▶</span>
              <span class="mochila-icono ${itemId}">🎒</span>
              <span class="mochila-item-info">
                <span class="mochila-item-nombre">${item.name}</span>
                <span class="mochila-item-efecto">${item.ps === "Full" ? "Recuperación completa" : item.effect === "Revive" ? "Revivir con 30% PS" : `Recuperas ${item.ps} PS`}</span>
              </span>
              <span class="mochila-item-cantidad">×${inventario[itemId]}</span>
            </button>`).join("")}
        </div>
      </div>

    </div>
  `;


  pregAccion.textContent = "¿Qué item deseas usar?"
  actionButtons.forEach(button => button.style.display = "none");
  btnsAccion.classList.replace("grid-4", "grid-2")
  
  /*msgBox.style.display = "none";
  menuAcciones.insertAdjacentHTML("beforeend", `
    <div class="mochila-pie" id="pieMochila">
      <div class="mochila-mensaje" id="mensajeMochila">
        <small id="mensajeMochilaPersonaje">${nombre} -</small>
        <p id="mensajeMochilaAccion">Elige una Poción</p>
      </div>
      <div class="mochila-acciones" id="accionesMochila">
        <button class="mochila-boton elegir" id="botonElegirPersonaje">
          <span class="mochila-boton-icono"></span><span>Elegir Personaje</span>
        </button>
        <button class="mochila-boton cancelar" id="botonCancelarMochila">
          <span class="mochila-boton-icono"></span><span>Cancelar</span>
        </button>
      </div>
    </div>`)*/
  
  arena.style.display = "none";
  mochila.style.display = "block";

  const showItemDetails = () => {
    const item = items[selectedItem];
    document.getElementById("detalleNombre").textContent = item.name;
    document.getElementById("detalleCantidadPS").textContent = item.ps === "Full" ? "PS y PP completos" : `${item.ps} PS`;
    document.getElementById("detalleDescripcion").textContent = item.effect.startsWith("Revive") ? "Reanima a un personaje debilitado." : "Recupera salud del personaje seleccionado.";
    document.querySelectorAll(".mochila-item").forEach(button => button.classList.toggle("seleccionado", button.dataset.item === selectedItem));
  };
  document.querySelectorAll(".mochila-item").forEach(button => button.addEventListener("click", () => {
    selectedItem = button.dataset.item;
    showItemDetails();
    document.getElementById("mensajeMochilaAccion").textContent = `Elige ${items[selectedItem].name}`;
  }));
  showItemDetails();
  elegirPersonaje.addEventListener("click", () => {
    const lista = document.getElementById("listaItems");
    const equipo = personaje.afiliation === "Aliado" ? window.equipoAliado : window.equipoEnemigo;
    lista.innerHTML = equipo.map((target, index) => `
      <button class="mochila-item" data-target="${index}" ${target.health <= 0 && !items[selectedItem].effect.startsWith("Revive") ? "disabled" : ""}>
        <span class="mochila-item-nombre">${target.firstName}</span>
        <span class="mochila-item-cantidad">${target.health} / ${target.initialHealth} PS</span>
      </button>`).join("");
    lista.querySelectorAll("[data-target]").forEach(button => button.addEventListener("click", () => {
      const target = equipo[Number(button.dataset.target)];
      if (useItem(selectedItem, target)) {
        cerrarMochila();
        completePlayerMove();
      } else {
        document.getElementById("mensajeMochilaAccion").textContent = "No se puede usar ese objeto en este personaje.";
      }
    }));
  });
  cancelarMochila.addEventListener("click", cerrarMochila);
}

function cerrarMochila() {
  const mochila = document.getElementById("mochila");

  mochila.style.display = "none";
  mochila.innerHTML = "";
  document.getElementById("pieMochila")?.remove();
  if (mochilaMenuState) {
    msgBox.innerHTML = mochilaMenuState.msgBoxHTML;
    msgBox.style.display = mochilaMenuState.msgBoxDisplay;
    mochilaMenuState.buttons.forEach(({ button, hidden, display }) => {
      button.hidden = hidden;
      button.style.display = display;
    });
    mochilaMenuState = null;
  }
  document.getElementById("arena").style.display = "";
  document.getElementById("menuAcciones").style.display = "";
}

//-----------------------------TURN MANAGEMENT
function completePlayerMove() {
  if (whoseTurn !== "Aliado") return;
  setTimeout(() => {
    whoseTurn = "Enemigo";
    playTurn();
  }, 3000);
}

function playTurn() {
  if (gameOver) return;
  
  if (whoseTurn === "Aliado") {
    actionButtons.forEach(button => button.disabled = false);
    msgBox.innerHTML = defaultMsgBox;
    updatePreguntaAccion(activeAliado);
    return;
  } else if (whoseTurn === "Enemigo") {//------------------------------------AI ENEMY TURN
    actionButtons.forEach(button => button.disabled = true);
    msgBox.innerHTML = `
      <div class="box msg has-text-black">
        <span class="has-text-weight-bold">Turno enemigo</span>
        <p>El enemigo está haciendo su movimiento...</p>
      </div>`;

    setTimeout(() => {
      whoseTurn = "Aliado";
      playTurn();
    }, 100000);
    return;
  }

  actionButtons.forEach(button => button.disabled = false);
//  msgBox.innerHTML = defaultMsgBox;
}

//------------------------------------------------------------------------------------------------------INITIALIZE

async function setGame() {
  climate = randomClimate();

  const aliado = await generateTeam("Aliado");
  const enemigo = await generateTeam("Enemigo");
  window.equipoAliado = aliado;
  window.equipoEnemigo = enemigo;
  teamInventories.Aliado = generateInventory();
  teamInventories.Enemigo = generateInventory();

  console.log("Equipo aliado:", aliado);
  console.log("Equipo enemigo:", enemigo);

  activeAliado = aliado[0];
  activeEnemigo = enemigo[0];
  document.getElementById("turnoActual").textContent = "Equipo Aliado";
  updatePreguntaAccion(activeAliado);

  updateHud(1, climate);
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
            Planta: "button is-success"
          }[attackMove.type] || "button";
          const icon = {
            Normal: "👊",
            Fuego: "🔥",
            Agua: "💧",
            Planta: "🌿"
          }[attackMove.type] || "👊";

          return `
            <button class="${buttonClass} is-dark" id="botonAtaque${index}" ${activeAliado.attacks[index].pp <= 0 ? "disabled" : ""}>
              <span>${icon} ${attackMove.name} (PP: ${activeAliado.attacks[index].pp})</span><span class="k">${index + 1}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    activeAliado.attacks.forEach((attackMove, index) => {
      document.getElementById(`botonAtaque${index}`).addEventListener("click", () => {
        if (attack(activeAliado, attackMove, activeEnemigo)) {
          completePlayerMove();
        }
      });
    });
  });

  document.getElementById("botonMochila").addEventListener("click", () => {
    mostrarMochila(activeAliado);
  });

  document.getElementById("botonPersonajes").addEventListener("click", characterSwitch);

  actionButtons.forEach(button => button.disabled = true);
playTurn();
}

setGame();