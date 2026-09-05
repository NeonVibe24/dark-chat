const API = "/api";

let currentUser = null;
let selectedUser = null;

let messageTimer = null;


/* ============================================================
   FIXED VIDEOLINK2ME ROOM
============================================================ */

const VIDEOLINK2ME_ROOM =
  "https://videolink2me.com/zm1nec";

const CALL_MESSAGE_PREFIX =
  "__PRIVATE_CHAT_VIDEOLINK2ME__";


/* ============================================================
   CALL STATE
============================================================ */

let currentCallType = null;
let currentCallUser = null;


/* ============================================================
   ELEMENTS
============================================================ */

const authScreen =
  document.getElementById("authScreen");

const chatScreen =
  document.getElementById("chatScreen");

const loginForm =
  document.getElementById("loginForm");

const registerForm =
  document.getElementById("registerForm");

const showRegister =
  document.getElementById("showRegister");

const showLogin =
  document.getElementById("showLogin");

const loginError =
  document.getElementById("loginError");

const registerError =
  document.getElementById("registerError");

const usersList =
  document.getElementById("usersList");

const emptyChat =
  document.getElementById("emptyChat");

const activeChat =
  document.getElementById("activeChat");

const messagesBox =
  document.getElementById("messages");

const messageForm =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");

const myUsername =
  document.getElementById("myUsername");

const myAvatar =
  document.getElementById("myAvatar");

const chatUsername =
  document.getElementById("chatUsername");

const chatAvatar =
  document.getElementById("chatAvatar");

const chatStatus =
  document.getElementById("chatStatus");

const logoutBtn =
  document.getElementById("logoutBtn");

const refreshUsers =
  document.getElementById("refreshUsers");

const reloadMessages =
  document.getElementById("reloadMessages");

const toast =
  document.getElementById("toast");


/* ============================================================
   CALL BUTTONS
============================================================ */

function getVoiceCallButton() {
  return document.getElementById(
    "voiceCallBtn"
  );
}

function getVideoCallButton() {
  return document.getElementById(
    "videoCallBtn"
  );
}


/* ============================================================
   KEEP CALL BUTTONS VISIBLE
============================================================ */

function fixCallButtons() {

  const actions =
    document.querySelector(
      ".chat-header .chat-actions"
    );

  const voice =
    getVoiceCallButton();

  const video =
    getVideoCallButton();

  if (
    !actions ||
    !voice ||
    !video
  ) {
    return;
  }

  actions.style.setProperty(
    "display",
    "flex",
    "important"
  );

  actions.style.setProperty(
    "align-items",
    "center",
    "important"
  );

  actions.style.setProperty(
    "justify-content",
    "flex-end",
    "important"
  );

  actions.style.setProperty(
    "visibility",
    "visible",
    "important"
  );

  actions.style.setProperty(
    "opacity",
    "1",
    "important"
  );

  actions.style.setProperty(
    "flex-shrink",
    "0",
    "important"
  );

  actions.style.setProperty(
    "position",
    "relative",
    "important"
  );

  actions.style.setProperty(
    "z-index",
    "50",
    "important"
  );

  [voice, video].forEach(
    button => {

      button.style.setProperty(
        "display",
        "flex",
        "important"
      );

      button.style.setProperty(
        "visibility",
        "visible",
        "important"
      );

      button.style.setProperty(
        "opacity",
        "1",
        "important"
      );

      button.style.setProperty(
        "flex",
        "0 0 auto",
        "important"
      );

      button.style.setProperty(
        "pointer-events",
        "auto",
        "important"
      );

      button.style.setProperty(
        "position",
        "relative",
        "important"
      );

      button.style.setProperty(
        "z-index",
        "51",
        "important"
      );
    }
  );
}


/* ============================================================
   CALL BUTTON EVENTS (ခလုတ်နှိပ်လျှင် Link တန်းပို့ပြီး Room ဝင်မည်)
============================================================ */

