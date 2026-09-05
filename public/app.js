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
  document.getElementById("messagesBox");

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

const profilePhotoInput =
  document.getElementById(
    "profilePhotoInput"
  );

const removeProfilePhoto =
  document.getElementById(
    "removeProfilePhoto"
  );

const profileUsername =
  document.getElementById(
    "profileUsername"
  );

const profileAvatar =
  document.getElementById(
    "profileAvatar"
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

  if (!token) {
    return;
  }

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

  } catch {

    data = {};
  }


  if (!response.ok) {

    throw new Error(
      data.error ||
      data.message ||
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


  toast.classList.remove(
    "hidden"
  );


  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

        toast.classList.add(
          "hidden"
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
    String(
      value ?? ""
    );


  return div.innerHTML;
}


/* ============================================================
   TIME FORMAT
============================================================ */

function formatTime(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "";
  }


  let date;


  if (
    typeof value === "number" ||
    /^\d+$/.test(
      String(value)
    )
  ) {

    let number =
      Number(value);


    if (
      number > 0 &&
      number < 100000000000
    ) {

      number *= 1000;
    }


    date =
      new Date(number);

  } else {

    let text =
      String(value);


    if (
      !text.endsWith("Z") &&
      !text.includes("+") &&
      /^\d{4}-\d{2}-\d{2} /.test(text)
    ) {

      text =
        text.replace(
          " ",
          "T"
        ) + "Z";
    }


    date =
      new Date(text);
  }


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


/* ============================================================
   AVATAR
============================================================ */

function setAvatar(
  element,
  user
) {

  if (!element) {
    return;
  }


  element.innerHTML =
    "";


  element.style.backgroundImage =
    "";


  element.style.backgroundSize =
    "";


  element.style.backgroundPosition =
    "";


  element.style.backgroundRepeat =
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


  element.innerHTML =
    "";


  element.style.backgroundImage =
    "";


  element.style.backgroundSize =
    "";


  element.style.backgroundPosition =
    "";


  element.style.backgroundRepeat =
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
   VIEW CONTROL
============================================================ */

function showGroupView() {

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


    groupChat.style.display =
      "flex";

    groupChat.style.flexDirection =
      "column";

    groupChat.style.minHeight =
      "0";
  }
}


function showPrivateView() {

  if (emptyChat) {

    emptyChat.classList.add(
      "hidden"
    );
  }


  if (groupChat) {

    groupChat.classList.add(
      "hidden"
    );
  }


  if (privateChat) {

    privateChat.classList.remove(
      "hidden"
    );


    privateChat.style.display =
      "flex";

    privateChat.style.flexDirection =
      "column";

    privateChat.style.minHeight =
      "0";
  }
}


/* ============================================================
   GROUP COMPOSER
============================================================ */

function ensureGroupComposer() {

  if (!groupMessageForm) {
    return;
  }


  groupMessageForm.classList.remove(
    "hidden"
  );


  groupMessageForm.style.display =
    "flex";

  groupMessageForm.style.visibility =
    "visible";

  groupMessageForm.style.opacity =
    "1";

  groupMessageForm.style.pointerEvents =
    "auto";

  groupMessageForm.style.flexShrink =
    "0";


  if (groupMessageInput) {

    groupMessageInput.disabled =
      false;

    groupMessageInput.style.display =
      "";

    groupMessageInput.style.visibility =
      "visible";

    groupMessageInput.style.opacity =
      "1";
  }
}


/* ============================================================
   AUTH SWITCH
============================================================ */

if (showRegister) {

  showRegister.addEventListener(
    "click",
    () => {

      loginForm?.classList.add(
        "hidden"
      );

      registerForm?.classList.remove(
        "hidden"
      );


      if (loginError) {

        loginError.textContent =
          "";

        loginError.classList.add(
          "hidden"
        );
      }


      if (registerError) {

        registerError.textContent =
          "";

        registerError.classList.add(
          "hidden"
        );
      }
    }
  );
}


if (showLogin) {

  showLogin.addEventListener(
    "click",
    () => {

      registerForm?.classList.add(
        "hidden"
      );

      loginForm?.classList.remove(
        "hidden"
      );


      if (loginError) {

        loginError.textContent =
          "";

        loginError.classList.add(
          "hidden"
        );
      }


      if (registerError) {

        registerError.textContent =
          "";

        registerError.classList.add(
          "hidden"
        );
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


      const usernameInput =
        document.getElementById(
          "registerUsername"
        );

      const passwordInput =
        document.getElementById(
          "registerPassword"
        );

      const confirmInput =
        document.getElementById(
          "registerPasswordConfirm"
        );


      const username =
        usernameInput?.value.trim() ||
        "";

      const password =
        passwordInput?.value ||
        "";

      const confirmPassword =
        confirmInput?.value ||
        "";


      if (registerError) {

        registerError.textContent =
          "";

        registerError.classList.add(
          "hidden"
        );
      }


      if (!username) {

        showRegisterError(
          "Please enter a username"
        );

        return;
      }


      if (!password) {

        showRegisterError(
          "Please enter a password"
        );

        return;
      }


      if (
        password !==
        confirmPassword
      ) {

        showRegisterError(
          "Passwords do not match"
        );

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


        loginForm?.classList.remove(
          "hidden"
        );


        const loginUsername =
          document.getElementById(
            "loginUsername"
          );


        if (loginUsername) {

          loginUsername.value =
            username;
        }


      } catch (error) {

        showRegisterError(
          error.message
        );
      }
    }
  );
}


/* ============================================================
   REGISTER ERROR
============================================================ */

function showRegisterError(
  message
) {

  if (!registerError) {
    return;
  }


  registerError.textContent =
    message;


  registerError.classList.remove(
    "hidden"
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


      const usernameInput =
        document.getElementById(
          "loginUsername"
        );

      const passwordInput =
        document.getElementById(
          "loginPassword"
        );


      const username =
        usernameInput?.value.trim() ||
        "";

      const password =
        passwordInput?.value ||
        "";


      if (loginError) {

        loginError.textContent =
          "";

        loginError.classList.add(
          "hidden"
        );
      }


      if (!username) {

        showLoginError(
          "Please enter your username"
        );

        return;
      }


      if (!password) {

        showLoginError(
          "Please enter your password"
        );

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
                  username,
                  password
                })
            }
          );


        if (!data.token) {

          throw new Error(
            "Login token missing"
          );
        }


        setToken(
          data.token
        );


        currentUser =
          data.user ||
          null;


        loginForm.reset();


        await openChatApp();


      } catch (error) {

        showLoginError(
          error.message
        );
      }
    }
  );
}


