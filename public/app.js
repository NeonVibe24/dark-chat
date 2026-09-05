const API = "/api";

let currentUser = null;
let selectedUser = null;

let messageTimer = null;

/* ============================================================
   VIDEOLINK2ME CALL STATE
============================================================ */

const VIDEOLINK2ME_START =
  "https://videolink2me.com/start";

const CALL_PREFIX =
  "__PRIVATE_CHAT_CALL__";

let currentCallType = null;
let currentCallUser = null;
let callWindow = null;


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

function fixCallButtons() {

  const actions =
    document.querySelector(
      ".chat-header .chat-actions"
    );

  const voice =
    getVoiceCallButton();

  const video =
    getVideoCallButton();

  if (!actions || !voice || !video) {
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
   CALL BUTTON EVENTS
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
      startCall("voice");
      return;
    }

    if (video) {
      startCall("video");
      return;
    }
  }
);


/* ============================================================
   CALL LINK BUTTONS
============================================================ */

document.addEventListener(
  "click",
  event => {

    const joinButton =
      event.target.closest(
        "[data-call-url]"
      );

    if (!joinButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const url =
      joinButton.getAttribute(
        "data-call-url"
      );

    if (!url) {
      return;
    }

    openCallLink(url);
  }
);


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
   Kept so existing index.html does not break.
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

function formatTime(
  dateString
) {

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
   VIDEOLINK2ME HELPERS
============================================================ */

/*
 * Videolink2me room links are HTTPS URLs.
 *
 * We deliberately do not try to read the generated room URL
 * from videolink2me.com because the page is cross-origin.
 */

function isValidVideolink(
  value
) {

  try {

    const url =
      new URL(
        String(value || "").trim()
      );

    return (
      url.protocol === "https:" &&
      (
        url.hostname ===
          "videolink2me.com" ||
        url.hostname.endsWith(
          ".videolink2me.com"
        )
      )
    );

  } catch {

    return false;
  }
}

function normalizeCallLink(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /^["']|["']$/g,
      ""
    );
}

function makeCallMessage(
  type,
  url
) {

  return (
    CALL_PREFIX +
    JSON.stringify({
      type:
        type === "video"
          ? "video"
          : "voice",

      url:
        normalizeCallLink(
          url
        )
    })
  );
}

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
      CALL_PREFIX
    )
  ) {

    return null;
  }

  try {

    const data =
      JSON.parse(
        message.slice(
          CALL_PREFIX.length
        )
      );

    if (
      !data ||
      !data.url ||
      !isValidVideolink(
        data.url
      )
    ) {

      return null;
    }

    return {
      type:
        data.type === "video"
          ? "video"
          : "voice",

      url:
        data.url
    };

  } catch {

    return null;
  }
}


/* ============================================================
   OPEN CALL LINK
============================================================ */

function openCallLink(
  url
) {

  const link =
    normalizeCallLink(
      url
    );

  if (!isValidVideolink(link)) {

    showToast(
      "Invalid Videolink2me link"
    );

    return;
  }

  /*
   * Try to open in a new browsing context first.
   *
   * Android WebView may handle this differently depending
   * on the native WebView configuration.
   */

  try {

    callWindow =
      window.open(
        link,
        "_blank"
      );

    if (
      callWindow &&
      !callWindow.closed
    ) {

      return;
    }

  } catch {}

  /*
   * Fallback.
   */

  window.location.href =
    link;
}


/* ============================================================
   SHOW VIDEOLINK2ME START PAGE
============================================================ */

function openVideolinkStartPage() {

  try {

    callWindow =
      window.open(
        VIDEOLINK2ME_START,
        "_blank"
      );

    if (
      callWindow &&
      !callWindow.closed
    ) {

      return true;
    }

  } catch {}

  /*
   * If popup/new-tab is blocked,
   * navigate directly.
   */

  window.location.href =
    VIDEOLINK2ME_START;

  return false;
}


/* ============================================================
   CALL LINK DIALOG
============================================================ */