document.addEventListener(
  "click",
  event => {

    const voice =
      event.target.closest(
        "#voiceCallBtn"
      );

    const video =
      event.target.closest(
        "#videoCallBtn"
      );

    if (!voice && !video) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (!selectedUser) {

      showToast(
        "Select a user first"
      );

      return;
    }

    if (voice) {
      triggerDirectCall("voice");
    }

    if (video) {
      triggerDirectCall("video");
    }
  }
);


/* ============================================================
   DIRECT CALL TRIGGER
============================================================ */

async function triggerDirectCall(type) {
  if (!selectedUser) {
    showToast("Select a user first");
    return;
  }

  try {
    const message = createCallMessage(type);

    await api("/messages", {
      method: "POST",
      body: JSON.stringify({
        receiver_id: selectedUser.id,
        message
      })
    });

    await loadMessages();
    openVideolink2me(VIDEOLINK2ME_ROOM);

  } catch (error) {
    showToast(error.message || "Could not start call");
  }
}


/* ============================================================
   KEEP BUTTONS VISIBLE
============================================================ */

window.addEventListener(
  "resize",
  fixCallButtons
);

document.addEventListener(
  "DOMContentLoaded",
  () => {

    fixCallButtons();

    setTimeout(
      fixCallButtons,
      100
    );

    setTimeout(
      fixCallButtons,
      500
    );

  }
);


/* ============================================================
   PROFILE ELEMENTS
============================================================ */

const myAvatarBtn =
  document.getElementById(
    "myAvatarBtn"
  );

const profilePanel =
  document.getElementById(
    "profilePanel"
  );

const profilePanelBackdrop =
  document.getElementById(
    "profilePanelBackdrop"
  );

const closeProfilePanel =
  document.getElementById(
    "closeProfilePanel"
  );

const profilePhotoBtn =
  document.getElementById(
    "profilePhotoBtn"
  );

const profilePhotoLarge =
  document.getElementById(
    "profilePhotoLarge"
  );

const profilePanelName =
  document.getElementById(
    "profilePanelName"
  );

const profilePanelEmail =
  document.getElementById(
    "profilePanelEmail"
  );

const profilePhotoInput =
  document.getElementById(
    "profilePhotoInput"
  );

const changeProfilePhoto =
  document.getElementById(
    "changeProfilePhoto"
  );

const removeProfilePhoto =
  document.getElementById(
    "removeProfilePhoto"
  );


/* ============================================================
   OLD CALL ELEMENTS
============================================================ */

const incomingCall =
  document.getElementById(
    "incomingCall"
  );

const incomingCallAvatar =
  document.getElementById(
    "incomingCallAvatar"
  );

const incomingCallName =
  document.getElementById(
    "incomingCallName"
  );

const incomingCallType =
  document.getElementById(
    "incomingCallType"
  );

const rejectCallBtn =
  document.getElementById(
    "rejectCallBtn"
  );

const acceptCallBtn =
  document.getElementById(
    "acceptCallBtn"
  );

const callScreen =
  document.getElementById(
    "callScreen"
  );

const remoteVideo =
  document.getElementById(
    "remoteVideo"
  );

const voiceCallView =
  document.getElementById(
    "voiceCallView"
  );

const voiceCallAvatar =
  document.getElementById(
    "voiceCallAvatar"
  );

const voiceCallName =
  document.getElementById(
    "voiceCallName"
  );

const voiceCallStatus =
  document.getElementById(
    "voiceCallStatus"
  );

const localVideo =
  document.getElementById(
    "localVideo"
  );

const callUserName =
  document.getElementById(
    "callUserName"
  );

const callDuration =
  document.getElementById(
    "callDuration"
  );

const muteCallBtn =
  document.getElementById(
    "muteCallBtn"
  );

const cameraCallBtn =
  document.getElementById(
    "cameraCallBtn"
  );

