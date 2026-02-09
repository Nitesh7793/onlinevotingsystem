const signUpBtn = document.getElementById("signUp");
const signInBtn = document.getElementById("signIn");
const container = document.getElementById("container");

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

/* 🔹 First time user check */
window.onload = () => {
  const user = localStorage.getItem("user");
  if (!user) {
    container.classList.add("active"); // signup open
  }
};

/* 🔹 Panel switch */
signUpBtn.addEventListener("click", () => {
  container.classList.add("active");
});

signInBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

/* 🔹 SIGN UP */
signupForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const userData = {
    name: name,
    email: email,
    password: password
  };

  localStorage.setItem("user", JSON.stringify(userData));

  alert("Account created successfully! Now login.");
  container.classList.remove("active"); // login show
});

/* 🔹 LOGIN */
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const storedUser = JSON.parse(localStorage.getItem("user"));

  if (!storedUser) {
    alert("Please create account first!");
    container.classList.add("active");
    return;
  }

  if (email === storedUser.email && password === storedUser.password) {
    alert("Login successful!");
    window.location.href = "home.html"; // redirect
  } else {
    alert("Wrong email or password");
  }
});
