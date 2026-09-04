const API = "/api";

let currentUser = null;
let selectedUser = null;
let messageTimer = null;


// ============================================================
// CALL STATE
// ============================================================

let peerConnection = null;
let localStream = null;
let remoteStream = null;

let currentCallId = null;
let currentCallType = null;

let currentCallUser = null;
let currentCallDirection = null;

let signalTimer = null;
let incomingCallTimer = null;
let callDurationTimer = null;

let callStartedAt = null;

let isMuted = false;
let isCameraOff = false;

let lastIncomingSignalTime = Date.now();

let pendingIncomingCall = null;


// ============================================================
// ELEMENTS
// ============================================================

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


// ============================================================
// PROFILE ELEMENTS
// ============================================================

const myAvatarBtn =
  document.getElementById("myAvatarBtn");

const profilePanel =
  document.getElementById("profilePanel");

const profilePanelBackdrop =
  document.getElementById("profilePanelBackdrop");

const closeProfilePanel =
  document.getElementById("closeProfilePanel");

const profilePhotoBtn =
  document.getElementById("profilePhotoBtn");

const profilePhotoLarge =
  document.getElementById("profilePhotoLarge");

const profilePanelName =
  document.getElementById("profilePanelName");

const profilePanelEmail =
  document.getElementById("profilePanelEmail");

const profilePhotoInput =
  document.getElementById("profilePhotoInput");

const changeProfilePhoto =
  document.getElementById("changeProfilePhoto");

const removeProfilePhoto =
  document.getElementById("removeProfilePhoto");


// ============================================================
// CALL ELEMENTS
// ============================================================

// IMPORTANT:
// Don't keep a permanently cached reference to call buttons.
// They may be recreated if the chat DOM changes.

let voiceCallBtn = null;
let videoCallBtn = null;

const incomingCall =
  document.getElementById("incomingCall");

const incomingCallAvatar =
  document.getElementById("incomingCallAvatar");

const incomingCallName =
  document.getElementById("incomingCallName");

const incomingCallType =
  document.getElementById("incomingCallType");

const rejectCallBtn =
  document.getElementById("rejectCallBtn");

const acceptCallBtn =
  document.getElementById("acceptCallBtn");

const callScreen =
  document.getElementById("callScreen");

const remoteVideo =
  document.getElementById("remoteVideo");

const voiceCallView =
  document.getElementById("voiceCallView");

const voiceCallAvatar =
  document.getElementById("voiceCallAvatar");

const voiceCallName =
  document.getElementById("voiceCallName");

const voiceCallStatus =
  document.getElementById("voiceCallStatus");

const localVideo =
  document.getElementById("localVideo");

const callUserName =
  document.getElementById("callUserName");

const callDuration =
  document.getElementById("callDuration");

const muteCallBtn =
  document.getElementById("muteCallBtn");

const cameraCallBtn =
  document.getElementById("cameraCallBtn");

const switchCameraBtn =
  document.getElementById("switchCameraBtn");

const endCallBtn =
  document.getElementById("endCallBtn");

const remoteAudio =
  document.getElementById("remoteAudio");

const ringtone =
  document.getElementById("ringtone");


// ============================================================
// HELPERS
// ============================================================

function getToken() {
  return localStorage.getItem("dark_chat_token");
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

  const token = getToken();

  const result = {
    "Content-Type": "application/json"
  };

  if (token) {
    result.Authorization =
      `Bearer ${token}`;
  }

  return result;
}