const switchCameraBtn =
  document.getElementById(
    "switchCameraBtn"
  );

const endCallBtn =
  document.getElementById(
    "endCallBtn"
  );

const remoteAudio =
  document.getElementById(
    "remoteAudio"
  );

const ringtone =
  document.getElementById(
    "ringtone"
  );


/* ============================================================
   HELPERS
============================================================ */

function getToken() {

  return localStorage.getItem(
    "dark_chat_token"
  );
}

function setToken(token) {

  localStorage.setItem(
    "dark_chat_token",
    token
  );
}

function removeToken() {

  localStorage.removeItem(
    "dark_chat_token"
  );
}

function headers() {

  const token =
    getToken();

  const result = {
    "Content-Type":
      "application/json"
  };

  if (token) {

    result.Authorization =
      `Bearer ${token}`;
  }

  return result;
}

async function api(
  path,
  options = {}
) {

  const response =
    await fetch(
      API + path,
      {
        ...options,

        headers: {
          ...headers(),
          ...(options.headers || {})
        }
      }
    );

  let data = {};

  try {

    data =
      await response.json();

  } catch {}

  if (!response.ok) {

    throw new Error(
      data.error ||
      "Something went wrong"
    );
  }

  return data;
}

function avatarLetter(name) {

  return String(
    name || "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();
}

function showToast(text) {

  if (!toast) {
    return;
  }

  toast.textContent =
    text;

  toast.classList.add(
    "show"
  );

  setTimeout(
    () => {
      toast.classList.remove(
        "show"
      );
    },
    2500
  );
}

function formatTime(dateString) {

  if (!dateString) {
    return "";
  }

  let value =
    String(dateString);

  if (
    !value.endsWith("Z") &&
    !value.includes("+")
  ) {

    value =
      value.replace(
        " ",
        "T"
      ) + "Z";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function setAvatar(
  element,
  user
) {

  if (!element) {
    return;
  }

  element.textContent =
    "";

  element.style.backgroundImage =
    "";

  if (user?.profile_photo) {

    element.style.backgroundImage =
      `url("${user.profile_photo}")`;

    element.style.backgroundSize =
      "cover";

    element.style.backgroundPosition =
      "center";

    element.style.backgroundRepeat =
      "no-repeat";

    return;
  }

  element.textContent =
    avatarLetter(
      user?.username
    );
}

function setAvatarData(
  element,
  username,
  photo
) {

  if (!element) {
    return;
  }

  element.textContent =
    "";

  element.style.backgroundImage =
    "";

  if (photo) {

    element.style.backgroundImage =
      `url("${photo}")`;

    element.style.backgroundSize =
      "cover";

    element.style.backgroundPosition =
      "center";

    element.style.backgroundRepeat =
      "no-repeat";

  } else {

    element.textContent =
      avatarLetter(
        username
      );
  }
}

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(
      value ?? ""
    );

  return div.innerHTML;
}


/* ============================================================
   AUTH SCREEN
============================================================ */

if (showRegister) {

  showRegister.addEventListener(
    "click",
    () => {

      loginForm.classList.add(
        "hidden"
      );

      registerForm.classList.remove(
        "hidden"
      );

      if (loginError) {
        loginError.textContent =
          "";
      }

      if (registerError) {
        registerError.textContent =
          "";
      }
    }
  );
}

if (showLogin) {

  showLogin.addEventListener(
    "click",
    () => {

      registerForm.classList.add(
        "hidden"
      );

      loginForm.classList.remove(
        "hidden"
      );

      if (loginError) {
        loginError.textContent =
          "";
      }

      if (registerError) {
        registerError.textContent =
          "";
      }
    }
  );
}


/* ============================================================
   REGISTER
============================================================ */

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (registerError) {
        registerError.textContent =
          "";
      }

      const username =
        document
          .getElementById(
            "registerUsername"
          )
          .value
          .trim();

      const email =
        document
          .getElementById(
            "registerEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "registerPassword"
          )
          .value;

      if (
        !username ||
        !email ||
        !password
      ) {

        if (registerError) {

          registerError.textContent =
            "Please fill in all fields";
        }

        return;
      }

      try {

        await api(
          "/register",
          {
            method: "POST",

            body:
              JSON.stringify({
                username,
                email,
                password
              })
          }
        );

        showToast(
          "Account created"
        );

        registerForm.reset();

        registerForm.classList.add(
          "hidden"
        );

        loginForm.classList.remove(
          "hidden"
        );

        const loginEmail =
          document.getElementById(
            "loginEmail"
          );

        if (loginEmail) {
          loginEmail.value =
            email;
        }

      } catch (error) {

        if (registerError) {

          registerError.textContent =
            error.message;
        }
      }
    }
  );
}