function createCallDialog(
  type
) {

  const old =
    document.getElementById(
      "videolinkCallDialog"
    );

  if (old) {
    old.remove();
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "videolinkCallDialog";

  overlay.style.position =
    "fixed";

  overlay.style.inset =
    "0";

  overlay.style.zIndex =
    "99999";

  overlay.style.background =
    "rgba(0,0,0,.75)";

  overlay.style.display =
    "flex";

  overlay.style.alignItems =
    "center";

  overlay.style.justifyContent =
    "center";

  overlay.style.padding =
    "20px";

  const box =
    document.createElement(
      "div"
    );

  box.style.width =
    "min(460px, 100%)";

  box.style.background =
    "#111";

  box.style.color =
    "#fff";

  box.style.borderRadius =
    "18px";

  box.style.padding =
    "22px";

  box.style.boxSizing =
    "border-box";

  box.style.boxShadow =
    "0 20px 60px rgba(0,0,0,.5)";

  const title =
    document.createElement(
      "div"
    );

  title.textContent =
    type === "video"
      ? "Video Call"
      : "Voice Call";

  title.style.fontSize =
    "22px";

  title.style.fontWeight =
    "700";

  title.style.marginBottom =
    "10px";

  const description =
    document.createElement(
      "div"
    );

  description.textContent =
    "Create a Videolink2me room, copy the room link, then paste it below.";

  description.style.fontSize =
    "14px";

  description.style.lineHeight =
    "1.5";

  description.style.opacity =
    ".8";

  description.style.marginBottom =
    "18px";

  const openButton =
    document.createElement(
      "button"
    );

  openButton.type =
    "button";

  openButton.textContent =
    "Open Videolink2me";

  openButton.style.width =
    "100%";

  openButton.style.padding =
    "13px";

  openButton.style.border =
    "0";

  openButton.style.borderRadius =
    "12px";

  openButton.style.cursor =
    "pointer";

  openButton.style.marginBottom =
    "12px";

  openButton.addEventListener(
    "click",
    () => {

      openVideolinkStartPage();

      showToast(
        "Create the call and copy the room link"
      );
    }
  );

  const input =
    document.createElement(
      "input"
    );

  input.type =
    "url";

  input.placeholder =
    "Paste Videolink2me room link";

  input.autocomplete =
    "off";

  input.style.width =
    "100%";

  input.style.padding =
    "13px";

  input.style.borderRadius =
    "12px";

  input.style.border =
    "1px solid rgba(255,255,255,.15)";

  input.style.background =
    "#1b1b1b";

  input.style.color =
    "#fff";

  input.style.boxSizing =
    "border-box";

  input.style.marginBottom =
    "10px";

  const pasteButton =
    document.createElement(
      "button"
    );

  pasteButton.type =
    "button";

  pasteButton.textContent =
    "Paste from Clipboard";

  pasteButton.style.width =
    "100%";

  pasteButton.style.padding =
    "11px";

  pasteButton.style.border =
    "1px solid rgba(255,255,255,.15)";

  pasteButton.style.borderRadius =
    "12px";

  pasteButton.style.background =
    "transparent";

  pasteButton.style.color =
    "#fff";

  pasteButton.style.cursor =
    "pointer";

  pasteButton.style.marginBottom =
    "12px";

  pasteButton.addEventListener(
    "click",
    async () => {

      try {

        if (
          !navigator.clipboard ||
          !navigator.clipboard.readText
        ) {

          throw new Error(
            "Clipboard unavailable"
          );
        }

        const text =
          await navigator.clipboard.readText();

        input.value =
          text.trim();

        showToast(
          "Link pasted"
        );

      } catch {

        showToast(
          "Please paste the link manually"
        );
      }
    }
  );

  const buttons =
    document.createElement(
      "div"
    );

  buttons.style.display =
    "flex";

  buttons.style.gap =
    "10px";

  const cancel =
    document.createElement(
      "button"
    );

  cancel.type =
    "button";

  cancel.textContent =
    "Cancel";

  cancel.style.flex =
    "1";

  cancel.style.padding =
    "12px";

  cancel.style.border =
    "1px solid rgba(255,255,255,.15)";

  cancel.style.borderRadius =
    "12px";

  cancel.style.background =
    "transparent";

  cancel.style.color =
    "#fff";

  cancel.style.cursor =
    "pointer";

  cancel.addEventListener(
    "click",
    () => {
      overlay.remove();
    }
  );

  const send =
    document.createElement(
      "button"
    );

  send.type =
    "button";

  send.textContent =
    "Send Call Link";

  send.style.flex =
    "1";

  send.style.padding =
    "12px";

  send.style.border =
    "0";

  send.style.borderRadius =
    "12px";

  send.style.cursor =
    "pointer";

  send.addEventListener(
    "click",
    async () => {

      const url =
        normalizeCallLink(
          input.value
        );

      if (
        !isValidVideolink(url)
      ) {

        showToast(
          "Please enter a valid Videolink2me room link"
        );

        return;
      }

      await sendCallLinkMessage(
        url,
        type
      );

      overlay.remove();
    }
  );

  buttons.appendChild(
    cancel
  );

  buttons.appendChild(
    send
  );

  box.appendChild(
    title
  );

  box.appendChild(
    description
  );

  box.appendChild(
    openButton
  );

  box.appendChild(
    input
  );

  box.appendChild(
    pasteButton
  );

  box.appendChild(
    buttons
  );

  overlay.appendChild(
    box
  );

  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();
      }
    }
  );

  document.body.appendChild(
    overlay
  );

  setTimeout(
    () => {
      input.focus();
    },
    50
  );

  return overlay;
}