async function api(path, options = {}) {

  const response = await fetch(
    API + path,
    {
      ...options,

      headers: {
        ...headers(),
        ...(options.headers || {})
      }
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {

    throw new Error(
      data.error ||
      "Something went wrong"
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

  if (!toast) return;

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


function setAvatar(element, user) {

  if (!element) return;

  element.textContent = "";
  element.style.backgroundImage = "";

  if (
    user &&
    user.profile_photo
  ) {

    element.style.backgroundImage =
      `url("${user.profile_photo}")`;

    return;
  }

  element.textContent =
    avatarLetter(user?.username);
}


function setAvatarData(
  element,
  username,
  photo
) {

  if (!element) return;

  element.textContent = "";
  element.style.backgroundImage = "";

  if (photo) {

    element.style.backgroundImage =
      `url("${photo}")`;

  } else {

    element.textContent =
      avatarLetter(username);
  }
}


// ============================================================
// CALL BUTTON PROTECTION
// ============================================================

function ensureCallButtons() {

  const header =
    document.querySelector(
      ".chat-header"
    );

  if (!header) {
    return;
  }


  let actions =
    header.querySelector(
      ".chat-actions"
    );


  if (!actions) {

    actions =
      document.createElement(
        "div"
      );

    actions.className =
      "chat-actions";

    header.appendChild(
      actions
    );
  }


  // ----------------------------------------------------------
  // VOICE CALL BUTTON
  // ----------------------------------------------------------

  let voice =
    actions.querySelector(
      "#voiceCallBtn"
    );


  if (!voice) {

    voice =
      document.createElement(
        "button"
      );

    voice.id =
      "voiceCallBtn";

    voice.className =
      "call-btn";

    voice.type =
      "button";

    voice.title =
      "Voice call";

    voice.setAttribute(
      "aria-label",
      "Voice call"
    );

    voice.textContent =
      "☎";

    actions.insertBefore(
      voice,
      actions.firstChild
    );
  }


  // ----------------------------------------------------------
  // VIDEO CALL BUTTON
  // ----------------------------------------------------------

  let video =
    actions.querySelector(
      "#videoCallBtn"
    );


  if (!video) {

    video =
      document.createElement(
        "button"
      );

    video.id =
      "videoCallBtn";

    video.className =
      "call-btn";

    video.type =
      "button";

    video.title =
      "Video call";

    video.setAttribute(
      "aria-label",
      "Video call"
    );

    video.textContent =
      "▣";

    const refresh =
      actions.querySelector(
        "#reloadMessages"
      );

    if (refresh) {

      actions.insertBefore(
        video,
        refresh
      );

    } else {

      actions.appendChild(
        video
      );
    }
  }


  // ----------------------------------------------------------
  // FORCE VISIBILITY
  // ----------------------------------------------------------

  actions.style.display =
    "flex";

  actions.style.visibility =
    "visible";

  actions.style.opacity =
    "1";

  actions.style.alignItems =
    "center";

  actions.style.justifyContent =
    "flex-end";

  actions.style.flexShrink =
    "0";


  [voice, video].forEach(
    button => {

      button.classList.add(
        "call-btn"
      );

      button.style.display =
        "flex";

      button.style.visibility =
        "visible";

      button.style.opacity =
        "1";

      button.style.flex =
        "0 0 auto";

      button.style.width =
        window.innerWidth <= 390
          ? "33px"
          : window.innerWidth <= 700
            ? "35px"
            : "38px";

      button.style.height =
        window.innerWidth <= 390
          ? "33px"
          : window.innerWidth <= 700
            ? "35px"
            : "38px";

      button.style.alignItems =
        "center";

      button.style.justifyContent =
        "center";

      button.style.visibility =
        "visible";

      button.style.pointerEvents =
        "auto";

      button.style.cursor =
        "pointer";
    }
  );


  voiceCallBtn = voice;
  videoCallBtn = video;


  // ----------------------------------------------------------
  // EVENTS - ONLY ONCE
  // ----------------------------------------------------------

  if (
    !voice.dataset.callListener
  ) {

    voice.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        startCall("voice");
      }
    );

    voice.dataset.callListener =
      "true";
  }


  if (
    !video.dataset.callListener
  ) {

    video.addEventListener(
      "click",
      event => {

        event.preventDefault();
        event.stopPropagation();

        startCall("video");
      }
    );

    video.dataset.callListener =
      "true";
  }
}


// Keep the buttons alive even if another
// part of the application changes the chat DOM.

const callButtonObserver =
  new MutationObserver(
    () => {

      ensureCallButtons();
    }
  );


callButtonObserver.observe(
  document.body,
  {
    childList: true,
    subtree: true
  }
);


// ============================================================
// AUTH SCREEN
// ============================================================

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

      loginError.textContent = "";
      registerError.textContent = "";
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

      loginError.textContent = "";
      registerError.textContent = "";
    }
  );
}


