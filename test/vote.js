function handleVote(partyKey) {
  if (!partyKey) return;

  // Store the party in localStorage so authentication page knows whom to vote for
  localStorage.setItem("pendingVoteParty", partyKey);

  // Redirect to authentication / verification page
  window.location.href = "authentication.html";
}

// Show current votes on cards when page loads
document.addEventListener("DOMContentLoaded", function () {
  if (typeof renderVoteBadges === "function") {
    renderVoteBadges();
  }
});


