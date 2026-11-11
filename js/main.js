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

const jugador1 = generateUser().then(user => {
  if (!user) return;

  console.log(user);

  document.getElementById("userPortrait").src = user.portrait;
  document.getElementById("userName").textContent = user.firstName;
  document.getElementById("userAge").textContent = user.age;
});