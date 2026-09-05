const API = "/api";

let currentUser = null;
let selectedUser = null;

let groupMessageTimer = null;
let privateMessageTimer = null;


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

const groupChat =
  document.getElementById("groupChat");

const privateChat =
  document.getElementById("privateChat");


/* ============================================================
   GROUP CHAT ELEMENTS
============================================================ */

const groupAvatar =
  document.getElementById("groupAvatar");

const groupChatName =
  document.getElementById("groupChatName");

const groupChatStatus =
  document.getElementById("groupChatStatus");

const groupMessages =
  document.getElementById("groupMessages");

const groupMessageForm =
  document.getElementById("groupMessageForm");

const groupMessageInput =
  document.getElementById("groupMessageInput");

const reloadGroupMessages =
  document.getElementById(
    "reloadGroupMessages"
  );


/* ============================================================
   PRIVATE CHAT ELEMENTS
============================================================ */

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


/* ============================================================
   TOAST
============================================================ */

const toast =
  document.getElementById("toast");


/* ============================================================
   PROFILE ELEMENTS
============================================================ */

const myAvatarBtn =
  document.getElementById("myAvatarBtn");

const profilePanel =
  document.getElementById("profilePanel");

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

  if (!toast) return;

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


function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
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

  if (
    user &&
    user.profile_photo
  ) {

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
        ).value = email;

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

    currentUser =
      null;

    showAuth();
  }
}


/* ============================================================
   SHOW AUTH
============================================================ */

function showAuth() {

  stopGroupMessageRefresh();
  stopPrivateMessageRefresh();

  authScreen.classList.remove(
    "hidden"
  );

  chatScreen.classList.add(
    "hidden"
  );
}


/* ============================================================
   OPEN CHAT APP
============================================================ */

function openChatApp() {

  authScreen.classList.add(
    "hidden"
  );

  chatScreen.classList.remove(
    "hidden"
  );

  if (currentUser) {

    myUsername.textContent =
      currentUser.username;

    setAvatar(
      myAvatar,
      currentUser
    );
  }

  updateProfilePanel();

  /*
   * Load users for profile/private chat.
   */

  loadUsers();

  /*
   * IMPORTANT:
   * Login ဝင်တာနဲ့ Group Chat ကို
   * တန်းဖွင့်ထားမယ်။
   */

  openGroupChat();
}


/* ============================================================
   GROUP CHAT
============================================================ */

function openGroupChat() {

  selectedUser =
    null;

  stopPrivateMessageRefresh();

  if (emptyChat) {

    emptyChat.classList.add(
      "hidden"
    );
  }

  if (privateChat) {

    privateChat.classList.add(
      "hidden"
    );
  }

  if (groupChat) {

    groupChat.classList.remove(
      "hidden"
    );
  }

  if (groupChatName) {

    groupChatName.textContent =
      "Group Chat";
  }

  if (groupChatStatus) {

    groupChatStatus.textContent =
      "Everyone";
  }

  if (groupAvatar) {

    groupAvatar.textContent =
      "G";

    groupAvatar.style.backgroundImage =
      "";
  }

  loadGroupMessages();

  startGroupMessageRefresh();

  setTimeout(
    () => {

      groupMessageInput?.focus();

    },
    100
  );
}


/* ============================================================
   LOAD GROUP MESSAGES
============================================================ */

async function loadGroupMessages() {

  if (!currentUser) {
    return;
  }

  if (!groupMessages) {
    return;
  }

  try {

    /*
     * Group endpoint.
     *
     * worker.js မှာ
     * GET /api/group/messages
     * ထည့်ပေးရမယ်။
     */

    const data =
      await api(
        "/group/messages"
      );

    renderGroupMessages(
      data.messages || []
    );

  } catch (error) {

    groupMessages.innerHTML = `
      <div class="loading">
        ${escapeHTML(
          error.message
        )}
      </div>
    `;
  }
}


/* ============================================================
   RENDER GROUP MESSAGES
============================================================ */

