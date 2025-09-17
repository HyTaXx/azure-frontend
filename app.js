const API_BASE = "https://bayroumeter-func-arm.azurewebsites.net/api";
const API_KEY  = window.API_KEY;

let currentUserId = null;

document.getElementById("saveUser").addEventListener("click", async () => {
  const pseudo = document.getElementById("pseudo").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!pseudo || !email) {
    alert("Veuillez remplir pseudo et email");
    return;
  }

  const res = await fetch(`${API_BASE}/user?code=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo, email })
  });

  if (res.ok) {
    const user = await res.json();
    currentUserId = user.id;
    document.getElementById("userStatus").textContent = "✅ Utilisateur enregistré";
    document.getElementById("voteSection").classList.remove("hidden");
  } else {
    document.getElementById("userStatus").textContent = "❌ Erreur lors de l'enregistrement";
  }
});

document.getElementById("sendVote").addEventListener("click", async () => {
  if (!currentUserId) {
    alert("Identifiez-vous d'abord");
    return;
  }
  const choice = document.querySelector("input[name='choice']:checked");
  if (!choice) {
    alert("Choisissez Oui ou Non");
    return;
  }

  const res = await fetch(`${API_BASE}/vote?code=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUserId, choice: choice.value })
  });

  if (res.ok) {
    document.getElementById("voteStatus").textContent = "✅ Vote enregistré";
    loadResults();
  } else {
    document.getElementById("voteStatus").textContent = "❌ Erreur lors du vote";
  }
});

document.getElementById("refresh").addEventListener("click", loadResults);

async function loadResults() {
  const res = await fetch(`${API_BASE}/votes?code=${API_KEY}`);
  if (!res.ok) return;
  const data = await res.json();
  document.getElementById("stats").textContent =
    `Total: ${data.total} | Oui: ${data.yes} | Non: ${data.no} | % Oui: ${data.pctYes}%`;

  const list = document.getElementById("listVotes");
  list.innerHTML = "";
  data.items.forEach(v =>
    list.insertAdjacentHTML("beforeend",
      `<li>${v.userId.substring(0,6)}… : ${v.choice}</li>`));
}

// initial load
loadResults();