/* ============================================================
   LOGIN
============================================================ */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (loginError) {
        loginError.textContent =
          "";
      }

      const email =
        document
          .getElementById(
            "loginEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "loginPassword"
          )
          .value;

      if (
        !email ||
        !password
      ) {

        if (loginError) {

          loginError.textContent =
            "Please enter email and password";
        }

        return;
      }

      try {

        const data =
          await api(
            "/login",
            {
              method: "POST",

              body:
                JSON.stringify({
                  email,
                  password
                })
            }
          );

        setToken(
          data.token
        );

        currentUser =
          data.user;

        loginForm.reset();

        await openChatApp();

      } catch (error) {

        if (loginError) {

          loginError.textContent =
            error.message;
        }
      }
    }
  );
}


/* ============================================================
   APP START
============================================================ */

async function startApp() {

  fixCallButtons();

  const token =
    getToken();

  if (!token) {

    showAuth();

    return;
  }

  try {

    const data =
      await api(
        "/me"
      );

    currentUser =
      data.user;

    await openChatApp();

  } catch {

    removeToken();

    currentUser =
      null;

    showAuth();
  }
}

function showAuth() {

  stopMessageRefresh();

  authScreen?.classList.remove(
    "hidden"
  );

  chatScreen?.classList.add(
    "hidden"
  );
}

async function openChatApp() {

  authScreen?.classList.add(
    "hidden"
  );

  chatScreen?.classList.remove(
    "hidden"
  );

  if (myUsername) {

    myUsername.textContent =
      currentUser?.username ||
      "";
  }

  setAvatar(
    myAvatar,
    currentUser
  );

  updateProfilePanel();

  await loadUsers();

  fixCallButtons();

  setTimeout(
    fixCallButtons,
    100
  );

  setTimeout(
    fixCallButtons,
    500
  );
}


/* ============================================================
   USERS
============================================================ */

async function loadUsers() {

  if (!usersList) {
    return;
  }

  usersList.innerHTML = `
    <div class="loading">
      Loading users...
    </div>
  `;

  try {

    const data =
      await api(
        "/users"
      );

    renderUsers(
      data.users || []
    );

  } catch (error) {

    usersList.innerHTML = `
      <div class="loading">
        ${escapeHTML(
          error.message
        )}
      </div>
    `;
  }
}

function renderUsers(users) {

  if (!usersList) {
    return;
  }

  usersList.innerHTML =
    "";

  const otherUsers =
    users.filter(
      user =>
        !currentUser ||
        user.id !==
          currentUser.id
    );

  if (!otherUsers.length) {

    usersList.innerHTML = `
      <div class="loading">
        No other users yet.
      </div>
    `;

    return;
  }

  otherUsers.forEach(
    user => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "user-item";

      if (
        selectedUser &&
        selectedUser.id ===
          user.id
      ) {

        item.classList.add(
          "active"
        );
      }

      const avatar =
        document.createElement(
          "div"
        );

      avatar.className =
        "avatar";

      setAvatar(
        avatar,
        user
      );

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "user-info";

      const name =
        document.createElement(
          "strong"
        );

      name.textContent =
        user.username;

      const email =
        document.createElement(
          "span"
        );

      email.textContent =
        user.email;

      info.appendChild(
        name
      );

      info.appendChild(
        email
      );

      item.appendChild(
        avatar
      );

      item.appendChild(
        info
      );

      item.addEventListener(
        "click",
        () => {
          selectUser(user);
        }
      );

      usersList.appendChild(
        item
      );
    }
  );

  fixCallButtons();
}