// ============================================================
// REGISTER
// ============================================================

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      registerError.textContent = "";

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

            body: JSON.stringify({
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

        document
          .getElementById(
            "loginEmail"
          )
          .value = email;

      } catch (error) {

        registerError.textContent =
          error.message;
      }

    }
  );
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      loginError.textContent = "";

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

              body: JSON.stringify({
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


// ============================================================
// START APP
// ============================================================

async function startApp() {

  ensureCallButtons();

  const token =
    getToken();

  if (!token) {

    showAuth();

    return;
  }


  try {

    const data =
      await api("/me");

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

  startIncomingCallPolling();

  // Make sure buttons exist after chat is shown.
  setTimeout(
    ensureCallButtons,
    0
  );

  setTimeout(
    ensureCallButtons,
    100
  );
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

    const data =
      await api("/users");

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

  usersList.innerHTML = "";

  const otherUsers =
    users.filter(
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
        selectedUser.id === user.id
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


      info.appendChild(name);
      info.appendChild(email);

      item.appendChild(avatar);
      item.appendChild(info);


      item.addEventListener(
        "click",
        () => selectUser(user)
      );


      usersList.appendChild(
        item
      );
    }
  );
}


// ============================================================
// SELECT USER
// ============================================================

async function selectUser(user) {

  selectedUser = user;

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


  // IMPORTANT:
  // Restore call buttons after opening chat.
  ensureCallButtons();


  await loadMessages();

  messageInput.focus();

  startMessageRefresh();


  // Run again after DOM settles.
  setTimeout(
    ensureCallButtons,
    0
  );
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


function renderMessages(messages) {

  messagesBox.innerHTML = "";


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
        (
          mine
            ? " mine"
            : ""
        );


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


      bubble.appendChild(text);
      bubble.appendChild(time);

      row.appendChild(bubble);

      messagesBox.appendChild(
        row
      );
    }
  );


  messagesBox.scrollTop =
    messagesBox.scrollHeight;


  // Message rendering must never affect call buttons.
  ensureCallButtons();
}


// ============================================================
// SEND MESSAGE
// ============================================================

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

            body: JSON.stringify({
              receiver_id:
                selectedUser.id,

              message
            })
          }
        );


        messageInput.value = "";

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


// ============================================================
// AUTO REFRESH
// ============================================================

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

          ensureCallButtons();
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

    messageTimer = null;
  }
}


// ============================================================
// REFRESH
// ============================================================

if (refreshUsers) {

  refreshUsers.addEventListener(
    "click",
    async () => {

      await loadUsers();

      ensureCallButtons();
    }
  );
}


if (reloadMessages) {

  reloadMessages.addEventListener(
    "click",
    async () => {

      await loadMessages();

      ensureCallButtons();
    }
  );
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      if (peerConnection) {
        await endCall(false);
      }


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

      currentUser = null;
      selectedUser = null;

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


// ============================================================
// MOBILE BACK
// ============================================================

const chatArea =
  document.querySelector(
    ".chat-area"
  );


if (chatArea) {

  chatArea.addEventListener(
    "click",
    event => {

      if (
        window.innerWidth <= 700 &&
        event.target ===
          document.querySelector(
            ".chat-header"
          )
      ) {

        chatScreen.classList.remove(
          "chat-open"
        );

        stopMessageRefresh();
      }

    }
  );
}


// ============================================================
// PROFILE
// ============================================================

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
    profilePhotoInput.value = "";
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

      profilePhotoInput.click();
    }
  );
}


if (changeProfilePhoto) {

  changeProfilePhoto.addEventListener(
    "click",
    () => {

      profilePhotoInput.click();
    }
  );
}


// ============================================================
// PROFILE PHOTO UPLOAD
// ============================================================

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

              body: JSON.stringify({
                profile_photo:
                  imageData
              })
            }
          );


        currentUser =
          data.user ||
          {
            ...currentUser,
            profile_photo:
              imageData
          };


        updateProfilePanel();

        renderCurrentChatAvatar();

        await loadUsers();

        ensureCallButtons();

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


// ============================================================
// REMOVE PROFILE PHOTO
// ============================================================

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

        renderCurrentChatAvatar();

        await loadUsers();

        ensureCallButtons();

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


