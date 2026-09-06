const API = "/api";

let currentUser = null;
let selectedUser = null;

let groupMessageTimer = null;
let privateMessageTimer = null;
let inboxTimer = null;

let isLoadingGroup = false;
let isLoadingPrivate = false;
let isLoadingInbox = false;

let toastTimer = null;


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);


/* AUTH */

const authScreen = $("authScreen");

const loginBox = $("loginBox");
const registerBox = $("registerBox");

const loginForm = $("loginForm");
const registerForm = $("registerForm");

const loginUsername = $("loginUsername");
const loginPassword = $("loginPassword");

const registerUsername = $("registerUsername");
const registerPassword = $("registerPassword");
const registerPasswordConfirm = $("registerPasswordConfirm");

const loginError = $("loginError");
const registerError = $("registerError");

const showRegister = $("showRegister");
const showLogin = $("showLogin");


/* CHAT */

const chatScreen = $("chatScreen");

const groupChat = $("groupChat");
const privateChat = $("privateChat");
const emptyChat = $("emptyChat");

const groupMessages = $("groupMessages");
const messagesBox = $("messagesBox");

const groupMessageForm = $("groupMessageForm");
const messageForm = $("messageForm");

const groupMessageInput = $("groupMessageInput");
const messageInput = $("messageInput");


/* GROUP */

const groupChatName = $("groupChatName");
const groupChatStatus = $("groupChatStatus");

const reloadGroupMessages = $("reloadGroupMessages");


/* PRIVATE */

const chatAvatar = $("chatAvatar");
const chatAvatarImage = $("chatAvatarImage");
const chatAvatarFallback = $("chatAvatarFallback");

const chatUsername = $("chatUsername");
const chatStatus = $("chatStatus");

const reloadMessages = $("reloadMessages");


/* PROFILE */

const myAvatarBtn = $("myAvatarBtn");
const myAvatar = $("myAvatar");
const myAvatarFallback = $("myAvatarFallback");

const myUsername = $("myUsername");

const profilePanel = $("profilePanel");

const profileAvatarImage = $("profileAvatarImage");
const profileAvatarFallback = $("profileAvatarFallback");

const profileUsername = $("profileUsername");

const profilePhotoInput = $("profilePhotoInput");
const removeProfilePhoto = $("removeProfilePhoto");

const privateInbox = $("privateInbox");
const privateInboxCount = $("privateInboxCount");
const privateUserList = $("privateUserList");
const privateInboxEmpty = $("privateInboxEmpty");

const logoutBtn = $("logoutBtn");

const toast = $("toast");


/* =========================================================
   TOKEN
========================================================= */

const TOKEN_KEY = "dark_chat_token";


function getToken() {

  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  catch (error) {

    return "";
  }
}


function setToken(token) {

  try {

    if (token) {

      localStorage.setItem(
        TOKEN_KEY,
        token
      );

    } else {

      localStorage.removeItem(
        TOKEN_KEY
      );

    }

  }

  catch (error) {}
}


/* =========================================================
   API HELPER
========================================================= */

async function apiFetch(
  path,
  options = {}
) {

  const headers = new Headers(
    options.headers || {}
  );


  const token = getToken();


  if (token) {

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

  }


  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {

    headers.set(
      "Content-Type",
      "application/json"
    );

  }


  const response = await fetch(
    `${API}${path}`,
    {
      ...options,
      headers
    }
  );


  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  try {

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data = await response.json();

    } else {

      const text =
        await response.text();

      try {

        data = text
          ? JSON.parse(text)
          : null;

      } catch {

        data = {
          message: text
        };

      }

    }

  }

  catch {

    data = null;
  }


  if (!response.ok) {

    const message =
      data?.error ||
      data?.message ||
      `Request failed (${response.status})`;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.data = data;

    throw error;
  }


  return data;
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getFirst(
  object,
  keys,
  fallback = ""
) {

  if (!object || typeof object !== "object") {
    return fallback;
  }


  for (const key of keys) {

    if (
      object[key] !== undefined &&
      object[key] !== null
    ) {

      return object[key];
    }

  }


  return fallback;
}


function normalizeArray(data) {

  if (Array.isArray(data)) {
    return data;
  }


  if (!data || typeof data !== "object") {
    return [];
  }


  const candidates = [
    data.messages,
    data.items,
    data.data,
    data.results,
    data.conversations,
    data.users
  ];


  for (const item of candidates) {

    if (Array.isArray(item)) {
      return item;
    }

  }


  return [];
}


function getUserId(user) {

  return getFirst(
    user,
    [
      "id",
      "user_id",
      "userId"
    ],
    ""
  );
}