/* ============================================================
   SEND CALL LINK MESSAGE
============================================================ */

async function sendCallLinkMessage(
  link,
  type
) {

  if (!selectedUser) {

    showToast(
      "Select a user first"
    );

    return;
  }

  const url =
    normalizeCallLink(
      link
    );

  if (
    !isValidVideolink(url)
  ) {

    showToast(
      "Invalid Videolink2me link"
    );

    return;
  }

  const message =
    makeCallMessage(
      type,
      url
    );

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

    await loadMessages();

    showToast(
      "Call link sent"
    );

  } catch (error) {

    showToast(
      error.message
    );
  }
}


/* ============================================================
   START CALL
============================================================ */

async function startCall(
  type
) {

  if (!selectedUser) {

    showToast(
      "Select a user first"
    );

    return;
  }

  currentCallType =
    type === "video"
      ? "video"
      : "voice";

  currentCallUser = {
    ...selectedUser
  };

  /*
   * Videolink2me does the actual camera/microphone,
   * screen-sharing and call connection.
   */

  createCallDialog(
    currentCallType
  );
}


/* ============================================================
   OLD CALL FUNCTIONS
   Compatibility stubs.
============================================================ */

function startIncomingCallPolling() {
  /*
   * Not used anymore.
   * Videolink2me uses its own call session.
   */
}

function stopIncomingCallPolling() {
  /*
   * Not used anymore.
   */
}

function startSignalPolling() {
  /*
   * Not used anymore.
   */
}

function stopSignalPolling() {
  /*
   * Not used anymore.
   */
}

function stopCallDuration() {
  /*
   * Not used anymore.
   */
}

async function endCall() {

  currentCallType =
    null;

  currentCallUser =
    null;

  if (
    callWindow &&
    !callWindow.closed
  ) {

    try {
      callWindow.close();
    } catch {}
  }

  callWindow =
    null;
}

async function cleanupCall() {

  await endCall();
}


/* ============================================================
   OLD CALL UI
============================================================ */

