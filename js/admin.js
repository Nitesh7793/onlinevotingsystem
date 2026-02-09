document.addEventListener("DOMContentLoaded", () => {
  if (!isAdminLoggedIn()) {
    window.location.href = "admin-login.html";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  const electionStatusLabel = document.getElementById("electionStatusLabel");
  const toggleElectionBtn = document.getElementById("toggleElectionBtn");
  const declareResultsBtn = document.getElementById("declareResultsBtn");
  const totalPartiesEl = document.getElementById("totalParties");
  const totalVotesEl = document.getElementById("totalVotes");
  const winningPartyNameEl = document.getElementById("winningPartyName");
  const winningPartyVotesEl = document.getElementById("winningPartyVotes");
  const partyTableBody = document.querySelector("#partyTable tbody");
  const voteTableBody = document.querySelector("#voteTable tbody");
  const voteCountTag = document.getElementById("voteCountTag");

  const partyForm = document.getElementById("partyForm");
  const partyIdInput = document.getElementById("partyId");
  const partyNameInput = document.getElementById("partyName");
  const partySymbolInput = document.getElementById("partySymbol");
  const partyLeaderInput = document.getElementById("partyLeader");
  const partyCandidateInput = document.getElementById("partyCandidate");
  const savePartyBtn = document.getElementById("savePartyBtn");
  const resetPartyFormBtn = document.getElementById("resetPartyFormBtn");

  function renderStats() {
    const parties = getParties();
    const votes = getVotes();
    const totalValid = votes.filter((v) => v.valid).length;
    totalPartiesEl.textContent = parties.length.toString();
    totalVotesEl.textContent = totalValid.toString();

    const running = getElectionRunning();
    electionStatusLabel.textContent = running ? "Live" : "Stopped";
    toggleElectionBtn.textContent = running ? "Stop Election" : "Start Election";
    toggleElectionBtn.classList.toggle("live", running);
    toggleElectionBtn.classList.toggle("stopped", !running);

    const declaredId = getDeclaredWinnerId();
    const tally = getTally();
    let winningParty = null;
    let winningVotes = 0;
    if (declaredId) {
      winningParty = parties.find((p) => p.id === declaredId) || null;
      winningVotes = tally[declaredId] || 0;
    } else {
      const auto = getWinningPartyAuto();
      winningParty = auto?.party || null;
      winningVotes = auto?.votes || 0;
    }

    if (winningParty && winningVotes > 0) {
      winningPartyNameEl.textContent = winningParty.name;
      winningPartyVotesEl.textContent = `${winningVotes} vote${winningVotes === 1 ? "" : "s"}`;
    } else {
      winningPartyNameEl.textContent = "Not declared";
      winningPartyVotesEl.textContent = "";
    }
  }

  function renderParties() {
    const parties = getParties();
    partyTableBody.innerHTML = "";
    parties.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.symbol}</td>
        <td>${p.leader}</td>
        <td>${p.candidate}</td>
        <td>
          <span class="status-badge ${p.active ? "active" : "disabled"}">
            ${p.active ? "Active" : "Disabled"}
          </span>
        </td>
        <td>
          <div class="action-group">
            <button class="btn-xs success" data-action="toggle" data-id="${p.id}">
              ${p.active ? "Disable" : "Enable"}
            </button>
            <button class="btn-xs" data-action="edit" data-id="${p.id}">Edit</button>
            <button class="btn-xs danger" data-action="delete" data-id="${p.id}">Remove</button>
          </div>
        </td>
      `;
      partyTableBody.appendChild(tr);
    });
  }

  function renderVotes() {
    const votes = getVotes();
    const parties = getParties();
    voteTableBody.innerHTML = "";
    votes
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((v) => {
        const party = parties.find((p) => p.id === v.partyId);
        const date = new Date(v.timestamp);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${v.voterName}</td>
          <td>${v.voterId}</td>
          <td>${party ? party.name : "Removed party"}</td>
          <td>${party ? party.candidate : "-"}</td>
          <td>${date.toLocaleString()}</td>
          <td>
            <span class="status-badge ${v.valid ? "valid" : "invalid"}">
              ${v.valid ? "Valid" : "Invalid"}
            </span>
          </td>
          <td>
            <div class="action-group">
              <button class="btn-xs ${v.valid ? "danger" : "success"}"
                data-action="toggle-valid" data-id="${v.id}">
                ${v.valid ? "Invalidate" : "Validate"}
              </button>
              <button class="btn-xs danger" data-action="delete" data-id="${v.id}">
                Delete
              </button>
            </div>
          </td>
        `;
        voteTableBody.appendChild(tr);
      });

    const validCount = votes.filter((v) => v.valid).length;
    voteCountTag.textContent = `${validCount} vote${validCount === 1 ? "" : "s"}`;
  }

  function refreshAll() {
    renderStats();
    renderParties();
    renderVotes();
  }

  // Event bindings
  logoutBtn.addEventListener("click", () => {
    setAdminSession(false);
    showToast("Logged out.", "success");
    setTimeout(() => {
      window.location.href = "admin-login.html";
    }, 400);
  });

  toggleElectionBtn.addEventListener("click", () => {
    const running = getElectionRunning();
    setElectionRunning(!running);
    showToast(!running ? "Election started." : "Election stopped.", "success");
    refreshAll();
  });

  declareResultsBtn.addEventListener("click", () => {
    const auto = getWinningPartyAuto();
    if (!auto) {
      setDeclaredWinner(null);
      showToast("No winner to declare yet.", "warning");
    } else {
      setDeclaredWinner(auto.party.id);
      showToast(`Results declared. Winner: ${auto.party.name}`, "success");
    }
    refreshAll();
  });

  partyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = partyNameInput.value.trim();
    const symbol = partySymbolInput.value.trim();
    const leader = partyLeaderInput.value.trim();
    const candidate = partyCandidateInput.value.trim();
    if (!name || !symbol || !leader || !candidate) {
      showToast("Please fill all party details.", "error");
      return;
    }
    const id = partyIdInput.value || undefined;
    upsertParty({ id, name, symbol, leader, candidate, active: true });
    showToast(id ? "Party updated." : "Party added.", "success");
    partyForm.reset();
    partyIdInput.value = "";
    savePartyBtn.textContent = "Add Party";
    refreshAll();
  });

  resetPartyFormBtn.addEventListener("click", () => {
    partyForm.reset();
    partyIdInput.value = "";
    savePartyBtn.textContent = "Add Party";
  });

  partyTableBody.addEventListener("click", (e) => {
    const target = e.target.closest("button[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!id) return;
    if (action === "toggle") {
      togglePartyActive(id);
      refreshAll();
    } else if (action === "edit") {
      const party = getParties().find((p) => p.id === id);
      if (!party) return;
      partyIdInput.value = party.id;
      partyNameInput.value = party.name;
      partySymbolInput.value = party.symbol;
      partyLeaderInput.value = party.leader;
      partyCandidateInput.value = party.candidate;
      savePartyBtn.textContent = "Update Party";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action === "delete") {
      if (confirm("Remove this party? Existing votes will stay for audit.")) {
        removeParty(id);
        refreshAll();
      }
    }
  });

  voteTableBody.addEventListener("click", (e) => {
    const target = e.target.closest("button[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!id) return;
    if (action === "toggle-valid") {
      const votes = getVotes();
      const vote = votes.find((v) => v.id === id);
      if (!vote) return;
      setVoteValidity(id, !vote.valid);
      refreshAll();
    } else if (action === "delete") {
      if (confirm("Delete this vote permanently?")) {
        deleteVote(id);
        refreshAll();
      }
    }
  });

  // Initial render
  refreshAll();
});