function getUsername(user) {

  return getFirst(
    user,
    [
      "username",
      "name",
      "sender_username",
      "sender_name"
    ],
    "User"
  );
}


function getAvatar(user) {

  return getFirst(
    user,
    [
      "avatar",
      "avatar_url",
      "avatarUrl",
      "profile_photo",
      "profile_photo_url",
      "photo",
      "photo_url"
    ],
    ""
  );
}


function getMessageText(message) {

  return getFirst(
    message,
    [
      "message",
      "text",
      "content",
      "body"
    ],
    ""
  );
}


function getMessageSenderId(message) {

  return getFirst(
    message,
    [
      "sender_id",
      "senderId",
      "user_id",
      "userId",
      "from_user_id",
      "fromUserId"
    ],
    ""
  );
}


function getMessageSenderName(message) {

  return getFirst(
    message,
    [
      "sender_username",
      "sender_name",
      "username",
      "name"
    ],
    "User"
  );
}


function getMessageAvatar(message) {

  return getFirst(
    message,
    [
      "sender_avatar",
      "sender_avatar_url",
      "avatar",
      "avatar_url",
      "profile_photo"
    ],
    ""
  );
}


function getMessageTime(message) {

  return getFirst(
    message,
    [
      "created_at",
      "createdAt",
      "timestamp",
      "time",
      "sent_at"
    ],
    ""
  );
}


function formatTime(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);
  }


  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function formatInboxTime(value) {

  if (!value) {
    return "";
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


  const now =
    new Date();


  const sameDay =
    date.toDateString() ===
    now.toDateString();


  if (sameDay) {

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }


  return date.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric"
    }
  );
}


function initials(name) {

  const value =
    String(name || "U")
      .trim();


  if (!value) {
    return "U";
  }


  const parts =
    value.split(/\s+/);


  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
}


function isMine(message) {

  const senderId =
    String(
      getMessageSenderId(message)
    );


  const myId =
    String(
      getUserId(currentUser)
    );


  if (
    senderId &&
    myId
  ) {

    return senderId === myId;
  }


  const senderName =
    String(
      getMessageSenderName(message)
    )
      .toLowerCase();


  const myName =
    String(
      getUsername(currentUser)
    )
      .toLowerCase();


  return (
    senderName &&
    myName &&
    senderName === myName
  );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = ""
) {

  if (!toast) {
    return;
  }


  clearTimeout(
    toastTimer
  );


  toast.textContent =
    String(message || "");


  toast.className =
    "";


  if (type) {

    toast.classList.add(
      type
    );

  }


  toastTimer =
    setTimeout(() => {

      toast.classList.add(
        "hidden"
      );

    }, 3000);
}


/* =========================================================
   ERROR
========================================================= */

function setError(
  element,
  message
) {

  if (!element) {
    return;
  }


  element.textContent =
    String(message || "");


  element.classList.toggle(
    "hidden",
    !message
  );
}


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLoginBox() {

  loginBox?.classList.remove(
    "hidden"
  );

  registerBox?.classList.add(
    "hidden"
  );

  setError(
    loginError,
    ""
  );

  setError(
    registerError,
    ""
  );
}


function showRegisterBox() {

  loginBox?.classList.add(
    "hidden"
  );

  registerBox?.classList.remove(
    "hidden"
  );

  setError(
    loginError,
    ""
  );

  setError(
    registerError,
    ""
  );
}


/* =========================================================
   SCREEN
========================================================= */

function showAuth() {

  stopTimers();

  currentUser = null;
  selectedUser = null;


  chatScreen?.classList.add(
    "hidden"
  );

  authScreen?.classList.remove(
    "hidden"
  );


  profilePanel?.classList.add(
    "hidden"
  );


  showLoginBox();
}


function showChat() {

  authScreen?.classList.add(
    "hidden"
  );

  chatScreen?.classList.remove(
    "hidden"
  );


  updateCurrentUserUI();


  openGroupChat();


  startTimers();
}


/* =========================================================
   CURRENT USER
========================================================= */

function updateCurrentUserUI() {

  if (!currentUser) {
    return;
  }


  const username =
    getUsername(
      currentUser
    );


  const avatar =
    getAvatar(
      currentUser
    );


  if (myUsername) {

    myUsername.textContent =
      username;
  }


  if (profileUsername) {

    profileUsername.textContent =
      username;
  }


  setAvatar(
    myAvatar,
    myAvatarFallback,
    avatar,
    username
  );


  setAvatar(
    profileAvatarImage,
    profileAvatarFallback,
    avatar,
    username
  );
}


/* =========================================================
   AVATAR
========================================================= */