function showCallScreen(
  user,
  type
) {

  /*
   * The actual call is now opened by Videolink2me.
   * Hide the old built-in WebRTC screen if it exists.
   */

  if (callScreen) {

    callScreen.classList.add(
      "hidden"
    );
  }

  if (voiceCallStatus) {

    voiceCallStatus.textContent =
      "Open the Videolink2me call";
  }

  if (callUserName) {

    callUserName.textContent =
      user?.username ||
      "User";
  }
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

      loginError.textContent =
        "";

      registerError.textContent =
        "";
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

      loginError.textContent =
        "";

      registerError.textContent =
        "";
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

      registerError.textContent =
        "";

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

        document.getElementById(
          "loginEmail"
        ).value =
          email;

      } catch (error) {

        registerError.textContent =
          error.message;
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

      loginError.textContent =
        "";

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

        openChatApp();

      } catch (error) {

        loginError.textContent =
          error.message;
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

    openChatApp();

  } catch {

    removeToken();

    showAuth();
  }
}

function showAuth() {

  stopMessageRefresh();

  stopIncomingCallPolling();

  authScreen.classList.remove(
    "hidden"
  );

  chatScreen.classList.add(
    "hidden"
  );
}

function openChatApp() {

  authScreen.classList.add(
    "hidden"
  );

  chatScreen.classList.remove(
    "hidden"
  );

  myUsername.textContent =
    currentUser.username;

  setAvatar(
    myAvatar,
    currentUser
  );

  updateProfilePanel();

  loadUsers();

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

function renderUsers(
  users
) {

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

          selectUser(
            user
          );
        }
      );

      usersList.appendChild(
        item
      );
    }
  );
}


/* ============================================================
   SELECT USER
============================================================ */

async function selectUser(
  user
) {

  selectedUser =
    user;

  chatScreen.classList.add(
    "chat-open"
  );

  emptyChat.classList.add(
    "hidden"
  );

  activeChat.classList.remove(
    "hidden"
  );

  chatUsername.textContent =
    user.username;

  setAvatar(
    chatAvatar,
    user
  );

  chatStatus.textContent =
    "Available";

  fixCallButtons();

  await loadMessages();

  messageInput.focus();

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

    messagesBox.innerHTML = `
      <div class="loading">
        ${escapeHTML(
          error.message
        )}
      </div>
    `;
  }
}


/* ============================================================
   RENDER MESSAGES
============================================================ */