/* ============================================================
   SELECT USER
============================================================ */

async function selectUser(user) {

  selectedUser =
    user;

  chatScreen?.classList.add(
    "chat-open"
  );

  emptyChat?.classList.add(
    "hidden"
  );

  activeChat?.classList.remove(
    "hidden"
  );

  if (chatUsername) {

    chatUsername.textContent =
      user.username;
  }

  setAvatar(
    chatAvatar,
    user
  );

  if (chatStatus) {

    chatStatus.textContent =
      "Available";
  }

  fixCallButtons();

  await loadMessages();

  if (messageInput) {
    messageInput.focus();
  }

  startMessageRefresh();

  setTimeout(
    fixCallButtons,
    100
  );
}


/* ============================================================
   MESSAGES
============================================================ */

async function loadMessages() {

  if (!selectedUser) {
    return;
  }

  try {

    const data =
      await api(
        `/messages?user_id=${selectedUser.id}`
      );

    renderMessages(
      data.messages || []
    );

  } catch (error) {

    if (messagesBox) {

      messagesBox.innerHTML = `
        <div class="loading">
          ${escapeHTML(
            error.message
          )}
        </div>
      `;
    }
  }
}


/* ============================================================
   CALL MESSAGE PARSER
============================================================ */

function parseCallMessage(
  message
) {

  if (
    typeof message !==
    "string"
  ) {
    return null;
  }

  if (
    !message.startsWith(
      CALL_MESSAGE_PREFIX
    )
  ) {
    return null;
  }

  try {

    const json =
      message.substring(
        CALL_MESSAGE_PREFIX.length
      );

    const data =
      JSON.parse(json);

    if (
      !data ||
      !data.url
    ) {
      return null;
    }

    return data;

  } catch {

    return null;
  }
}


/* ============================================================
   VALIDATE VIDEOLINK2ME URL
============================================================ */

function isValidVideolink2meUrl(
  value
) {

  try {

    const url =
      new URL(
        String(value)
      );

    if (
      url.protocol !==
      "https:"
    ) {
      return false;
    }

    return (
      url.hostname ===
        "videolink2me.com" ||
      url.hostname.endsWith(
        ".videolink2me.com"
      )
    );

  } catch {

    return false;
  }
}


/* ============================================================
   CREATE CALL MESSAGE
============================================================ */

function createCallMessage(
  type
) {

  return (
    CALL_MESSAGE_PREFIX +
    JSON.stringify({
      type:
        type === "voice"
          ? "voice"
          : "video",

      url:
        VIDEOLINK2ME_ROOM
    })
  );
}


/* ============================================================
   CALL MESSAGE UI
============================================================ */