function setAvatar(
  imageElement,
  fallbackElement,
  avatarUrl,
  username
) {

  const fallback =
    initials(username);


  if (fallbackElement) {

    fallbackElement.textContent =
      fallback;
  }


  if (
    imageElement &&
    avatarUrl
  ) {

    imageElement.src =
      avatarUrl;

    imageElement.classList.remove(
      "hidden"
    );


    imageElement.onerror =
      () => {

        imageElement.classList.add(
          "hidden"
        );

        fallbackElement?.classList.remove(
          "hidden"
        );

      };


    fallbackElement?.classList.add(
      "hidden"
    );

  } else {

    imageElement?.classList.add(
      "hidden"
    );

    fallbackElement?.classList.remove(
      "hidden"
    );
  }
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  setError(
    loginError,
    ""
  );


  const username =
    loginUsername.value.trim();


  const password =
    loginPassword.value;


  if (!username || !password) {

    setError(
      loginError,
      "Enter username and password."
    );

    return;
  }


  const submit =
    loginForm.querySelector(
      'button[type="submit"]'
    );


  submit.disabled =
    true;


  try {

    const data =
      await apiFetch(
        "/login",
        {
          method: "POST",

          body: JSON.stringify({
            username,
            password
          })
        }
      );


    const token =
      getFirst(
        data,
        [
          "token",
          "access_token",
          "accessToken"
        ],
        ""
      );


    if (token) {

      setToken(
        token
      );

    }


    const user =
      getFirst(
        data,
        [
          "user",
          "currentUser"
        ],
        null
      );


    if (user) {

      currentUser =
        user;

    } else {

      currentUser =
        await getMe();

    }


    if (!currentUser) {

      throw new Error(
        "Login succeeded but user information was not returned."
      );
    }


    loginPassword.value =
      "";


    showChat();


    showToast(
      "Login successful.",
      "success"
    );

  }

  catch (error) {

    setError(
      loginError,
      error.message ||
      "Login failed."
    );

  }

  finally {

    submit.disabled =
      false;
  }
}


/* =========================================================
   REGISTER
========================================================= */

