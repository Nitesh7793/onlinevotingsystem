document.addEventListener("DOMContentLoaded", () => {
  const partyList = document.getElementById("partyList");
  const partyCountTag = document.getElementById("partyCountTag");
  const noPartiesMessage = document.getElementById("noPartiesMessage");
  const statusBanner = document.getElementById("electionStatusBanner");
  const voterNameInput = document.getElementById("voterName");
  const voterIdInput = document.getElementById("voterId");

  function renderStatus() {
    const running = getElectionRunning();
    const totalVotes = getTotalValidVotes();
    const pillClass = running ? "live" : "stopped";
    const label = running ? "Election is live" : "Election is currently stopped";
    statusBanner.innerHTML = `
      <div class="status-pill ${pillClass}">
        <span class="status-pill-dot"></span>
        <span>${label}</span>
      </div>
      <span class="muted">${totalVotes} vote${totalVotes === 1 ? "" : "s"} recorded</span>
    `;
  }

  function renderParties() {
    const parties = getActiveParties();
    const tally = getTally();
    partyList.innerHTML = "";
    if (!parties.length) {
      noPartiesMessage.style.display = "block";
      partyCountTag.textContent = "0 parties";
      return;
    }
    noPartiesMessage.style.display = "none";
    partyCountTag.textContent = `${parties.length} active part${parties.length === 1 ? "y" : "ies"}`;

    const running = getElectionRunning();
    const hasVoted = hasUserVoted((voterIdInput.value || "").trim());

    parties.forEach((p) => {
      const votes = tally[p.id] || 0;
      const card = document.createElement("div");
      card.className = "party-card";
      card.innerHTML = `
        <div class="party-header">
          <div>
            <div class="party-name">${p.name}</div>
            <div class="party-meta">Leader: ${p.leader}</div>
            <div class="party-meta">Candidate: ${p.candidate}</div>
          </div>
          <div class="party-symbol">${p.symbol}</div>
        </div>
        <div class="party-footer">
          <span class="vote-count-pill muted">${votes} vote${votes === 1 ? "" : "s"}</span>
          <button class="btn btn-primary vote-btn" data-id="${p.id}" ${
            running ? "" : "disabled"
          }>
            Vote
          </button>
        </div>
      `;
      if (hasVoted || !running) {
        const btn = card.querySelector("button");
        btn.disabled = true;
      }
      partyList.appendChild(card);
    });
  }

  function refreshAll() {
    renderStatus();
    renderParties();
  }

  partyList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const partyId = btn.dataset.id;
    const running = getElectionRunning();
    if (!running) {
      showToast("Election is not accepting votes currently.", "warning");
      return;
    }
    const voterName = voterNameInput.value.trim();
    const voterId = voterIdInput.value.trim();
    if (!voterName || !voterId) {
      showToast("Please enter your name and voter ID before voting.", "error");
      return;
    }
    if (hasUserVoted(voterId)) {
      showToast("You have already voted. Multiple voting is not allowed.", "error");
      refreshAll();
      return;
    }
    addVote({ voterName, voterId, partyId });
    showToast("Your vote has been recorded. Thank you!", "success");
    refreshAll();
  });

  // When voterId changes, re-check one-vote rule and update buttons
  voterIdInput.addEventListener("blur", () => {
    renderParties();
  });

  refreshAll();
});