/* ============================================================
   LOGIN ERROR
============================================================ */

function showLoginError(
  message
) {

  if (!loginError) {
    return;
  }


  loginError.textContent =
    message;


  loginError.classList.remove(
    "hidden"
  );
}


/* ============================================================
   START APP
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
      data.user ||
      null;


    if (!currentUser) {

      throw new Error(
        "User not found"
      );
    }


    await openChatApp();


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


  selectedUser =
    null;


  if (authScreen) {

    authScreen.classList.remove(
      "hidden"
    );
  }


  if (chatScreen) {

    chatScreen.classList.add(
      "hidden"
    );
  }
}


/* ============================================================
   OPEN CHAT APP
============================================================ */

async function openChatApp() {

  if (!currentUser) {

    showAuth();

    return;
  }


  if (authScreen) {

    authScreen.classList.add(
      "hidden"
    );
  }


  if (chatScreen) {

    chatScreen.classList.remove(
      "hidden"
    );
  }


  /*
   * MY PROFILE
   */

  if (myUsername) {

    myUsername.textContent =
      currentUser.username ||
      "User";
  }


  setAvatar(
    myAvatar,
    currentUser
  );


  updateProfilePanel();


  /*
   * Login ဝင်တာနဲ့
   * Public Group Chat ကို တန်းဖွင့်မယ်။
   */

  await openGroupChat();
}


/* ============================================================
   OPEN GROUP CHAT
============================================================ */

