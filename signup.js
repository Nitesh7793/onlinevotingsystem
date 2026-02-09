const signUpBtn = document.getElementById("signUp");
const signInBtn = document.getElementById("signIn");
const container = document.getElementById("container");
const signUpForm = document.querySelector(".sign-up form");
const signInForm = document.querySelector(".sign-in form");
const signUpNameInput = signUpForm.querySelector('input[type="text"]');
const signUpEmailInput = signUpForm.querySelector('input[type="email"]');
const signUpPasswordInput = signUpForm.querySelector('input[type="password"]');
const signInEmailInput = signInForm.querySelector('input[type="email"]');
const signInPasswordInput = signInForm.querySelector('input[type="password"]');

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
const STORAGE_KEY = "loginDemoUsers";

const loadUsers = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const getOrCreateErrorEl = (input) => {
  const next = input.nextElementSibling;
  if (next && next.classList && next.classList.contains("error-message")) {
    return next;
  }
  const span = document.createElement("div");
  span.className = "error-message";
  input.insertAdjacentElement("afterend", span);
  return span;
};

const clearErrors = (form) => {
  form.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
};

const showError = (input, message) => {
  const el = getOrCreateErrorEl(input);
  el.textContent = message;
};

signUpBtn.addEventListener("click", () => {
  container.classList.add("active");
});

signInBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Show simple success prompt on form submissions
signUpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors(signUpForm);
  const name = signUpNameInput.value.trim();
  const email = signUpEmailInput.value.trim();
  const password = signUpPasswordInput.value;

  if (!name) {
    showError(signUpNameInput, "Please enter your name.");
    return;
  }

  if (!isValidEmail(email)) {
    showError(signUpEmailInput, "Please enter a valid email address.");
    return;
  }

  if (!password || password.length < 6) {
    showError(signUpPasswordInput, "Password must be at least 6 characters.");
    return;
  }

  const users = loadUsers();
  const emailExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    showError(signUpEmailInput, "Email already registered. Please login.");
    container.classList.remove("active");
    return;
  }

  users.push({ name, email, password });
  saveUsers(users);

  alert("Signup successfully!");
  container.classList.add("active");
});

signInForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors(signInForm);
  const email = signInEmailInput.value.trim();
  const password = signInPasswordInput.value;

  if (!isValidEmail(email)) {
    showError(signInEmailInput, "Please enter a valid email address.");
    return;
  }

  if (!password || password.length < 6) {
    showError(signInPasswordInput, "Password must be at least 6 characters.");
    return;
  }

  const users = loadUsers();
  const matchedUser = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() && user.password === password
  );

  if (!matchedUser) {
    showError(signInEmailInput, "No account found. Please sign up first.");
    container.classList.add("active");
    return;
  }

  alert("Login successfully!");
  window.location.href = "index.html";
});