function renderGroupMessages(
  messages
) {

  if (!groupMessages) {
    return;
  }

  groupMessages.innerHTML =
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

    groupMessages.appendChild(
      empty
    );

    return;
  }


  messages.forEach(
    message => {

      const sender =
        message.sender ||
        message.user ||
        {};

      const senderId =
        Number(
          message.sender_id ||
          sender.id
        );

      const senderUsername =
        message.sender_username ||
        sender.username ||
        "User";

      const senderPhoto =
        message.sender_profile_photo ||
        sender.profile_photo ||
        null;

      const mine =
        senderId ===
        Number(
          currentUser.id
        );


      /*
       * Message row
       */

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "message-row" +
        (mine
          ? " mine"
          : "");


      /*
       * User profile/avatar
       *
       * Group Chat ထဲမှာ
       * ဒီ profile ကိုနှိပ်ရင်
       * Private Chat သွားမယ်။
       */

      if (!mine) {

        const profileButton =
          document.createElement(
            "button"
          );

        profileButton.type =
          "button";

        profileButton.className =
          "avatar-button";

        profileButton.title =
          `Chat with ${senderUsername}`;


        const avatar =
          document.createElement(
            "div"
          );

        avatar.className =
          "avatar";

        setAvatarData(
          avatar,
          senderUsername,
          senderPhoto
        );

        profileButton.appendChild(
          avatar
        );


        profileButton.addEventListener(
          "click",
          () => {

            openPrivateChatFromGroup(
              senderId,
              senderUsername,
              senderPhoto
            );

          }
        );

        row.appendChild(
          profileButton
        );
      }


      /*
       * Message content
       */

      const content =
        document.createElement(
          "div"
        );

      content.className =
        "group-message-content";


      /*
       * Sender name
       */

      if (!mine) {

        const name =
          document.createElement(
            "button"
          );

        name.type =
          "button";

        name.className =
          "group-message-user";

        name.textContent =
          senderUsername;

        name.addEventListener(
          "click",
          () => {

            openPrivateChatFromGroup(
              senderId,
              senderUsername,
              senderPhoto
            );

          }
        );

        content.appendChild(
          name
        );
      }


      /*
       * Bubble
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
        message.message ||
        "";


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

      content.appendChild(
        bubble
      );

      row.appendChild(
        content
      );

      groupMessages.appendChild(
        row
      );
    }
  );


  groupMessages.scrollTop =
    groupMessages.scrollHeight;
}


/* ============================================================
   SEND GROUP MESSAGE
============================================================ */

if (groupMessageForm) {

  groupMessageForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const message =
        groupMessageInput
          .value
          .trim();

      if (!message) {
        return;
      }

      groupMessageInput.disabled =
        true;

      try {

        /*
         * POST /api/group/messages
         */

        await api(
          "/group/messages",
          {
            method: "POST",

            body:
              JSON.stringify({
                message
              })
          }
        );

        groupMessageInput.value =
          "";

        await loadGroupMessages();

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        groupMessageInput.disabled =
          false;

        groupMessageInput.focus();
      }
    }
  );
}


/* ============================================================
   GROUP MESSAGE REFRESH
============================================================ */

function startGroupMessageRefresh() {

  stopGroupMessageRefresh();

  groupMessageTimer =
    setInterval(
      async () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          if (
            groupChat &&
            !groupChat.classList.contains(
              "hidden"
            )
          ) {

            await loadGroupMessages();
          }
        }

      },
      3000
    );
}


function stopGroupMessageRefresh() {

  if (groupMessageTimer) {

    clearInterval(
      groupMessageTimer
    );

    groupMessageTimer =
      null;
  }
}


/* ============================================================
   RELOAD GROUP
============================================================ */

if (reloadGroupMessages) {

  reloadGroupMessages.addEventListener(
    "click",
    async () => {

      await loadGroupMessages();

    }
  );
}


/* ============================================================
   OPEN PRIVATE CHAT FROM GROUP PROFILE
============================================================ */

