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

function loadPlayerData(personaje, team) {
  document.getElementById("nombre" + team).textContent = personaje.firstName
  document.getElementById("nivel" + team).textContent = "Nivel " + personaje.age
  document.getElementById("imagen" + team).src = personaje.portrait
}

function calculateStats(character) {
  character.health = Math.pow(
    Math.abs(100 - character.age) / 100, 2
  ) * 100;

  character.defense = character.age * 0.75;
  character.speed = 120 - character.age;

  return character;
}

async function generateTeam(teamName) {
  let teamNameh = [];

  for (let i = 0; i < 4; i++) {
    let character = await generateUser();

    if (!character) continue;

    calculateStats(character);

    team.push(character);
  }

  return team;
}

async function setGame() {
  generateTeam("Aliado")
  generateTeam("Enemigo")

}

setGame()