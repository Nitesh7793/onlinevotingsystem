// Centralised data management using localStorage
// This is NOT production‑grade security but simulates a backend for demo purposes.

const STORAGE_KEYS = {
  STATE: "electionState_v1",
  ADMIN_SESSION: "adminSession_v1",
};

const DEFAULT_STATE = {
  parties: [], // {id, name, symbol, leader, candidate, active}
  votes: [], // {id, voterName, voterId, partyId, timestamp, valid}
  electionRunning: false,
  declaredWinnerPartyId: null,
};

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATE);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (err) {
    console.error("Failed to parse stored election state", err);
    return structuredClone(DEFAULT_STATE);
  }
}

function writeState(next) {
  localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(next));
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---- Admin session helpers ----
function setAdminSession(active) {
  if (active) {
    localStorage.setItem(
      STORAGE_KEYS.ADMIN_SESSION,
      JSON.stringify({ loggedIn: true, ts: Date.now() })
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }
}

function isAdminLoggedIn() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed.loggedIn;
  } catch {
    return false;
  }
}

// ---- Party operations ----
function getParties() {
  return readState().parties;
}

function getActiveParties() {
  return getParties().filter((p) => p.active);
}

function upsertParty(party) {
  const state = readState();
  if (party.id) {
    state.parties = state.parties.map((p) => (p.id === party.id ? { ...p, ...party } : p));
  } else {
    state.parties.push({
      ...party,
      id: generateId("party"),
      active: party.active ?? true,
    });
  }
  writeState(state);
  return state;
}

function togglePartyActive(partyId) {
  const state = readState();
  state.parties = state.parties.map((p) =>
    p.id === partyId ? { ...p, active: !p.active } : p
  );
  writeState(state);
  return state;
}

function removeParty(partyId) {
  const state = readState();
  state.parties = state.parties.filter((p) => p.id !== partyId);
  // Votes remain for audit; counts will naturally ignore removed parties when rendering.
  writeState(state);
  return state;
}

// ---- Election status ----
function getElectionRunning() {
  return readState().electionRunning;
}

function setElectionRunning(running) {
  const state = readState();
  state.electionRunning = !!running;
  writeState(state);
  return state;
}

// ---- Voting operations ----
function getVotes() {
  return readState().votes;
}

function hasUserVoted(voterId) {
  if (!voterId) return false;
  return getVotes().some((v) => v.voterId.toLowerCase() === voterId.toLowerCase() && v.valid);
}

function addVote({ voterName, voterId, partyId }) {
  const state = readState();
  const vote = {
    id: generateId("vote"),
    voterName,
    voterId,
    partyId,
    timestamp: Date.now(),
    valid: true,
  };
  state.votes.push(vote);
  writeState(state);
  return state;
}

function setVoteValidity(voteId, valid) {
  const state = readState();
  state.votes = state.votes.map((v) =>
    v.id === voteId ? { ...v, valid: !!valid } : v
  );
  writeState(state);
  return state;
}

function deleteVote(voteId) {
  const state = readState();
  state.votes = state.votes.filter((v) => v.id !== voteId);
  writeState(state);
  return state;
}

// ---- Results helpers ----
function getTally() {
  const state = readState();
  const tally = {};
  state.votes.forEach((v) => {
    if (!v.valid) return;
    tally[v.partyId] = (tally[v.partyId] || 0) + 1;
  });
  return tally;
}

function getTotalValidVotes() {
  return getVotes().filter((v) => v.valid).length;
}

function getWinningPartyAuto() {
  const parties = getParties();
  const tally = getTally();
  let bestParty = null;
  let bestVotes = -1;
  for (const party of parties) {
    const votes = tally[party.id] || 0;
    if (votes > bestVotes) {
      bestVotes = votes;
      bestParty = party;
    }
  }
  if (!bestParty || bestVotes <= 0) return null;
  return { party: bestParty, votes: bestVotes };
}

function setDeclaredWinner(partyId) {
  const state = readState();
  state.declaredWinnerPartyId = partyId || null;
  writeState(state);
  return state;
}

function getDeclaredWinnerId() {
  return readState().declaredWinnerPartyId;
}

// ---- Shared UI helpers ----
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function setCurrentYearOnPage() {
  const els = document.querySelectorAll("#year");
  els.forEach((el) => (el.textContent = new Date().getFullYear()));
}

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYearOnPage();
});