function renderMessages(
  messages
) {

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

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "message-row" +
        (mine ? " mine" : "");

      const call =
        parseCallMessage(
          message.message
        );

      /*
       * CALL MESSAGE
       */

      if (call) {

        const bubble =
          document.createElement(
            "div"
          );

        bubble.className =
          "message";

        bubble.style.minWidth =
          "250px";

        bubble.style.maxWidth =
          "340px";

        const card =
          document.createElement(
            "div"
          );

        card.style.padding =
          "4px";

        const icon =
          document.createElement(
            "div"
          );

        icon.textContent =
          call.type === "video"
            ? "📹"
            : "📞";

        icon.style.fontSize =
          "30px";

        icon.style.marginBottom =
          "8px";

        const title =
          document.createElement(
            "div"
          );

        title.textContent =
          call.type === "video"
            ? "Video Call"
            : "Voice Call";

        title.style.fontWeight =
          "700";

        title.style.fontSize =
          "16px";

        title.style.marginBottom =
          "5px";

        const status =
          document.createElement(
            "div"
          );

        status.textContent =
          "Videolink2me call";

        status.style.fontSize =
          "13px";

        status.style.opacity =
          ".7";

        status.style.marginBottom =
          "12px";

        const join =
          document.createElement(
            "button"
          );

        join.type =
          "button";

        join.textContent =
          "Join Call";

        join.setAttribute(
          "data-call-url",
          call.url
        );

        join.style.width =
          "100%";

        join.style.padding =
          "10px 14px";

        join.style.border =
          "0";

        join.style.borderRadius =
          "10px";

        join.style.cursor =
          "pointer";

        join.style.fontWeight =
          "600";

        const urlText =
          document.createElement(
            "div"
          );

        let shortUrl =
          call.url;

        if (
          shortUrl.length >
          45
        ) {

          shortUrl =
            shortUrl.slice(
              0,
              42
            ) + "...";
        }

        urlText.textContent =
          shortUrl;

        urlText.style.fontSize =
          "11px";

        urlText.style.opacity =
          ".55";

        urlText.style.marginTop =
          "9px";

        urlText.style.wordBreak =
          "break-all";

        card.appendChild(
          icon
        );

        card.appendChild(
          title
        );

        card.appendChild(
          status
        );

        card.appendChild(
          join
        );

        card.appendChild(
          urlText
        );

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
          card
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

        return;
      }


      /*
       * NORMAL TEXT MESSAGE
       */

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

      await endCall();

      try {

        await api(
          "/logout",
          {
            method: "POST"
          }
        );

      } catch {}

      stopMessageRefresh();

      stopIncomingCallPolling();

      removeToken();

      currentUser =
        null;

      selectedUser =
        null;

      closeProfile();

      chatScreen.classList.remove(
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
        window.innerWidth <= 700 &&
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

  profilePanelName.textContent =
    currentUser.username;

  profilePanelEmail.textContent =
    currentUser.email;

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

  profilePanel.classList.remove(
    "hidden"
  );
}

function closeProfile() {

  profilePanel.classList.add(
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
    () =>
      profilePhotoInput.click()
  );
}

if (changeProfilePhoto) {

  changeProfilePhoto.addEventListener(
    "click",
    () =>
      profilePhotoInput.click()
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
    (
      resolve,
      reject
    ) => {

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
   OLD INCOMING CALL UI
============================================================ */

/*
 * The old WebRTC incoming-call UI is no longer used.
 * Hide it if it still exists in index.html.
 */

function hideOldCallUI() {

  if (incomingCall) {

    incomingCall.classList.add(
      "hidden"
    );
  }

  if (callScreen) {

    callScreen.classList.add(
      "hidden"
    );
  }
}

hideOldCallUI();


/* ============================================================
   OLD CALL BUTTON CONTROL UI
============================================================ */

/*
 * These buttons belonged to the previous WebRTC system.
 * Videolink2me provides its own microphone/camera controls.
 */

if (muteCallBtn) {

  muteCallBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showToast(
        "Use the microphone control in Videolink2me"
      );
    }
  );
}

if (cameraCallBtn) {

  cameraCallBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showToast(
        "Use the camera control in Videolink2me"
      );
    }
  );
}

if (switchCameraBtn) {

  switchCameraBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showToast(
        "Use the camera controls in Videolink2me"
      );
    }
  );
}

if (endCallBtn) {

  endCallBtn.addEventListener(
    "click",
    async event => {

      event.preventDefault();

      await endCall(true);

      if (callScreen) {

        callScreen.classList.add(
          "hidden"
        );
      }
    }
  );
}

if (acceptCallBtn) {

  acceptCallBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      hideOldCallUI();

      showToast(
        "Open the call link from the chat"
      );
    }
  );
}

if (rejectCallBtn) {

  rejectCallBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      hideOldCallUI();
    }
  );
}


/* ============================================================
   RINGTONE
============================================================ */

function playRingtone() {

  if (!ringtone) {
    return;
  }

  try {

    if (ringtone.src) {

      ringtone.currentTime =
        0;

      ringtone
        .play()
        .catch(
          () => {}
        );

      return;
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const audioContext =
      new AudioContext();

    const oscillator =
      audioContext
        .createOscillator();

    const gain =
      audioContext
        .createGain();

    oscillator.type =
      "sine";

    oscillator.frequency.value =
      700;

    gain.gain.value =
      0.035;

    oscillator.connect(
      gain
    );

    gain.connect(
      audioContext.destination
    );

    oscillator.start();

    setTimeout(
      () => {

        try {

          oscillator.stop();

          audioContext.close();

        } catch {}
      },
      700
    );

  } catch {}
}

function stopRingtone() {

  if (!ringtone) {
    return;
  }

  try {

    ringtone.pause();

    ringtone.currentTime =
      0;

  } catch {}
}


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