function createCallMessageElement(
  callData,
  mine
) {

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "message-row" +
    (mine ? " mine" : "");

  const bubble =
    document.createElement(
      "div"
    );

  bubble.className =
    "message";

  bubble.style.padding =
    "0";

  bubble.style.overflow =
    "hidden";

  const card =
    document.createElement(
      "div"
    );

  card.style.minWidth =
    "220px";

  card.style.maxWidth =
    "300px";

  card.style.padding =
    "16px";

  const icon =
    document.createElement(
      "div"
    );

  icon.textContent =
    callData.type ===
    "voice"
      ? "📞"
      : "📹";

  icon.style.fontSize =
    "30px";

  icon.style.marginBottom =
    "8px";

  const title =
    document.createElement(
      "div"
    );

  title.textContent =
    callData.type ===
    "voice"
      ? "Voice Call"
      : "Video Call";

  title.style.fontWeight =
    "700";

  title.style.fontSize =
    "16px";

  title.style.marginBottom =
    "4px";

  const service =
    document.createElement(
      "div"
    );

  service.textContent =
    "Videolink2me";

  service.style.fontSize =
    "13px";

  service.style.opacity =
    "0.7";

  service.style.marginBottom =
    "12px";

  const joinButton =
    document.createElement(
      "button"
    );

  joinButton.type =
    "button";

  joinButton.textContent =
    "Join Call";

  joinButton.style.width =
    "100%";

  joinButton.style.border =
    "0";

  joinButton.style.borderRadius =
    "10px";

  joinButton.style.padding =
    "11px 14px";

  joinButton.style.cursor =
    "pointer";

  joinButton.style.fontWeight =
    "700";

  joinButton.style.background =
    "#5865f2";

  joinButton.style.color =
    "#fff";

  joinButton.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      openVideolink2me(
        callData.url
      );
    }
  );

  const time =
    document.createElement(
      "span"
    );

  time.className =
    "message-time";

  time.style.display =
    "block";

  time.style.marginTop =
    "8px";

  time.textContent =
    formatTime(
      callData.created_at ||
      ""
    );

  card.appendChild(
    icon
  );

  card.appendChild(
    title
  );

  card.appendChild(
    service
  );

  card.appendChild(
    joinButton
  );

  bubble.appendChild(
    card
  );

  bubble.appendChild(
    time
  );

  row.appendChild(
    bubble
  );

  return row;
}


/* ============================================================
   RENDER MESSAGES
============================================================ */

function renderMessages(
  messages
) {

  if (!messagesBox) {
    return;
  }

  messagesBox.innerHTML =
    "";

  if (!messages.length) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "loading";

    empty.textContent =
      "No messages yet. Say hello!";

    messagesBox.appendChild(
      empty
    );

    return;
  }

  messages.forEach(
    message => {

      const mine =
        Number(
          message.sender_id
        ) ===
        Number(
          currentUser.id
        );

      const callData =
        parseCallMessage(
          message.message
        );

      if (callData) {

        callData.created_at =
          message.created_at;

        const callElement =
          createCallMessageElement(
            callData,
            mine
          );

        messagesBox.appendChild(
          callElement
        );

        return;
      }

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "message-row" +
        (mine ? " mine" : "");

      const bubble =
        document.createElement(
          "div"
        );

      bubble.className =
        "message";

      const text =
        document.createElement(
          "div"
        );

      text.textContent =
        message.message;

      const time =
        document.createElement(
          "span"
        );

      time.className =
        "message-time";

      time.textContent =
        formatTime(
          message.created_at
        );

      bubble.appendChild(
        text
      );

      bubble.appendChild(
        time
      );

      row.appendChild(
        bubble
      );

      messagesBox.appendChild(
        row
      );
    }
  );

  messagesBox.scrollTop =
    messagesBox.scrollHeight;
}


/* ============================================================
   SEND MESSAGE
============================================================ */

if (messageForm) {

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

      messageInput.disabled =
        true;

      try {

        await api(
          "/messages",
          {
            method: "POST",

            body:
              JSON.stringify({
                receiver_id:
                  selectedUser.id,

                message
              })
          }
        );

        messageInput.value =
          "";

        await loadMessages();

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        messageInput.disabled =
          false;

        messageInput.focus();
      }
    }
  );
}


/* ============================================================
   MESSAGE REFRESH
============================================================ */

function startMessageRefresh() {

  stopMessageRefresh();

  messageTimer =
    setInterval(
      async () => {

        if (
          selectedUser &&
          document.visibilityState ===
            "visible"
        ) {

          await loadMessages();
        }

      },
      3000
    );
}

