//--------------------------------------------------------VARIABLES

const characterType = ["Fuego", "Agua", "Planta"]
const regularAttackMoves = [
  { name: "Porrazo", type: "Normal", pp: 25, multiplier: 0.8 },
  { name: "Tortazo vital", type: "Normal", pp: 15, multiplier: 1.1 },
  { name: "Ataque currado", type: "Normal", pp: 20, multiplier: 1 }
];
const typedAttackMoves = {
  Fuego: [
    { name: "Llamarada", type: "Fuego", pp: 5, multiplier: 2 },
    { name: "Bola de fuego", type: "Fuego", pp: 15, multiplier: 1.5 },
    { name: "Explosión ígnea", type: "Fuego", pp: 5, multiplier: 3 }
  ],
  Agua: [
    { name: "Chorro de agua", type: "Agua", pp: 25, multiplier: 1.5 },
    { name: "Tsunami", type: "Agua", pp: 3, multiplier: 3.5 },
    { name: "67 de agua", type: "Agua", pp: 10, multiplier: 1.5 }
  ],
  Planta: [
    { name: "Latigazo de lianas", type: "Planta", pp: 10, multiplier: 2 },
    { name: "Hoja afilada", type: "Planta", pp: 25, multiplier: 1.5 },
    { name: "Onda vital", type: "Planta", pp: 5, multiplier: 3 }
  ]
};

const msgBox = document.getElementById("firstBottomColumn")

const botonPelear = document.getElementById("botonPelear")
const botonPersonajes = document.getElementById("botonPersonajes")
const botonMochila = document.getElementById("botonMochila")
const botonHuir = document.getElementById("botonHuir")

//--------------------------------------------------------FUNCTIONS

//-------CREATE

async function generateUser() {
  try {
    const response = await fetch(
      "https://randomuser.me/api/?inc=name,dob,picture&noinfo"
    );

    if (!response.ok) {
      throw new Error("Failed to generate user");
    }

    const data = await response.json();
    const user = data.results[0];

    return {
      firstName: user.name.first,
      age: user.dob.age,
      portrait: user.picture.large
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
  character.health = Math.round(character.age + Math.pow(Math.abs(100 - character.age) / 100, 2) * 100);
  character.initialHealth = character.health;
  character.attack = character.age * 1.5;
  character.defense = character.age * 0.75;
  character.speed = 120 - character.age;
  character.type = characterType[Math.floor(Math.random() * characterType.length)];

  return character;
}

async function generateTeam() {
  const team = [];

  for (let i = 0; i < 3; i++) {
    const character = await generateUser();

    if (!character) continue;

    calculateStats(character);
    assignAttacks(character);
    team.push(character);
  }

  return team;
}

//------------UPDATE

function loadPlayerData(personaje, team) {
  document.getElementById("barraVida" + team).max = personaje.initialHealth;
  document.getElementById("barraVida" + team).value = personaje.health;
  document.getElementById("vida" + team).textContent = `${personaje.health} / ${personaje.initialHealth}`;

  document.getElementById("nombre" + team).textContent = personaje.firstName;
  document.getElementById("tipo" + team).textContent = personaje.type;
  document.getElementById("nivel" + team).textContent = "Nivel " + personaje.age;
  document.getElementById("imagen" + team).src = personaje.portrait;
}


function attack(attacker, attackMove, defender) {
  if (defender.health <= 0) return;

  const damage = Math.round(attacker.attack * attackMove.multiplier - defender.defense);
  attackMove.pp = Math.max(attackMove.pp - 1, 0);
  defender.health = Math.max(defender.health - damage, 0);

  loadPlayerData(attacker, "Aliado");
  loadPlayerData(defender, "Enemigo");

  document.getElementById("preguntaAccion").textContent =
    defender.health === 0
      ? `${attacker.firstName} ha usado ${attackMove.name} y derrota a ${defender.firstName}.`
      : `${attacker.firstName} ha usado ${attackMove.name} e inflige ${damage} de daño.`;
}

//------------INITIALIZE

async function setGame() {
  const aliado = await generateTeam();
  const enemigo = await generateTeam();

  console.log("Equipo aliado:", aliado);
  console.log("Equipo enemigo:", enemigo);

  msgBox.innerHTML = `
    <div class="box msg has-text-black" id="mensajeAccion">
      <span><span class= "has-text-weight-bold" id="turnoActual">Aliado 1</span> • Elige una opción/acción.</span>
      <p id="preguntaAccion">¿Qué quieres que haga Gato Bobo?</p>
      <span id="instruccionesAccion">(Flechas, Enter para elegir, o toca un botón)</span>
    </div>
  `

  let activeAliado = aliado[0];
  let activeEnemigo = enemigo[0];
  document.getElementById("turnoActual").textContent = "Equipo aliado";
  document.getElementById("preguntaAccion").textContent = "Qué quieres que haga " + activeAliado.firstName + "?";

  loadPlayerData(activeAliado, "Aliado");
  loadPlayerData(activeEnemigo, "Enemigo");

  document.getElementById("botonPelear").addEventListener("click", () => {
    msgBox.innerHTML = `
      <div class="btns msg" id="botonesAccion">
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
            <button class="${buttonClass} is-dark" id="botonAtaque${index}" ${attackMove.pp <= 0 ? "disabled" : ""}>
              <span>${icon} ${attackMove.name} (PP: ${attackMove.pp})</span><span class="k">${index + 1}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    activeAliado.attacks.forEach((attackMove, index) => {
      document.getElementById(`botonAtaque${index}`).addEventListener("click", () => {
        attack(activeAliado, attackMove, activeEnemigo);
      });
    });
  });
}

setGame();