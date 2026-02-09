document.addEventListener("DOMContentLoaded", () => {
  const resultsStatusBanner = document.getElementById("resultsStatusBanner");
  const resultsList = document.getElementById("resultsList");
  const totalVotesTag = document.getElementById("totalVotesResultsTag");
  const noVotesMessage = document.getElementById("noVotesMessage");

  function renderStatus() {
    const running = getElectionRunning();
    const total = getTotalValidVotes();
    const declaredId = getDeclaredWinnerId();
    const statusParts = [];
    if (running) statusParts.push("Election live");
    else statusParts.push("Election closed");
    if (declaredId) statusParts.push("Results declared");
    else statusParts.push("Awaiting final declaration");

    resultsStatusBanner.innerHTML = `
      <div class="status-pill ${running ? "live" : "stopped"}">
        <span class="status-pill-dot"></span>
        <span>${statusParts.join(" · ")}</span>
      </div>
      <span class="muted">${total} valid vote${total === 1 ? "" : "s"}</span>
    `;
  }

  function renderResults() {
    const parties = getParties();
    const tally = getTally();
    const total = getTotalValidVotes();
    const declaredId = getDeclaredWinnerId();
    const auto = getWinningPartyAuto();
    const autoWinnerId = auto?.party?.id || null;

    totalVotesTag.textContent = `${total} total vote${total === 1 ? "" : "s"}`;

    if (!parties.length || total === 0) {
      noVotesMessage.style.display = "block";
      resultsList.innerHTML = "";
      return;
    }

    noVotesMessage.style.display = "none";
    resultsList.innerHTML = "";

    parties.forEach((p) => {
      const votes = tally[p.id] || 0;
      const share = total ? Math.round((votes / total) * 100) : 0;
      const isWinner = declaredId
        ? p.id === declaredId
        : autoWinnerId && p.id === autoWinnerId;

      const card = document.createElement("div");
      card.className = "result-card" + (isWinner ? " winner" : "");
      card.innerHTML = `
        <div class="result-header">
          <div>
            <div class="party-name">${p.name}</div>
            <div class="result-meta">Leader: ${p.leader}</div>
            <div class="result-meta">Candidate: ${p.candidate}</div>
          </div>
          <div class="party-symbol">${p.symbol}</div>
        </div>
        <div class="result-meta" style="margin-top:6px;">
          ${votes} vote${votes === 1 ? "" : "s"} (${share}%)
          ${isWinner ? " · <strong>Winning party</strong>" : ""}
        </div>
        <div class="result-bar-container">
          <div class="result-bar" style="width:${share}%;"></div>
        </div>
      `;
      resultsList.appendChild(card);
    });
  }

  function refreshAll() {
    renderStatus();
    renderResults();
  }

  refreshAll();
});