// ============================================================
// IMAGE PROCESSING
// ============================================================

function imageToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        const img =
          new Image();


        img.onload = () => {

          const maxSize =
            720;

          let width =
            img.width;

          let height =
            img.height;


          if (
            width > maxSize ||
            height > maxSize
          ) {

            const scale =
              Math.min(
                maxSize / width,
                maxSize / height
              );

            width =
              Math.round(
                width * scale
              );

            height =
              Math.round(
                height * scale
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
          () =>
            reject(
              new Error(
                "Invalid image"
              )
            );


        img.src =
          reader.result;
      };


      reader.onerror =
        () =>
          reject(
            new Error(
              "Could not read image"
            )
          );


      reader.readAsDataURL(
        file
      );
    }
  );
}


function renderCurrentChatAvatar() {

  if (!selectedUser) {
    return;
  }

  setAvatar(
    chatAvatar,
    selectedUser
  );
}


// ============================================================
// CALL CONFIG
// ============================================================

const RTC_CONFIG = {

  iceServers: [
    {
      urls:
        "stun:stun.l.google.com:19302"
    },
    {
      urls:
        "stun:stun1.l.google.com:19302"
    }
  ]

};


// ============================================================
// CALL ID
// ============================================================

function generateCallId() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();
  }


  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


// ============================================================
// MEDIA
// ============================================================

async function getMedia(
  type
) {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices
      .getUserMedia
  ) {

    throw new Error(
      "Camera and microphone are not supported"
    );
  }


  const video =
    type === "video";


  return navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video
    });
}


// ============================================================
// CREATE PEER
// ============================================================

function createPeerConnection() {

  if (peerConnection) {

    try {
      peerConnection.close();
    } catch {}
  }


  peerConnection =
    new RTCPeerConnection(
      RTC_CONFIG
    );


  remoteStream =
    new MediaStream();


  if (remoteVideo) {
    remoteVideo.srcObject =
      remoteStream;
  }

  if (remoteAudio) {
    remoteAudio.srcObject =
      remoteStream;
  }


  peerConnection.ontrack =
    event => {

      event.streams[0]
        ?.getTracks()
        .forEach(
          track => {

            if (
              !remoteStream
                .getTracks()
                .includes(track)
            ) {

              remoteStream.addTrack(
                track
              );
            }
          }
        );


      remoteVideo.srcObject =
        remoteStream;

      remoteAudio.srcObject =
        remoteStream;


      remoteVideo
        .play()
        .catch(() => {});

      remoteAudio
        .play()
        .catch(() => {});


      if (
        currentCallType ===
        "video"
      ) {

        remoteVideo.classList.remove(
          "hidden"
        );

        voiceCallView.classList.add(
          "hidden"
        );

      } else {

        remoteVideo.classList.add(
          "hidden"
        );

        voiceCallView.classList.remove(
          "hidden"
        );
      }
    };


  peerConnection.onicecandidate =
    async event => {

      if (
        !event.candidate ||
        !currentCallId ||
        !currentCallUser
      ) {

        return;
      }


      try {

        await sendSignal(
          "ice-candidate",
          event.candidate
        );

      } catch (error) {

        console.error(
          "ICE signal error:",
          error
        );
      }
    };


  peerConnection.onconnectionstatechange =
    () => {

      if (!peerConnection) {
        return;
      }


      const state =
        peerConnection
          .connectionState;


      if (
        state ===
        "connected"
      ) {

        setCallConnected();

      } else if (
        state === "failed" ||
        state === "disconnected"
      ) {

        voiceCallStatus.textContent =
          "Connection lost";
      }
    };


  return peerConnection;
}


// ============================================================
// START OUTGOING CALL
// ============================================================