async function register() {

  setError(
    registerError,
    ""
  );


  const username =
    registerUsername.value.trim();


  const password =
    registerPassword.value;


  const confirm =
    registerPasswordConfirm.value;


  if (
    username.length < 3
  ) {

    setError(
      registerError,
      "Username must be at least 3 characters."
    );

    return;
  }


  if (
    password.length < 4
  ) {

    setError(
      registerError,
      "Password must be at least 4 characters."
    );

    return;
  }


  if (
    password !== confirm
  ) {

    setError(
      registerError,
      "Passwords do not match."
    );

    return;
  }


  const submit =
    registerForm.querySelector(
      'button[type="submit"]'
    );


  submit.disabled =
    true;


  try {

    const data =
      await apiFetch(
        "/register",
        {
          method: "POST",

          body: JSON.stringify({
            username,
            password
          })
        }
      );


    const token =
      getFirst(
        data,
        [
          "token",
          "access_token",
          "accessToken"
        ],
        ""
      );


    if (token) {

      setToken(
        token
      );

    }


    let user =
      getFirst(
        data,
        [
          "user",
          "currentUser"
        ],
        null
      );


    if (!user && token) {

      user =
        await getMe();

    }


    if (user) {

      currentUser =
        user;

      showChat();

      showToast(
        "Account created successfully.",
        "success"
      );

    } else {

      registerUsername.value =
        "";

      registerPassword.value =
        "";

      registerPasswordConfirm.value =
        "";


      showLoginBox();

      loginUsername.value =
        username;


      showToast(
        "Registration successful. Please login.",
        "success"
      );
    }

  }

  catch (error) {

    setError(
      registerError,
      error.message ||
      "Registration failed."
    );

  }

  finally {

    submit.disabled =
      false;
  }
}


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getMe() {

  try {

    const data =
      await apiFetch(
        "/me"
      );


    return getFirst(
      data,
      [
        "user",
        "currentUser"
      ],
      data
    );

  }

  catch (error) {

    if (
      error.status === 401 ||
      error.status === 403
    ) {

      setToken("");
    }


    return null;
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  stopTimers();


  try {

    if (getToken()) {

      await apiFetch(
        "/logout",
        {
          method: "POST"
        }
      );

    }

  }

  catch (error) {
    // Local logout still continues.
  }


  setToken("");


  currentUser =
    null;


  selectedUser =
    null;


  groupMessages.innerHTML =
    "";


  messagesBox.innerHTML =
    "";


  privateUserList.innerHTML =
    "";


  profilePanel?.classList.add(
    "hidden"
  );


  showAuth();


  showToast(
    "Logged out.",
    "success"
  );
}


/* =========================================================
   GROUP CHAT
========================================================= */

function openGroupChat() {

  selectedUser =
    null;


  privateChat?.classList.add(
    "hidden"
  );


  emptyChat?.classList.add(
    "hidden"
  );


  groupChat?.classList.remove(
    "hidden"
  );


  if (groupChatName) {

    groupChatName.textContent =
      "Public Group Chat";
  }


  if (groupChatStatus) {

    groupChatStatus.textContent =
      "Everyone";
  }


  stopPrivateTimer();


  startGroupTimer();


  loadGroupMessages(
    true
  );
}


/* =========================================================
   LOAD GROUP MESSAGES
========================================================= */

async function loadGroupMessages(
  forceScroll = false
) {

  if (
    isLoadingGroup ||
    !currentUser
  ) {

    return;
  }


  isLoadingGroup =
    true;


  try {

    const data =
      await apiFetch(
        "/group/messages"
      );


    const messages =
      normalizeArray(
        data
      );


    renderGroupMessages(
      messages,
      forceScroll
    );

  }

  catch (error) {

    if (
      error.status === 401 ||
      error.status === 403
    ) {

      await logout();

      return;
    }


    if (
      groupMessages &&
      !groupMessages.children.length
    ) {

      showToast(
        error.message ||
        "Unable to load group messages.",
        "error"
      );
    }

  }

  finally {

    isLoadingGroup =
      false;
  }
}


/* =========================================================
   RENDER GROUP
========================================================= */

function renderGroupMessages(
  messages,
  forceScroll = false
) {

  if (!groupMessages) {
    return;
  }


  const previousHeight =
    groupMessages.scrollHeight;


  const previousTop =
    groupMessages.scrollTop;


  const wasNearBottom =
    (
      previousHeight -
      previousTop -
      groupMessages.clientHeight
    ) < 120;


  let html = "";


  for (const message of messages) {

    const mine =
      isMine(message);


    const senderId =
      getMessageSenderId(
        message
      );


    const senderName =
      getMessageSenderName(
        message
      );


    const avatar =
      getMessageAvatar(
        message
      );


    const text =
      getMessageText(
        message
      );


    const time =
      formatTime(
        getMessageTime(
          message
        )
      );


    if (!text) {
      continue;
    }


    if (mine) {

      html += `
        <div class="group-message mine">

          <div class="message-content">

            <div class="message-bubble">
              ${escapeHTML(text)}
            </div>

            <div class="message-time">
              ${escapeHTML(time)}
            </div>

          </div>

        </div>
      `;

    } else {

      const safeId =
        escapeHTML(
          String(senderId)
        );


      html += `
        <div
          class="group-message other"
          data-user-id="${safeId}"
        >

          <div class="message-sender">

            <button
              class="avatar"
              type="button"
              data-private-user-id="${safeId}"
              data-private-username="${escapeHTML(senderName)}"
              data-private-avatar="${escapeHTML(avatar)}"
              title="Open private chat"
            >

              <span class="avatar-fallback">
                ${escapeHTML(initials(senderName))}
              </span>

              ${
                avatar
                  ? `
                    <img
                      src="${escapeHTML(avatar)}"
                      alt=""
                    >
                  `
                  : ""
              }

            </button>


            <span
              class="message-sender-name"
              data-private-user-id="${safeId}"
              data-private-username="${escapeHTML(senderName)}"
              data-private-avatar="${escapeHTML(avatar)}"
            >
              ${escapeHTML(senderName)}
            </span>

          </div>


          <div class="message-content">

            <div class="message-bubble">
              ${escapeHTML(text)}
            </div>

            <div class="message-time">
              ${escapeHTML(time)}
            </div>

          </div>

        </div>
      `;
    }
  }


  groupMessages.innerHTML =
    html;


  if (
    forceScroll ||
    wasNearBottom
  ) {

    groupMessages.scrollTop =
      groupMessages.scrollHeight;

  } else {

    const difference =
      groupMessages.scrollHeight -
      previousHeight;


    groupMessages.scrollTop =
      previousTop +
      difference;
  }
}


/* =========================================================
   PRIVATE CHAT
========================================================= */

function openPrivateChat(
  user
) {

  if (!user) {
    return;
  }


  const userId =
    getUserId(user);


  if (!userId) {

    showToast(
      "Unable to open this user.",
      "error"
    );

    return;
  }


  const myId =
    getUserId(
      currentUser
    );


  if (
    myId &&
    String(myId) ===
    String(userId)
  ) {

    showToast(
      "You cannot open a private chat with yourself.",
      "error"
    );

    return;
  }


  selectedUser =
    {
      ...user,
      id: userId
    };


  groupChat?.classList.add(
    "hidden"
  );


  emptyChat?.classList.add(
    "hidden"
  );


  privateChat?.classList.remove(
    "hidden"
  );


  profilePanel?.classList.add(
    "hidden"
  );


  const username =
    getUsername(
      selectedUser
    );


  const avatar =
    getAvatar(
      selectedUser
    );


  chatUsername.textContent =
    username;


  chatStatus.textContent =
    "Private Chat";


  setAvatar(
    chatAvatarImage,
    chatAvatarFallback,
    avatar,
    username
  );


  messagesBox.innerHTML =
    "";


  stopGroupTimer();


  startPrivateTimer();


  loadPrivateMessages(
    true
  );


  loadInbox();


  setTimeout(
    () => {
      messageInput?.focus();
    },
    100
  );
}


/* =========================================================
   LOAD PRIVATE MESSAGES
========================================================= */

async function loadPrivateMessages(
  forceScroll = false
) {

  if (
    isLoadingPrivate ||
    !currentUser ||
    !selectedUser
  ) {

    return;
  }


  const userId =
    getUserId(
      selectedUser
    );


  if (!userId) {
    return;
  }


  isLoadingPrivate =
    true;


  try {

    const data =
      await apiFetch(
        `/messages?user_id=${encodeURIComponent(userId)}`
      );


    const messages =
      normalizeArray(
        data
      );


    renderPrivateMessages(
      messages,
      forceScroll
    );


    markPrivateMessagesRead(
      userId
    );

  }

  catch (error) {

    if (
      error.status === 401 ||
      error.status === 403
    ) {

      await logout();

      return;
    }


    if (
      messagesBox &&
      !messagesBox.children.length
    ) {

      showToast(
        error.message ||
        "Unable to load private messages.",
        "error"
      );
    }

  }

  finally {

    isLoadingPrivate =
      false;
  }
}


/* =========================================================
   RENDER PRIVATE
========================================================= */

function renderPrivateMessages(
  messages,
  forceScroll = false
) {

  if (!messagesBox) {
    return;
  }


  const wasNearBottom =
    (
      messagesBox.scrollHeight -
      messagesBox.scrollTop -
      messagesBox.clientHeight
    ) < 120;


  let html = "";


  for (const message of messages) {

    const mine =
      isMine(message);


    const text =
      getMessageText(
        message
      );


    if (!text) {
      continue;
    }


    const time =
      formatTime(
        getMessageTime(
          message
        )
      );


    html += `
      <div
        class="private-message ${mine ? "mine" : "other"}"
      >

        <div class="message-content">

          <div class="message-bubble">
            ${escapeHTML(text)}
          </div>

          <div class="message-time">
            ${escapeHTML(time)}
          </div>

        </div>

      </div>
    `;
  }


  messagesBox.innerHTML =
    html;


  if (
    forceScroll ||
    wasNearBottom
  ) {

    messagesBox.scrollTop =
      messagesBox.scrollHeight;
  }
}


/* =========================================================
   SEND GROUP MESSAGE
========================================================= */

async function sendGroupMessage() {

  const text =
    groupMessageInput.value.trim();


  if (!text) {
    return;
  }


  if (!currentUser) {
    return;
  }


  const submit =
    groupMessageForm.querySelector(
      'button[type="submit"]'
    );


  submit.disabled =
    true;


  try {

    await apiFetch(
      "/group/messages",
      {
        method: "POST",

        body: JSON.stringify({
          message: text
        })
      }
    );


    groupMessageInput.value =
      "";


    await loadGroupMessages(
      true
    );

  }

  catch (error) {

    showToast(
      error.message ||
      "Unable to send message.",
      "error"
    );

  }

  finally {

    submit.disabled =
      false;

    groupMessageInput.focus();
  }
}


/* =========================================================
   SEND PRIVATE MESSAGE
========================================================= */

async function sendPrivateMessage() {

  if (
    !currentUser ||
    !selectedUser
  ) {

    return;
  }


  const text =
    messageInput.value.trim();


  if (!text) {
    return;
  }


  const userId =
    getUserId(
      selectedUser
    );


  if (!userId) {
    return;
  }


  const submit =
    messageForm.querySelector(
      'button[type="submit"]'
    );


  submit.disabled =
    true;


  try {

    await apiFetch(
      "/messages",
      {
        method: "POST",

        body: JSON.stringify({
          user_id: userId,
          message: text
        })
      }
    );


    messageInput.value =
      "";


    await loadPrivateMessages(
      true
    );


    await loadInbox();

  }

  catch (error) {

    showToast(
      error.message ||
      "Unable to send message.",
      "error"
    );

  }

  finally {

    submit.disabled =
      false;

    messageInput.focus();
  }
}


/* =========================================================
   MARK READ
========================================================= */

async function markPrivateMessagesRead(
  userId
) {

  if (!userId) {
    return;
  }


  try {

    await apiFetch(
      "/messages/read",
      {
        method: "POST",

        body: JSON.stringify({
          user_id: userId
        })
      }
    );

  }

  catch (error) {
    // Read marker failure should not break chat.
  }
}


/* =========================================================
   PRIVATE INBOX
========================================================= */

async function loadInbox() {

  if (
    isLoadingInbox ||
    !currentUser
  ) {

    return;
  }


  isLoadingInbox =
    true;


  try {

    const data =
      await apiFetch(
        "/messages/inbox"
      );


    const conversations =
      normalizeArray(
        data
      );


    renderInbox(
      conversations
    );

  }

  catch (error) {

    if (
      error.status === 401 ||
      error.status === 403
    ) {

      await logout();

      return;
    }

  }

  finally {

    isLoadingInbox =
      false;
  }
}


/* =========================================================
   NORMALIZE INBOX
========================================================= */

function normalizeConversation(
  item
) {

  const user =
    item.user ||
    item.other_user ||
    item.otherUser ||
    item.recipient ||
    item.sender ||
    item;


  const userId =
    getFirst(
      item,
      [
        "user_id",
        "userId",
        "other_user_id",
        "otherUserId",
        "sender_id"
      ],
      getUserId(user)
    );


  const username =
    getFirst(
      item,
      [
        "username",
        "other_username",
        "otherUsername",
        "sender_username"
      ],
      getUsername(user)
    );


  const avatar =
    getFirst(
      item,
      [
        "avatar",
        "avatar_url",
        "other_avatar",
        "other_avatar_url",
        "sender_avatar"
      ],
      getAvatar(user)
    );


  const lastMessage =
    getFirst(
      item,
      [
        "last_message",
        "lastMessage",
        "message",
        "text",
        "preview"
      ],
      ""
    );


  const lastTime =
    getFirst(
      item,
      [
        "last_message_at",
        "lastMessageAt",
        "created_at",
        "createdAt",
        "timestamp",
        "time"
      ],
      ""
    );


  const unread =
    Number(
      getFirst(
        item,
        [
          "unread",
          "unread_count",
          "unreadCount",
          "new_messages"
        ],
        0
      )
    ) || 0;


  return {

    id: userId,

    username,

    avatar,

    lastMessage,

    lastTime,

    unread
  };
}


/* =========================================================
   RENDER INBOX
========================================================= */

function renderInbox(
  conversations
) {

  if (!privateUserList) {
    return;
  }


  const list =
    conversations
      .map(
        normalizeConversation
      )
      .filter(
        item => item.id
      );


  privateUserList.innerHTML =
    "";


  let totalUnread =
    0;


  for (
    const conversation
    of list
  ) {

    totalUnread +=
      conversation.unread;


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "private-inbox-item";


    const selectedId =
      getUserId(
        selectedUser
      );


    if (
      selectedId &&
      String(selectedId) ===
      String(conversation.id)
    ) {

      button.classList.add(
        "active"
      );
    }


    const avatar =
      document.createElement(
        "div"
      );


    avatar.className =
      "private-inbox-avatar";


    const avatarUrl =
      conversation.avatar;


    if (avatarUrl) {

      const img =
        document.createElement(
          "img"
        );


      img.src =
        avatarUrl;


      img.alt =
        "";


      img.onerror =
        () => {

          img.remove();

          avatar.textContent =
            initials(
              conversation.username
            );
        };


      avatar.appendChild(
        img
      );

    } else {

      avatar.textContent =
        initials(
          conversation.username
        );
    }


    const info =
      document.createElement(
        "div"
      );


    info.className =
      "private-inbox-info";


    const name =
      document.createElement(
        "div"
      );


    name.className =
      "private-inbox-username";


    name.textContent =
      conversation.username;


    const preview =
      document.createElement(
        "div"
      );


    preview.className =
      "private-inbox-preview";


    preview.textContent =
      conversation.lastMessage ||
      "Private chat";


    info.appendChild(
      name
    );


    info.appendChild(
      preview
    );


    const right =
      document.createElement(
        "div"
      );


    right.className =
      "private-inbox-right";


    if (
      conversation.unread > 0
    ) {

      const badge =
        document.createElement(
          "span"
        );


      badge.className =
        "private-inbox-badge";


      badge.textContent =
        conversation.unread > 99
          ? "99+"
          : String(
              conversation.unread
            );


      right.appendChild(
        badge
      );
    }


    if (
      conversation.lastTime
    ) {

      const time =
        document.createElement(
          "span"
        );


      time.className =
        "private-inbox-time";


      time.textContent =
        formatInboxTime(
          conversation.lastTime
        );


      right.appendChild(
        time
      );
    }


    button.appendChild(
      avatar
    );


    button.appendChild(
      info
    );


    button.appendChild(
      right
    );


    button.addEventListener(
      "click",
      () => {

        openPrivateChat(
          {
            id:
              conversation.id,

            username:
              conversation.username,

            avatar:
              conversation.avatar
          }
        );

      }
    );


    privateUserList.appendChild(
      button
    );
  }


  if (privateInboxEmpty) {

    privateInboxEmpty.classList.toggle(
      "hidden",
      list.length > 0
    );
  }


  if (privateInboxCount) {

    privateInboxCount.textContent =
      `${list.length} ${
        list.length === 1
          ? "conversation"
          : "conversations"
      }`;
  }


  updateUnreadBadge(
    totalUnread
  );
}


/* =========================================================
   PROFILE UNREAD BADGE
========================================================= */

function updateUnreadBadge(
  count
) {

  if (!myAvatarBtn) {
    return;
  }


  let badge =
    myAvatarBtn.querySelector(
      ".profile-unread-badge"
    );


  if (
    count <= 0
  ) {

    badge?.remove();

    return;
  }


  if (!badge) {

    badge =
      document.createElement(
        "span"
      );


    badge.className =
      "profile-unread-badge";


    myAvatarBtn.appendChild(
      badge
    );
  }


  badge.textContent =
    count > 99
      ? "99+"
      : String(count);
}


/* =========================================================
   PROFILE PHOTO
========================================================= */

async function uploadProfilePhoto(
  file
) {

  if (
    !file ||
    !currentUser
  ) {

    return;
  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showToast(
      "Please select an image.",
      "error"
    );

    return;
  }


  const maxSize =
    8 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    showToast(
      "Image must be smaller than 8MB.",
      "error"
    );

    return;
  }


  try {

    const formData =
      new FormData();


    formData.append(
      "photo",
      file
    );


    const data =
      await apiFetch(
        "/profile/photo",
        {
          method: "POST",
          body: formData
        }
      );


    const user =
      getFirst(
        data,
        [
          "user",
          "currentUser"
        ],
        null
      );


    const avatar =
      getFirst(
        data,
        [
          "avatar",
          "avatar_url",
          "photo",
          "photo_url"
        ],
        getAvatar(
          user
        )
      );


    if (user) {

      currentUser =
        {
          ...currentUser,
          ...user
        };

    }


    if (avatar) {

      currentUser.avatar =
        avatar;
    }


    updateCurrentUserUI();


    await loadGroupMessages(
      false
    );


    if (selectedUser) {

      const selectedId =
        getUserId(
          selectedUser
        );


      if (
        selectedId
      ) {

        await loadPrivateMessages(
          false
        );
      }
    }


    showToast(
      "Profile photo updated.",
      "success"
    );

  }

  catch (error) {

    showToast(
      error.message ||
      "Unable to upload profile photo.",
      "error"
    );

  }

  finally {

    profilePhotoInput.value =
      "";
  }
}


