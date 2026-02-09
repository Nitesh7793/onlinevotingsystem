// Simple front-end admin authentication for demo purposes only.
// In a real system, this must be handled securely on the server.

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123", // Demo only. Do NOT hardcode in production.
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  if (isAdminLoggedIn()) {
    window.location.href = "admin.html";
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setAdminSession(true);
      showToast("Admin authenticated successfully.", "success");
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 600);
    } else {
      showToast("Invalid admin credentials.", "error");
    }
  });
});


