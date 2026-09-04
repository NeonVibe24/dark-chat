const API = "/api";

let currentUser = null;
let selectedUser = null;
let messageTimer = null;


// ============================================================
// ELEMENTS
// ============================================================

const authScreen = document.getElementById("authScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");

const usersList = document.getElementById("usersList");

const emptyChat = document.getElementById("emptyChat");
const activeChat = document.getElementById("activeChat");

const messagesBox = document.getElementById("messages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

const myUsername = document.getElementById("myUsername");
const myAvatar = document.getElementById("myAvatar");

const chatUsername = document.getElementById("chatUsername");
const chatAvatar = document.getElementById("chatAvatar");
const chatStatus = document.getElementById("chatStatus");

const logoutBtn = document.getElementById("logoutBtn");
const refreshUsers = document.getElementById("refreshUsers");
const reloadMessages = document.getElementById("reloadMessages");

const toast = document.getElementById("toast");


// ============================================================
// HELPERS
// ============================================================

function getToken() {
  return localStorage.getItem("dark_chat_token");
}

function setToken(token) {
  localStorage.setItem("dark_chat_token", token);
}

function removeToken() {
  localStorage.removeItem("dark_chat_token");
}


function headers() {

  const token = getToken();

  const result = {
    "Content-Type": "application/json"
  };

  if (token) {
    result.Authorization = `Bearer ${token}`;
  }

  return result;
}


async function api(path, options = {}) {

  const response = await fetch(API + path, {
    ...options,

    headers: {
      ...headers(),
      ...(options.headers || {})
    }
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {

    throw new Error(
      data.error || "Something went wrong"
    );
  }

  return data;
}


function avatarLetter(name) {

  return String(name || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
}


function showToast(text) {

  toast.textContent = text;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


function formatTime(dateString) {

  if (!dateString) {
    return "";
  }

  const date = new Date(
    dateString.replace(" ", "T") + "Z"
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


// ============================================================
// AUTH SCREEN
// ============================================================

showRegister.addEventListener("click", () => {

  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");

  loginError.textContent = "";
  registerError.textContent = "";
});


showLogin.addEventListener("click", () => {

  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");

  loginError.textContent = "";
  registerError.textContent = "";
});


// ============================================================
// REGISTER
// ============================================================

registerForm.addEventListener("submit", async event => {

  event.preventDefault();

  registerError.textContent = "";

  const username =
    document.getElementById("registerUsername").value.trim();

  const email =
    document.getElementById("registerEmail").value.trim();

  const password =
    document.getElementById("registerPassword").value;


  try {

    const data = await api("/register", {

      method: "POST",

      body: JSON.stringify({
        username,
        email,
        password
      })

    });


    showToast("Account created");

    registerForm.reset();

    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    document.getElementById("loginEmail").value =
      email;

  } catch (error) {

    registerError.textContent =
      error.message;
  }

});


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener("submit", async event => {

  event.preventDefault();

  loginError.textContent = "";

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;


  try {

    const data = await api("/login", {

      method: "POST",

      body: JSON.stringify({
        email,
        password
      })

    });


    setToken(data.token);

    currentUser = data.user;

    loginForm.reset();

    openChatApp();

  } catch (error) {

    loginError.textContent =
      error.message;
  }

});


// ============================================================
// START APP
// ============================================================

async function startApp() {

  const token = getToken();

  if (!token) {
    showAuth();
    return;
  }


  try {

    const data = await api("/me");

    currentUser = data.user;

    openChatApp();

  } catch {

    removeToken();

    showAuth();
  }
}


function showAuth() {

  authScreen.classList.remove("hidden");
  chatScreen.classList.add("hidden");
}


function openChatApp() {

  authScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");

  myUsername.textContent =
    currentUser.username;

  myAvatar.textContent =
    avatarLetter(currentUser.username);

  loadUsers();
}


// ============================================================
// USERS
// ============================================================

async function loadUsers() {

  usersList.innerHTML = `
    <div class="loading">
      Loading users...
    </div>
  `;


  try {

    const data = await api("/users");

    renderUsers(data.users);

  } catch (error) {

    usersList.innerHTML = `
      <div class="loading">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


function renderUsers(users) {

  usersList.innerHTML = "";

  const otherUsers = users.filter(
    user =>
      !currentUser ||
      user.id !== currentUser.id
  );


  if (!otherUsers.length) {

    usersList.innerHTML = `
      <div class="loading">
        No other users yet.
      </div>
    `;

    return;
  }


  otherUsers.forEach(user => {

    const item =
      document.createElement("div");

    item.className = "user-item";


    if (
      selectedUser &&
      selectedUser.id === user.id
    ) {
      item.classList.add("active");
    }


    item.innerHTML = `

      <div class="avatar">
        ${escapeHTML(
          avatarLetter(user.username)
        )}
      </div>

      <div class="user-info">

        <strong>
          ${escapeHTML(user.username)}
        </strong>

        <span>
          ${escapeHTML(user.email)}
        </span>

      </div>

    `;


    item.addEventListener(
      "click",
      () => selectUser(user)
    );


    usersList.appendChild(item);

  });

}


// ============================================================
// SELECT USER
// ============================================================

async function selectUser(user) {

  selectedUser = user;

  chatScreen.classList.add("chat-open");

  emptyChat.classList.add("hidden");
  activeChat.classList.remove("hidden");

  chatUsername.textContent =
    user.username;

  chatAvatar.textContent =
    avatarLetter(user.username);

  chatStatus.textContent =
    "Available";

  await loadMessages();

  messageInput.focus();

  startMessageRefresh();
}


// ============================================================
// LOAD MESSAGES
// ============================================================

async function loadMessages() {

  if (!selectedUser) {
    return;
  }


  try {

    const data =
      await api(
        `/messages?user_id=${selectedUser.id}`
      );

    renderMessages(data.messages);

  } catch (error) {

    messagesBox.innerHTML = `
      <div class="loading">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


function renderMessages(messages) {

  messagesBox.innerHTML = "";


  if (!messages.length) {

    const empty =
      document.createElement("div");

    empty.className = "loading";

    empty.textContent =
      "No messages yet. Say hello!";

    messagesBox.appendChild(empty);

    return;
  }


  messages.forEach(message => {

    const mine =
      Number(message.sender_id) ===
      Number(currentUser.id);


    const row =
      document.createElement("div");

    row.className =
      "message-row" +
      (mine ? " mine" : "");


    const bubble =
      document.createElement("div");

    bubble.className = "message";


    const text =
      document.createElement("div");

    text.textContent =
      message.message;


    const time =
      document.createElement("span");

    time.className =
      "message-time";

    time.textContent =
      formatTime(message.created_at);


    bubble.appendChild(text);
    bubble.appendChild(time);

    row.appendChild(bubble);

    messagesBox.appendChild(row);

  });


  messagesBox.scrollTop =
    messagesBox.scrollHeight;
}


// ============================================================
// SEND MESSAGE
// ============================================================

messageForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!selectedUser) {
      return;
    }


    const message =
      messageInput.value.trim();


    if (!message) {
      return;
    }


    messageInput.disabled = true;


    try {

      await api("/messages", {

        method: "POST",

        body: JSON.stringify({

          receiver_id:
            selectedUser.id,

          message

        })

      });


      messageInput.value = "";

      await loadMessages();

    } catch (error) {

      showToast(error.message);

    } finally {

      messageInput.disabled = false;

      messageInput.focus();
    }

  }
);


// ============================================================
// AUTO REFRESH
// ============================================================

function startMessageRefresh() {

  stopMessageRefresh();


  messageTimer =
    setInterval(async () => {

      if (
        selectedUser &&
        document.visibilityState === "visible"
      ) {
        await loadMessages();
      }

    }, 3000);
}


function stopMessageRefresh() {

  if (messageTimer) {

    clearInterval(messageTimer);

    messageTimer = null;
  }
}


// ============================================================
// REFRESH
// ============================================================

refreshUsers.addEventListener(
  "click",
  loadUsers
);


reloadMessages.addEventListener(
  "click",
  loadMessages
);


// ============================================================
// LOGOUT
// ============================================================

logoutBtn.addEventListener(
  "click",
  async () => {

    try {
      await api("/logout", {
        method: "POST"
      });
    } catch {}


    stopMessageRefresh();

    removeToken();

    currentUser = null;
    selectedUser = null;

    chatScreen.classList.remove("chat-open");

    showAuth();

    showToast("Logged out");
  }
);


// ============================================================
// MOBILE BACK
// ============================================================

document
  .querySelector(".chat-area")
  .addEventListener("click", event => {

    if (
      window.innerWidth <= 700 &&
      event.target ===
      document.querySelector(".chat-header")
    ) {

      chatScreen.classList.remove(
        "chat-open"
      );

      stopMessageRefresh();
    }

  });


// ============================================================
// SECURITY
// ============================================================

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


// ============================================================
// START
// ============================================================

startApp();