/* =========================================================
   REMOVE PROFILE PHOTO
========================================================= */

async function removePhoto() {

  if (!currentUser) {
    return;
  }


  try {

    const data =
      await apiFetch(
        "/profile/photo",
        {
          method: "DELETE"
        }
      );


    const user =
      getFirst(
        data,
        [
          "user",
          "currentUser"
        ],
        null
      );


    if (user) {

      currentUser =
        {
          ...currentUser,
          ...user
        };

    }


    currentUser.avatar =
      "";


    currentUser.avatar_url =
      "";


    currentUser.photo =
      "";


    updateCurrentUserUI();


    showToast(
      "Profile photo removed.",
      "success"
    );

  }

  catch (error) {

    showToast(
      error.message ||
      "Unable to remove profile photo.",
      "error"
    );
  }
}


/* =========================================================
   PROFILE PANEL
========================================================= */

function toggleProfilePanel() {

  if (!profilePanel) {
    return;
  }


  profilePanel.classList.toggle(
    "hidden"
  );


  if (
    !profilePanel.classList.contains(
      "hidden"
    )
  ) {

    loadInbox();
  }
}


/* =========================================================
   PRIVATE BACK
========================================================= */

function backToGroup() {

  openGroupChat();
}


/* =========================================================
   TIMERS
========================================================= */