async function openGroupChat() {

  selectedUser =
    null;


  stopPrivateMessageRefresh();


  showGroupView();


  if (groupChatName) {

    groupChatName.textContent =
      "Public Group Chat";
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

    groupAvatar.style.backgroundSize =
      "";

    groupAvatar.style.backgroundPosition =
      "";

    groupAvatar.style.backgroundRepeat =
      "";
  }


  ensureGroupComposer();


  await loadGroupMessages();


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

    const data =
      await api(
        "/group/messages"
      );


    const messages =
      Array.isArray(
        data.messages
      )
        ? data.messages
        : Array.isArray(data)
          ? data
          : [];


    renderGroupMessages(
      messages
    );


  } catch (error) {

    groupMessages.innerHTML = "";


    const errorBox =
      document.createElement(
        "div"
      );


    errorBox.className =
      "loading";


    errorBox.textContent =
      error.message;


    groupMessages.appendChild(
      errorBox
    );


    ensureGroupComposer();
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


  if (!Array.isArray(messages)) {

    messages = [];
  }


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


    ensureGroupComposer();

    return;
  }


  messages.forEach(
    message => {

      /*
       * Backend က ဒီ format တစ်ခုခုကို
       * return လုပ်နိုင်တယ်။
       *
       * sender_id
       * sender_username
       * sender_profile_photo
       *
       * OR
       *
       * sender: {
       *   id,
       *   username,
       *   profile_photo
       * }
       */

      const sender =
        message.sender ||
        message.user ||
        {};


      const rawSenderId =
        message.sender_id ??
        sender.id ??
        message.user_id ??
        null;


      const senderId =
        Number(
          rawSenderId
        );


      const senderUsername =
        message.sender_username ??
        sender.username ??
        message.username ??
        "User";


      const senderPhoto =
        message.sender_profile_photo ??
        sender.profile_photo ??
        message.profile_photo ??
        null;


      const mine =
        Number.isFinite(
          senderId
        ) &&
        currentUser &&
        senderId ===
          Number(
            currentUser.id
          );


      /*
       * ROW
       */

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "group-message" +
        (
          mine
            ? " mine"
            : ""
        );


      /*
       * OTHER USER AVATAR
       */

      if (!mine) {

        const senderBox =
          document.createElement(
            "div"
          );


        senderBox.className =
          "message-sender";


        const avatarButton =
          document.createElement(
            "button"
          );


        avatarButton.type =
          "button";


        avatarButton.style.cssText = `
          border:0;
          padding:0;
          margin:0;
          background:transparent;
          cursor:pointer;
        `;


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


        avatarButton.appendChild(
          avatar
        );


        avatarButton.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();


            openPrivateChatFromGroup(
              senderId,
              senderUsername,
              senderPhoto
            );
          }
        );


        /*
         * USERNAME
         */

        const nameButton =
          document.createElement(
            "button"
          );


        nameButton.type =
          "button";


        nameButton.className =
          "message-sender-name";


        nameButton.style.cssText = `
          border:0;
          padding:0;
          margin:0;
          background:transparent;
          color:#8793a2;
          cursor:pointer;
          font:inherit;
        `;


        nameButton.textContent =
          senderUsername;


        nameButton.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();


            openPrivateChatFromGroup(
              senderId,
              senderUsername,
              senderPhoto
            );
          }
        );


        senderBox.appendChild(
          avatarButton
        );


        senderBox.appendChild(
          nameButton
        );


        row.appendChild(
          senderBox
        );
      }


      /*
       * MESSAGE CONTENT
       */

      const content =
        document.createElement(
          "div"
        );


      content.className =
        "message-content";


      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        "message-bubble";


      bubble.textContent =
        message.message ||
        "";


      const time =
        document.createElement(
          "div"
        );


      time.className =
        "message-time";


      time.textContent =
        formatTime(
          message.created_at
        );


      content.appendChild(
        bubble
      );


      if (
        time.textContent
      ) {

        content.appendChild(
          time
        );
      }


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


  ensureGroupComposer();
}


/* ============================================================
   SEND GROUP MESSAGE
============================================================ */

if (groupMessageForm) {

  groupMessageForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!currentUser) {

        showToast(
          "Please login first"
        );

        return;
      }


      if (!groupMessageInput) {
        return;
      }


      const message =
        groupMessageInput.value.trim();


      if (!message) {
        return;
      }


      groupMessageInput.disabled =
        true;


      try {

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


        ensureGroupComposer();
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
          document.visibilityState !==
          "visible"
        ) {

          return;
        }


        if (
          !groupChat ||
          groupChat.classList.contains(
            "hidden"
          )
        ) {

          return;
        }


        await loadGroupMessages();

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
    async event => {

      event.preventDefault();


      await loadGroupMessages();
    }
  );
}


/* ============================================================
   OPEN PRIVATE CHAT FROM GROUP
============================================================ */

async function openPrivateChatFromGroup(
  userId,
  username,
  profilePhoto
) {

  const id =
    Number(
      userId
    );


  if (
    !Number.isFinite(id) ||
    id <= 0
  ) {

    showToast(
      "Unable to open private chat"
    );

    return;
  }


  /*
   * ကိုယ့် Profile ကို
   * Private Chat မဖွင့်။
   */

  if (
    currentUser &&
    id ===
      Number(
        currentUser.id
      )
  ) {

    showToast(
      "This is your profile"
    );

    return;
  }


  selectedUser = {

    id,

    username:
      username ||
      "User",

    profile_photo:
      profilePhoto ||
      null
  };


  /*
   * Group refresh ပိတ်
   */

  stopGroupMessageRefresh();


  /*
   * Private Chat ပြ
   */

  showPrivateView();


  /*
   * Header
   */

  if (chatUsername) {

    chatUsername.textContent =
      selectedUser.username;
  }


  setAvatar(
    chatAvatar,
    selectedUser
  );


  if (chatStatus) {

    chatStatus.textContent =
      "Private Chat";
  }


  /*
   * Messages
   */

  await loadMessages();


  startPrivateMessageRefresh();


  setTimeout(
    () => {

      messageInput?.focus();

    },
    100
  );
}