async function startCall(
  type
) {

  if (!selectedUser) {

    showToast(
      "Select a user first"
    );

    return;
  }


  if (
    peerConnection ||
    currentCallId
  ) {

    showToast(
      "Already in a call"
    );

    return;
  }


  try {

    currentCallId =
      generateCallId();

    currentCallType =
      type;

    currentCallUser = {
      ...selectedUser
    };

    currentCallDirection =
      "outgoing";


    localStream =
      await getMedia(type);


    createPeerConnection();


    localStream
      .getTracks()
      .forEach(
        track =>
          peerConnection.addTrack(
            track,
            localStream
          )
      );


    showCallScreen(
      currentCallUser,
      type
    );


    callUserName.textContent =
      currentCallUser.username;

    voiceCallName.textContent =
      currentCallUser.username;

    setAvatarData(
      voiceCallAvatar,
      currentCallUser.username,
      currentCallUser.profile_photo
    );


    voiceCallStatus.textContent =
      "Calling...";


    const offer =
      await peerConnection
        .createOffer();


    await peerConnection
      .setLocalDescription(
        offer
      );


    await sendSignal(
      "offer",
      {
        type: offer.type,
        sdp: offer.sdp,
        call_type: type
      }
    );


    startSignalPolling();

    startCallDuration();


  } catch (error) {

    console.error(
      "Start call error:",
      error
    );


    showToast(
      error.message ||
      "Could not start call"
    );


    await cleanupCall(
      false
    );
  }
}


// ============================================================
// SHOW CALL SCREEN
// ============================================================

function showCallScreen(
  user,
  type
) {

  callScreen.classList.remove(
    "hidden"
  );


  callUserName.textContent =
    user?.username ||
    "User";


  if (type === "video") {

    remoteVideo.classList.remove(
      "hidden"
    );

    voiceCallView.classList.add(
      "hidden"
    );

    localVideo.classList.remove(
      "hidden"
    );

  } else {

    remoteVideo.classList.add(
      "hidden"
    );

    voiceCallView.classList.remove(
      "hidden"
    );

    localVideo.classList.add(
      "hidden"
    );
  }


  if (
    localStream &&
    type === "video"
  ) {

    localVideo.srcObject =
      localStream;

    localVideo
      .play()
      .catch(() => {});
  }
}


// ============================================================
// INCOMING CALL POLLING
// ============================================================

function startIncomingCallPolling() {

  stopIncomingCallPolling();


  incomingCallTimer =
    setInterval(
      checkIncomingCalls,
      2500
    );


  checkIncomingCalls();
}


function stopIncomingCallPolling() {

  if (incomingCallTimer) {

    clearInterval(
      incomingCallTimer
    );

    incomingCallTimer = null;
  }
}


async function checkIncomingCalls() {

  if (
    !currentUser ||
    !getToken()
  ) {

    return;
  }


  if (
    currentCallId ||
    pendingIncomingCall
  ) {

    return;
  }


  try {

    const data =
      await api(
        `/calls/incoming?since=${encodeURIComponent(
          lastIncomingSignalTime
        )}`
      );


    const calls =
      data.signals ||
      data.calls ||
      data.results ||
      [];


    if (!Array.isArray(calls)) {
      return;
    }


    for (
      const signal of calls
    ) {

      const created =
        Number(
          signal.created_at ||
          Date.now()
        );


      if (
        created >
        lastIncomingSignalTime
      ) {

        lastIncomingSignalTime =
          created;
      }


      if (
        signal.signal_type ===
        "offer"
      ) {

        handleIncomingOffer(
          signal
        );

        break;
      }
    }

  } catch (error) {

    console.error(
      "Incoming call polling:",
      error
    );
  }
}


// ============================================================
// INCOMING OFFER
// ============================================================

function handleIncomingOffer(
  signal
) {

  if (
    currentCallId ||
    pendingIncomingCall
  ) {

    return;
  }


  let offerData;


  try {

    offerData =
      typeof signal.signal_data ===
      "string"

        ? JSON.parse(
            signal.signal_data
          )

        : signal.signal_data;

  } catch {

    console.error(
      "Invalid offer"
    );

    return;
  }


  if (
    !offerData ||
    !offerData.sdp
  ) {

    return;
  }


  const sender =
    signal.sender ||
    signal.from_user ||
    {};


  const senderId =
    Number(
      signal.sender_id ||
      sender.id
    );


  if (!senderId) {
    return;
  }


  pendingIncomingCall = {

    callId:
      signal.call_id,

    senderId,

    username:
      sender.username ||
      signal.sender_username ||
      "User",

    profilePhoto:
      sender.profile_photo ||
      signal.sender_profile_photo ||
      null,

    type:
      offerData.call_type ===
      "video"
        ? "video"
        : "voice",

    offer: {
      type:
        offerData.type ||
        "offer",

      sdp:
        offerData.sdp
    }
  };


  showIncomingCall(
    pendingIncomingCall
  );


  playRingtone();
}