function stopGroupTimer() {

  if (groupMessageTimer) {

    clearInterval(
      groupMessageTimer
    );

    groupMessageTimer =
      null;
  }
}


function stopPrivateTimer() {

  if (privateMessageTimer) {

    clearInterval(
      privateMessageTimer
    );

    privateMessageTimer =
      null;
  }
}


function stopInboxTimer() {

  if (inboxTimer) {

    clearInterval(
      inboxTimer
    );

    inboxTimer =
      null;
  }
}


function startGroupTimer() {

  stopGroupTimer();


  groupMessageTimer =
    setInterval(
      () => {

        if (
          currentUser &&
          !groupChat.classList.contains(
            "hidden"
          )
        ) {

          loadGroupMessages(
            false
          );
        }

      },
      3000
    );
}


function startPrivateTimer() {

  stopPrivateTimer();


  privateMessageTimer =
    setInterval(
      () => {

        if (
          currentUser &&
          selectedUser &&
          !privateChat.classList.contains(
            "hidden"
          )
        ) {

          loadPrivateMessages(
            false
          );
        }

      },
      3000
    );
}


function startInboxTimer() {

  stopInboxTimer();


  inboxTimer =
    setInterval(
      () => {

        if (
          currentUser
        ) {

          loadInbox();
        }

      },
      3000
    );
}