function stopMessageRefresh() {

  if (messageTimer) {

    clearInterval(
      messageTimer
    );

    messageTimer =
      null;
  }
}


/* ============================================================
   REFRESH USERS
============================================================ */

if (refreshUsers) {

  refreshUsers.addEventListener(
    "click",
    async () => {

      await loadUsers();

      fixCallButtons();
    }
  );
}


/* ============================================================
   REFRESH MESSAGES
============================================================ */

if (reloadMessages) {

  reloadMessages.addEventListener(
    "click",
    async () => {

      await loadMessages();

      fixCallButtons();
    }
  );
}


/* ============================================================
   LOGOUT
============================================================ */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await api(
          "/logout",
          {
            method: "POST"
          }
        );

      } catch {}

      stopMessageRefresh();

      removeToken();

      currentUser =
        null;

      selectedUser =
        null;

      closeProfile();

      chatScreen?.classList.remove(
        "chat-open"
      );

      showAuth();

      showToast(
        "Logged out"
      );
    }
  );
}


/* ============================================================
   MOBILE BACK
============================================================ */

const chatArea =
  document.querySelector(
    ".chat-area"
  );

if (chatArea) {

  chatArea.addEventListener(
    "click",
    event => {

      const header =
        document.querySelector(
          ".chat-header"
        );

      if (
        window.innerWidth <=
          700 &&
        event.target ===
          header
      ) {

        chatScreen.classList.remove(
          "chat-open"
        );

        stopMessageRefresh();
      }
    }
  );
}


/* ============================================================
   PROFILE
============================================================ */

function updateProfilePanel() {

  if (!currentUser) {
    return;
  }

  if (profilePanelName) {

    profilePanelName.textContent =
      currentUser.username;
  }

  if (profilePanelEmail) {

    profilePanelEmail.textContent =
      currentUser.email;
  }

  setAvatarData(
    profilePhotoLarge,
    currentUser.username,
    currentUser.profile_photo
  );

  setAvatarData(
    myAvatar,
    currentUser.username,
    currentUser.profile_photo
  );
}

function openProfile() {

  updateProfilePanel();

  profilePanel?.classList.remove(
    "hidden"
  );
}

function closeProfile() {

  profilePanel?.classList.add(
    "hidden"
  );

  if (profilePhotoInput) {

    profilePhotoInput.value =
      "";
  }
}

if (myAvatarBtn) {

  myAvatarBtn.addEventListener(
    "click",
    openProfile
  );
}

if (closeProfilePanel) {

  closeProfilePanel.addEventListener(
    "click",
    closeProfile
  );
}

if (profilePanelBackdrop) {

  profilePanelBackdrop.addEventListener(
    "click",
    closeProfile
  );
}

if (profilePhotoBtn) {

  profilePhotoBtn.addEventListener(
    "click",
    () => {

      profilePhotoInput?.click();
    }
  );
}

if (changeProfilePhoto) {

  changeProfilePhoto.addEventListener(
    "click",
    () => {

      profilePhotoInput?.click();
    }
  );
}


/* ============================================================
   PROFILE PHOTO
============================================================ */

if (profilePhotoInput) {

  profilePhotoInput.addEventListener(
    "change",
    async () => {

      const file =
        profilePhotoInput.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showToast(
          "Please select an image"
        );

        return;
      }

      try {

        showToast(
          "Uploading..."
        );

        const imageData =
          await imageToDataURL(
            file
          );

        const data =
          await api(
            "/profile/photo",
            {
              method: "POST",

              body:
                JSON.stringify({
                  profile_photo:
                    imageData
                })
            }
          );

        currentUser =
          data.user || {
            ...currentUser,

            profile_photo:
              imageData
          };

        updateProfilePanel();

        await loadUsers();

        showToast(
          "Photo updated"
        );

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        profilePhotoInput.value =
          "";
      }
    }
  );
}


/* ============================================================
   REMOVE PROFILE PHOTO
============================================================ */