// ============================================================
// INCOMING CALL UI
// ============================================================

function showIncomingCall(
  call
) {

  incomingCallName.textContent =
    call.username;


  incomingCallType.textContent =
    call.type === "video"
      ? "Video call"
      : "Voice call";


  setAvatarData(
    incomingCallAvatar,
    call.username,
    call.profilePhoto
  );


  incomingCall.classList.remove(
    "hidden"
  );
}


function hideIncomingCall() {

  incomingCall.classList.add(
    "hidden"
  );

  stopRingtone();
}


// ============================================================
// ACCEPT CALL
// ============================================================

acceptCallBtn.addEventListener(
  "click",
  async () => {

    if (
      !pendingIncomingCall
    ) {

      return;
    }


    const call =
      pendingIncomingCall;


    try {

      pendingIncomingCall =
        null;

      hideIncomingCall();


      currentCallId =
        call.callId;

      currentCallType =
        call.type;

      currentCallUser = {

        id:
          call.senderId,

        username:
          call.username,

        profile_photo:
          call.profilePhoto
      };

      currentCallDirection =
        "incoming";


      localStream =
        await getMedia(
          call.type
        );


      createPeerConnection();


      localStream
        .getTracks()
        .forEach(
          track =>
            peerConnection.addTrack(
              track,
              localStream
            )
        );


      showCallScreen(
        currentCallUser,
        call.type
      );


      setAvatarData(
        voiceCallAvatar,
        call.username,
        call.profilePhoto
      );


      await peerConnection
        .setRemoteDescription(
          new RTCSessionDescription(
            call.offer
          )
        );


      const answer =
        await peerConnection
          .createAnswer();


      await peerConnection
        .setLocalDescription(
          answer
        );


      await sendSignal(
        "answer",
        {
          type:
            answer.type,

          sdp:
            answer.sdp
        }
      );


      startSignalPolling();

      startCallDuration();


      voiceCallStatus.textContent =
        "Connecting...";

    } catch (error) {

      console.error(
        "Accept call error:",
        error
      );


      showToast(
        error.message ||
        "Could not accept call"
      );


      await cleanupCall(
        false
      );
    }

  }
);


// ============================================================
// REJECT CALL
// ============================================================

rejectCallBtn.addEventListener(
  "click",
  async () => {

    const call =
      pendingIncomingCall;


    pendingIncomingCall =
      null;


    hideIncomingCall();


    if (!call) {
      return;
    }


    try {

      currentCallId =
        call.callId;

      currentCallUser = {

        id:
          call.senderId,

        username:
          call.username
      };


      await sendSignal(
        "reject",
        {
          reason:
            "rejected"
        }
      );

    } catch (error) {

      console.error(
        "Reject call error:",
        error
      );

    } finally {

      currentCallId = null;
      currentCallUser = null;
    }
  }
);


// ============================================================
// SEND SIGNAL
// ============================================================

async function sendSignal(
  signalType,
  signalData
) {

  if (
    !currentCallId ||
    !currentCallUser
  ) {

    throw new Error(
      "Call is not ready"
    );
  }


  return api(
    "/calls/signal",
    {
      method: "POST",

      body: JSON.stringify({

        call_id:
          currentCallId,

        receiver_id:
          Number(
            currentCallUser.id
          ),

        signal_type:
          signalType,

        signal_data:
          typeof signalData ===
          "string"

            ? signalData

            : JSON.stringify(
                signalData
              )
      })
    }
  );
}


// ============================================================
// SIGNAL POLLING
// ============================================================

function startSignalPolling() {

  stopSignalPolling();


  signalTimer =
    setInterval(
      pollCallSignals,
      1200
    );


  pollCallSignals();
}


function stopSignalPolling() {

  if (signalTimer) {

    clearInterval(
      signalTimer
    );

    signalTimer = null;
  }
}