function startTimers() {

  startGroupTimer();

  startInboxTimer();
}


function stopTimers() {

  stopGroupTimer();

  stopPrivateTimer();

  stopInboxTimer();
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

showRegister?.addEventListener(
  "click",
  showRegisterBox
);


showLogin?.addEventListener(
  "click",
  showLoginBox
);


loginForm?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    login();
  }
);


registerForm?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    register();
  }
);


groupMessageForm?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    sendGroupMessage();
  }
);


messageForm?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    sendPrivateMessage();
  }
);


reloadGroupMessages?.addEventListener(
  "click",
  () => {

    loadGroupMessages(
      true
    );
  }
);


reloadMessages?.addEventListener(
  "click",
  () => {

    loadPrivateMessages(
      true
    );
  }
);


logoutBtn?.addEventListener(
  "click",
  logout
);


myAvatarBtn?.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    toggleProfilePanel();
  }
);


profilePanel?.addEventListener(
  "click",
  event => {

    event.stopPropagation();
  }
);


profilePhotoInput?.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];


    if (file) {

      uploadProfilePhoto(
        file
      );
    }
  }
);


removeProfilePhoto?.addEventListener(
  "click",
  removePhoto
);


/* =========================================================
   GROUP USER CLICK
========================================================= */

groupMessages?.addEventListener(
  "click",
  event => {

    const target =
      event.target.closest(
        "[data-private-user-id]"
      );


    if (!target) {
      return;
    }


    const userId =
      target.getAttribute(
        "data-private-user-id"
      );


    const username =
      target.getAttribute(
        "data-private-username"
      ) ||
      "User";


    const avatar =
      target.getAttribute(
        "data-private-avatar"
      ) ||
      "";


    openPrivateChat(
      {
        id: userId,
        username,
        avatar
      }
    );
  }
);