/* ============================================================
   LOAD PRIVATE MESSAGES
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


    const messages =
      Array.isArray(
        data.messages
      )
        ? data.messages
        : Array.isArray(data)
          ? data
          : [];


    renderMessages(
      messages
    );


  } catch (error) {

    messagesBox.innerHTML =
      "";


    const errorBox =
      document.createElement(
        "div"
      );


    errorBox.className =
      "loading";


    errorBox.textContent =
      error.message;


    messagesBox.appendChild(
      errorBox
    );
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


  if (!Array.isArray(messages)) {

    messages = [];
  }


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

      const senderId =
        Number(
          message.sender_id
        );


      const mine =
        currentUser &&
        senderId ===
          Number(
            currentUser.id
          );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "private-message" +
        (
          mine
            ? " mine"
            : ""
        );


      const content =
        document.createElement(
          "div"
        );


      content.className =
        "message-content";


      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        "message-bubble";


      bubble.textContent =
        message.message ||
        "";


      const time =
        document.createElement(
          "div"
        );


      time.className =
        "message-time";


      time.textContent =
        formatTime(
          message.created_at
        );


      content.appendChild(
        bubble
      );


      if (
        time.textContent
      ) {

        content.appendChild(
          time
        );
      }


      row.appendChild(
        content
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

        showToast(
          "Open a user from Public Group Chat"
        );

        return;
      }


      if (!messageInput) {
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
   PRIVATE MESSAGE REFRESH
============================================================ */

function startPrivateMessageRefresh() {

  stopPrivateMessageRefresh();


  privateMessageTimer =
    setInterval(
      async () => {

        if (
          document.visibilityState !==
          "visible"
        ) {

          return;
        }


        if (
          !selectedUser ||
          !privateChat ||
          privateChat.classList.contains(
            "hidden"
          )
        ) {

          return;
        }


        await loadMessages();

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
   RELOAD PRIVATE CHAT
============================================================ */

if (reloadMessages) {

  reloadMessages.addEventListener(
    "click",
    async event => {

      event.preventDefault();


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
    async event => {

      event.preventDefault();


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
    }
  );
}


/* ============================================================
   RETURN TO GROUP CHAT
============================================================ */

function returnToGroupChat() {

  selectedUser =
    null;


  stopPrivateMessageRefresh();


  showGroupView();


  ensureGroupComposer();


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
   MOBILE PRIVATE HEADER → GROUP
============================================================ */

if (chatScreen) {

  chatScreen.addEventListener(
    "click",
    event => {

      if (
        window.innerWidth > 700
      ) {

        return;
      }


      const clickedHeader =
        event.target.closest(
          "#privateChat .chat-header"
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
  );
}


/* ============================================================
   PROFILE PANEL
============================================================ */

function updateProfilePanel() {

  if (!currentUser) {
    return;
  }


  if (myUsername) {

    myUsername.textContent =
      currentUser.username ||
      "User";
  }


  if (profileUsername) {

    profileUsername.textContent =
      currentUser.username ||
      "User";
  }


  setAvatar(
    myAvatar,
    currentUser
  );


  setAvatar(
    profileAvatar,
    currentUser
  );
}


function openProfile() {

  updateProfilePanel();


  if (profilePanel) {

    profilePanel.classList.remove(
      "hidden"
    );
  }
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
    event => {

      event.preventDefault();

      event.stopPropagation();


      openProfile();
    }
  );
}


/* ============================================================
   CLOSE PROFILE WHEN CLICK OUTSIDE
============================================================ */

document.addEventListener(
  "click",
  event => {

    if (
      !profilePanel ||
      profilePanel.classList.contains(
        "hidden"
      )
    ) {

      return;
    }


    const insidePanel =
      event.target.closest(
        "#profilePanel"
      );


    const avatarButton =
      event.target.closest(
        "#myAvatarBtn"
      );


    if (
      !insidePanel &&
      !avatarButton
    ) {

      closeProfile();
    }
  }
);


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


        if (
          data &&
          data.user
        ) {

          currentUser =
            data.user;

        } else {

          currentUser = {

            ...currentUser,

            profile_photo:
              imageData
          };
        }


        updateProfilePanel();


        await loadGroupMessages();


        showToast(
          "Profile photo updated"
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
    async event => {

      event.preventDefault();


      try {

        await api(
          "/profile/photo",
          {
            method: "DELETE"
          }
        );


        currentUser = {

          ...currentUser,

          profile_photo:
            null
        };


        updateProfilePanel();


        await loadGroupMessages();


        showToast(
          "Profile photo removed"
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
   IMAGE TO DATA URL
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


              if (!ctx) {

                reject(
                  new Error(
                    "Could not process image"
                  )
                );

                return;
              }


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

function bootApplication() {

  startApp();
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    bootApplication
  );

} else {

  bootApplication();
}
