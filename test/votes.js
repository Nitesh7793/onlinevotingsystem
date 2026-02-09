// Shared vote storage and utilities for vote, results, and admin pages

const PARTY_KEYS = [
  "BJP",
  "RJD",
  "LJP",
  "BSP",
  "INC",
  "JAN SURAJ"
];

function getVotesStore() {
  try {
    const raw = localStorage.getItem("votes");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    console.error("Error reading votes from storage", e);
    return {};
  }
}

function saveVotesStore(store) {
  localStorage.setItem("votes", JSON.stringify(store || {}));
}

function getVoteCount(partyKey) {
  const store = getVotesStore();
  return Number(store[partyKey] || 0);
}

// Used by authentication after successful verification
function incrementVote(partyKey) {
  if (!partyKey) return;
  const store = getVotesStore();
  store[partyKey] = Number(store[partyKey] || 0) + 1;
  saveVotesStore(store);
}

// Render helper for vote page: fill elements having [data-party-votes="KEY"]
function renderVoteBadges() {
  const store = getVotesStore();
  document.querySelectorAll("[data-party-votes]").forEach((el) => {
    const key = el.getAttribute("data-party-votes");
    const count = Number(store[key] || 0);
    el.textContent = count.toString();
  });
}

// Admin + results pages: get sorted array of { party, votes }
function getAllVotesSorted() {
  const store = getVotesStore();
  const items = PARTY_KEYS.map((key) => ({
    party: key,
    votes: Number(store[key] || 0)
  }));
  items.sort((a, b) => b.votes - a.votes);
  return items;
}

// Admin use: clear everything
function resetAllVotes() {
  localStorage.removeItem("votes");
}