async function pollCallSignals() {

  if (
    !currentCallId ||
    !currentUser
  ) {

    return;
  }


  try {

    const data =
      await api(
        `/calls/signals?call_id=${encodeURIComponent(
          currentCallId
        )}`
      );


    const signals =
      data.signals ||
      data.results ||
      [];


    if (!Array.isArray(signals)) {
      return;
    }


    for (
      const signal of signals
    ) {

      await processCallSignal(
        signal
      );
    }

  } catch (error) {

    console.error(
      "Call signal polling:",
      error
    );
  }
}


// ============================================================
// PROCESS SIGNAL
// ============================================================

async function processCallSignal(
  signal
) {

  if (
    !signal ||
    !peerConnection
  ) {

    return;
  }


  let data;


  try {

    data =
      typeof signal.signal_data ===
      "string"

        ? JSON.parse(
            signal.signal_data
          )

        : signal.signal_data;

  } catch {

    data =
      signal.signal_data;
  }


  switch (
    signal.signal_type
  ) {


    case "answer":

      if (
        peerConnection
          .signalingState ===
        "have-local-offer"
      ) {

        await peerConnection
          .setRemoteDescription(
            new RTCSessionDescription(
              data
            )
          );

        voiceCallStatus.textContent =
          "Connecting...";
      }

      break;


    case "ice-candidate":

      if (
        data &&
        peerConnection
          .remoteDescription
      ) {

        try {

          await peerConnection
            .addIceCandidate(
              new RTCIceCandidate(
                data
              )
            );

        } catch (error) {

          console.warn(
            "ICE candidate error:",
            error
          );
        }
      }

      break;


    case "reject":

      showToast(
        "Call declined"
      );

      await cleanupCall(
        false
      );

      break;


    case "busy":

      showToast(
        "User is busy"
      );

      await cleanupCall(
        false
      );

      break;


    case "end":

      showToast(
        "Call ended"
      );

      await cleanupCall(
        false
      );

      break;
  }
}


// ============================================================
// CALL CONNECTED
// ============================================================

function setCallConnected() {

  voiceCallStatus.textContent =
    "Connected";

  chatStatus.textContent =
    "In call";
}


// ============================================================
// CALL DURATION
// ============================================================

function startCallDuration() {

  stopCallDuration();


  callStartedAt =
    Date.now();


  callDuration.textContent =
    "00:00";


  callDurationTimer =
    setInterval(
      () => {

        if (!callStartedAt) {
          return;
        }


        const seconds =
          Math.floor(
            (
              Date.now() -
              callStartedAt
            ) / 1000
          );


        const minutes =
          Math.floor(
            seconds / 60
          );


        const remaining =
          seconds % 60;


        callDuration.textContent =
          `${String(minutes).padStart(
            2,
            "0"
          )}:${String(
            remaining
          ).padStart(
            2,
            "0"
          )}`;

      },
      1000
    );
}


function stopCallDuration() {

  if (callDurationTimer) {

    clearInterval(
      callDurationTimer
    );

    callDurationTimer = null;
  }


  callStartedAt = null;
}


// ============================================================
// MUTE
// ============================================================

muteCallBtn.addEventListener(
  "click",
  () => {

    if (!localStream) {
      return;
    }


    const tracks =
      localStream.getAudioTracks();


    if (!tracks.length) {
      return;
    }


    isMuted =
      !isMuted;


    tracks.forEach(
      track => {
        track.enabled =
          !isMuted;
      }
    );


    muteCallBtn.textContent =
      isMuted
        ? "🔇"
        : "🎤";
  }
);


// ============================================================
// CAMERA
// ============================================================

cameraCallBtn.addEventListener(
  "click",
  () => {

    if (!localStream) {
      return;
    }


    const tracks =
      localStream.getVideoTracks();


    if (!tracks.length) {
      return;
    }


    isCameraOff =
      !isCameraOff;


    tracks.forEach(
      track => {
        track.enabled =
          !isCameraOff;
      }
    );


    cameraCallBtn.textContent =
      "▣";
  }
);


// ============================================================
// SWITCH CAMERA
// ============================================================