if (removeProfilePhoto) {

  removeProfilePhoto.addEventListener(
    "click",
    async () => {

      try {

        await api(
          "/profile/photo",
          {
            method: "DELETE"
          }
        );

        currentUser.profile_photo =
          null;

        updateProfilePanel();

        await loadUsers();

        showToast(
          "Photo removed"
        );

      } catch (error) {

        showToast(
          error.message
        );
      }
    }
  );
}


/* ============================================================
   IMAGE PROCESSING
============================================================ */

function imageToDataURL(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => {

          const img =
            new Image();

          img.onload =
            () => {

              const maxSize =
                720;

              let width =
                img.width;

              let height =
                img.height;

              if (
                width >
                  maxSize ||
                height >
                  maxSize
              ) {

                const scale =
                  Math.min(
                    maxSize /
                      width,

                    maxSize /
                      height
                  );

                width =
                  Math.round(
                    width *
                      scale
                  );

                height =
                  Math.round(
                    height *
                      scale
                  );
              }

              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const ctx =
                canvas.getContext(
                  "2d"
                );

              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );

              resolve(
                canvas.toDataURL(
                  "image/jpeg",
                  0.82
                )
              );
            };

          img.onerror =
            () => {

              reject(
                new Error(
                  "Invalid image"
                )
              );
            };

          img.src =
            reader.result;
        };

      reader.onerror =
        () => {

          reject(
            new Error(
              "Could not read image"
            )
          );
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}


/* ============================================================
   OPEN VIDEOLINK2ME
============================================================ */

function openVideolink2me(
  url
) {

  if (
    !isValidVideolink2meUrl(
      url
    )
  ) {

    showToast(
      "Invalid Videolink2me link"
    );

    return;
  }

  window.location.href =
    url;
}


/* ============================================================
   OLD CALL UI
============================================================ */

function hideOldCallUI() {

  incomingCall?.classList.add(
    "hidden"
  );

  callScreen?.classList.add(
    "hidden"
  );
}

hideOldCallUI();


/* ============================================================
   OLD INCOMING CALL FUNCTIONS
============================================================ */

function startIncomingCallPolling() {}
function stopIncomingCallPolling() {}
async function checkIncomingCalls() {}


/* ============================================================
   OLD SIGNAL FUNCTIONS
============================================================ */

function startSignalPolling() {}
function stopSignalPolling() {}
async function sendSignal() { return null; }
async function pollCallSignals() {}


/* ============================================================
   OLD END CALL
============================================================ */

async function endCall() {

  currentCallType =
    null;

  currentCallUser =
    null;

  hideOldCallUI();

  return;
}


/* ============================================================
   OLD CALL BUTTONS
============================================================ */

if (acceptCallBtn) {

  acceptCallBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showToast(
        "Please use the Videolink2me room"
      );
    }
  );
}

if (rejectCallBtn) {

  rejectCallBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      incomingCall?.classList.add(
        "hidden"
      );
    }
  );
}

if (muteCallBtn) {

  muteCallBtn.addEventListener(
    "click",
    () => {

      showToast(
        "Call controls are available inside Videolink2me"
      );
    }
  );
}

if (cameraCallBtn) {

  cameraCallBtn.addEventListener(
    "click",
    () => {

      showToast(
        "Camera controls are available inside Videolink2me"
      );
    }
  );
}

if (switchCameraBtn) {

  switchCameraBtn.addEventListener(
    "click",
    () => {

      showToast(
        "Camera controls are available inside Videolink2me"
      );
    }
  );
}

if (endCallBtn) {

  endCallBtn.addEventListener(
    "click",
    () => {

      endCall();
    }
  );
}


/* ============================================================
   PROFILE ESCAPE / BACKDROP
============================================================ */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeProfile();
    }
  }
);


/* ============================================================
   START
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      fixCallButtons();

      startApp();
    }
  );

} else {

  fixCallButtons();

  startApp();
}