async function openPrivateChatFromGroup(
  userId,
  username,
  profilePhoto
) {

  /*
   * Don't open your own private chat.
   */

  if (
    currentUser &&
    Number(userId) ===
      Number(currentUser.id)
  ) {

    showToast(
      "This is your profile"
    );

    return;
  }


  const user = {

    id:
      Number(userId),

    username:
      username || "User",

    profile_photo:
      profilePhoto || null
  };


  selectedUser =
    user;


  /*
   * Switch UI
   */

  stopGroupMessageRefresh();

  if (groupChat) {

    groupChat.classList.add(
      "hidden"
    );
  }

  if (emptyChat) {

    emptyChat.classList.add(
      "hidden"
    );
  }

  if (privateChat) {

    privateChat.classList.remove(
      "hidden"
    );
  }


  /*
   * Header
   */

  chatUsername.textContent =
    user.username;

  setAvatar(
    chatAvatar,
    user
  );

  chatStatus.textContent =
    "Available";


  /*
   * Highlight user in sidebar
   */

  renderUsersHighlight();


  /*
   * Load private messages
   */

  await loadMessages();

  startPrivateMessageRefresh();

  messageInput?.focus();
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


/* ============================================================
   RENDER USERS
============================================================ */

function renderUsers(
  users
) {

  if (!usersList) {
    return;
  }

  usersList.innerHTML =
    "";


  const otherUsers =
    users.filter(
      user =>
        !currentUser ||
        Number(user.id) !==
          Number(currentUser.id)
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
          "button"
        );

      item.type =
        "button";

      item.className =
        "user-item";


      if (
        selectedUser &&
        Number(
          selectedUser.id
        ) ===
          Number(user.id)
      ) {

        item.classList.add(
          "active"
        );
      }


      /*
       * Avatar
       */

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


      /*
       * Info
       */

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
        user.email || "";


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


      /*
       * Clicking sidebar user
       * also opens private chat.
       */

      item.addEventListener(
        "click",
        () => {

          openPrivateChatFromGroup(
            user.id,
            user.username,
            user.profile_photo
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
   USER HIGHLIGHT
============================================================ */

function renderUsersHighlight() {

  if (!currentUser) {
    return;
  }

  loadUsers();
}


/* ============================================================
   PRIVATE CHAT
============================================================ */

async function loadMessages() {

  if (!selectedUser) {
    return;
  }

  if (!messagesBox) {
    return;
  }

  try {

    const data =
      await api(
        `/messages?user_id=${encodeURIComponent(
          selectedUser.id
        )}`
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
   RENDER PRIVATE MESSAGES
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


      const row =
        document.createElement(
          "div"
        );

      row.className =
        "message-row" +
        (mine
          ? " mine"
          : "");


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
   SEND PRIVATE MESSAGE
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
        messageInput
          .value
          .trim();

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
   PRIVATE MESSAGE REFRESH
============================================================ */

function startPrivateMessageRefresh() {

  stopPrivateMessageRefresh();

  privateMessageTimer =
    setInterval(
      async () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          if (
            selectedUser &&
            privateChat &&
            !privateChat.classList.contains(
              "hidden"
            )
          ) {

            await loadMessages();
          }
        }

      },
      3000
    );
}


function stopPrivateMessageRefresh() {

  if (privateMessageTimer) {

    clearInterval(
      privateMessageTimer
    );

    privateMessageTimer =
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

    }
  );
}


/* ============================================================
   REFRESH PRIVATE MESSAGES
============================================================ */

if (reloadMessages) {

  reloadMessages.addEventListener(
    "click",
    async () => {

      await loadMessages();

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


      stopGroupMessageRefresh();
      stopPrivateMessageRefresh();

      removeToken();

      currentUser =
        null;

      selectedUser =
        null;

      closeProfile();

      showAuth();

      showToast(
        "Logged out"
      );
    }
  );
}


/* ============================================================
   MOBILE BACK / RETURN TO GROUP
============================================================ */

const chatArea =
  document.querySelector(
    ".chat-area"
  );


function returnToGroupChat() {

  selectedUser =
    null;

  stopPrivateMessageRefresh();

  if (privateChat) {

    privateChat.classList.add(
      "hidden"
    );
  }

  if (groupChat) {

    groupChat.classList.remove(
      "hidden"
    );
  }

  loadGroupMessages();

  startGroupMessageRefresh();
}


if (chatScreen) {

  chatScreen.addEventListener(
    "click",
    event => {

      if (
        window.innerWidth <= 700
      ) {

        const clickedHeader =
          event.target.closest(
            ".chat-header"
          );

        if (
          clickedHeader &&
          privateChat &&
          !privateChat.classList.contains(
            "hidden"
          )
        ) {

          returnToGroupChat();

        }
      }
    }
  );
}


/* ============================================================
   PROFILE PANEL
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

  profilePanel.classList.remove(
    "hidden"
  );
}


function closeProfile() {

  if (!profilePanel) {
    return;
  }

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
        profilePhotoInput
          .files?.[0];

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
   START APPLICATION
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      startApp();

    }
  );

} else {

  startApp();

}