switchCameraBtn.addEventListener(
  "click",
  async () => {

    if (
      !localStream ||
      currentCallType !==
        "video"
    ) {

      return;
    }


    const videoTracks =
      localStream
        .getVideoTracks();


    if (!videoTracks.length) {
      return;
    }


    const oldTrack =
      videoTracks[0];


    try {

      const devices =
        await navigator
          .mediaDevices
          .enumerateDevices();


      const cameras =
        devices.filter(
          device =>
            device.kind ===
            "videoinput"
        );


      if (
        cameras.length < 2
      ) {

        showToast(
          "No other camera"
        );

        return;
      }


      const currentId =
        oldTrack.getSettings()
          .deviceId;


      let index =
        cameras.findIndex(
          camera =>
            camera.deviceId ===
            currentId
        );


      index =
        index < 0
          ? 0
          : index;


      const nextCamera =
        cameras[
          (index + 1) %
          cameras.length
        ];


      const newStream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: false,

            video: {
              deviceId: {
                exact:
                  nextCamera.deviceId
              }
            }
          });


      const newTrack =
        newStream
          .getVideoTracks()[0];


      const sender =
        peerConnection
          ?.getSenders()
          .find(
            item =>
              item.track &&
              item.track.kind ===
              "video"
          );


      if (sender) {

        await sender
          .replaceTrack(
            newTrack
          );
      }


      localStream.removeTrack(
        oldTrack
      );


      oldTrack.stop();


      localStream.addTrack(
        newTrack
      );


      localVideo.srcObject =
        localStream;


    } catch (error) {

      console.error(
        "Switch camera error:",
        error
      );

      showToast(
        "Could not switch camera"
      );
    }
  }
);


// ============================================================
// END CALL
// ============================================================

endCallBtn.addEventListener(
  "click",
  async () => {

    await endCall(
      true
    );
  }
);


async function endCall(
  sendEnd
) {

  if (
    sendEnd &&
    currentCallId &&
    currentCallUser
  ) {

    try {

      await sendSignal(
        "end",
        {
          reason:
            "hangup"
        }
      );

    } catch (error) {

      console.error(
        "End signal error:",
        error
      );
    }
  }


  await cleanupCall(
    false
  );
}


// ============================================================
// CLEANUP CALL
// ============================================================

async function cleanupCall(
  clearRemote
) {

  stopSignalPolling();

  stopCallDuration();

  stopRingtone();


  if (localStream) {

    localStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    localStream = null;
  }


  if (remoteStream) {

    remoteStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    remoteStream = null;
  }


  if (peerConnection) {

    try {
      peerConnection.close();
    } catch {}

    peerConnection = null;
  }


  if (localVideo) {

    localVideo.srcObject =
      null;
  }


  if (clearRemote !== false) {

    remoteVideo.srcObject =
      null;

    remoteAudio.srcObject =
      null;
  }


  callScreen.classList.add(
    "hidden"
  );


  currentCallId = null;
  currentCallType = null;
  currentCallUser = null;
  currentCallDirection = null;


  isMuted = false;
  isCameraOff = false;


  muteCallBtn.textContent =
    "🎤";

  cameraCallBtn.textContent =
    "▣";

  callDuration.textContent =
    "00:00";

  voiceCallStatus.textContent =
    "Calling...";


  if (selectedUser) {

    chatStatus.textContent =
      "Available";
  }


  // Restore buttons after call cleanup.
  setTimeout(
    ensureCallButtons,
    0
  );
}


// ============================================================
// RINGTONE
// ============================================================

function playRingtone() {

  if (!ringtone) {
    return;
  }


  try {

    if (
      ringtone.src
    ) {

      ringtone.currentTime =
        0;

      ringtone
        .play()
        .catch(() => {});

      return;
    }


    const audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();


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


// ============================================================
// SECURITY
// ============================================================

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


// ============================================================
// START
// ============================================================

ensureCallButtons();

startApp();


// Additional delayed checks.
// This handles browsers where the chat DOM
// becomes visible slightly after app startup.

setTimeout(
  ensureCallButtons,
  100
);

setTimeout(
  ensureCallButtons,
  500
);

setTimeout(
  ensureCallButtons,
  1500
);