/* =========================================================
   CLOSE PROFILE WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      profilePanel &&
      myAvatarBtn &&
      !profilePanel.classList.contains(
        "hidden"
      ) &&
      !profilePanel.contains(
        event.target
      ) &&
      !myAvatarBtn.contains(
        event.target
      )
    ) {

      profilePanel.classList.add(
        "hidden"
      );
    }
  }
);


/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      profilePanel?.classList.add(
        "hidden"
      );
    }
  }
);


/* =========================================================
   ENTER / CTRL+ENTER
========================================================= */

groupMessageInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      groupMessageForm?.requestSubmit();
    }
  }
);


messageInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      messageForm?.requestSubmit();
    }
  }
);


/* =========================================================
   IMAGE DRAG/DROP PREVENTION
========================================================= */

document.addEventListener(
  "dragover",
  event => {

    event.preventDefault();
  }
);


document.addEventListener(
  "drop",
  event => {

    if (
      !event.target.closest(
        "#profilePhotoInput"
      )
    ) {

      event.preventDefault();
    }
  }
);


/* =========================================================
   INITIAL AUTH CHECK
========================================================= */

async function initializeApp() {

  const token =
    getToken();


  if (!token) {

    showAuth();

    return;
  }


  try {

    currentUser =
      await getMe();


    if (currentUser) {

      showChat();

      return;
    }

  }

  catch (error) {}


  setToken("");

  showAuth();
}


/* =========================================================
   START
========================================================= */

initializeApp();
