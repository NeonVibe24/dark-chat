const API = "/api";

let currentUser = null;
let selectedUser = null;

let groupMessageTimer = null;
let privateMessageTimer = null;

/* ============================================================
   NOTIFICATION / PRIVATE INBOX STATE
============================================================ */

let privateInboxTimer = null;
let privateInboxLoading = false;

let privateInboxUsers = [];

const PRIVATE_INBOX_REFRESH_TIME = 3000;


/* ============================================================
   ELEMENTS
============================================================ */

const authScreen =
  document.getElementById("authScreen");

const chatScreen =
  document.getElementById("chatScreen");

const loginBox =
  document.getElementById("loginBox");

const registerBox =
  document.getElementById("registerBox");

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
   PROFILE NOTIFICATION ELEMENTS
   These are created automatically for now.
============================================================ */

let profileUnreadBadge = null;
let privateInboxContainer = null;


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
    "Content-Type": "application/json"
  };

  if (token) {

    result.Authorization =
      `Bearer ${token}`;
  }

  return result;
}


/* ============================================================
   API
============================================================ */

async function api(
  path,
  options = {}
) {

  let response;

  try {

    response =
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

  } catch (error) {

    throw new Error(
      "Network error. Please check your connection."
    );
  }


  const text =
    await response.text();

  let data = {};

  if (text) {

    try {

      data =
        JSON.parse(text);

    } catch {

      data = {
        raw: text
      };
    }
  }


  if (!response.ok) {

    throw new Error(
      data.error ||
      data.message ||
      data.detail ||
      (
        data.raw
          ? data.raw.slice(0, 200)
          : `Request failed (${response.status})`
      )
    );
  }


  return data;
}


/* ============================================================
   AVATAR LETTER
============================================================ */

function avatarLetter(name) {

  return String(
    name || "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();
}


/* ============================================================
   TOAST
============================================================ */

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


/* ============================================================
   HTML ESCAPE
============================================================ */

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
   AVATAR RENDER
============================================================ */

function setAvatar(
  element,
  user
) {

  if (!element) {
    return;
  }


  const username =
    user?.username ||
    "User";

  const photo =
    user?.profile_photo ||
    null;


  if (
    element.tagName ===
    "IMG"
  ) {

    if (photo) {

      element.src =
        photo;

      element.classList.remove(
        "hidden"
      );

      element.style.display =
        "";

    } else {

      element.removeAttribute(
        "src"
      );

      element.classList.add(
        "hidden"
      );

      element.style.display =
        "none";
    }

    return;
  }


  const image =
    element.querySelector(
      "img"
    );

  const fallback =
    element.querySelector(
      "[data-avatar-fallback], .avatar-fallback"
    );


  if (image) {

    if (photo) {

      image.src =
        photo;

      image.classList.remove(
        "hidden"
      );

      image.style.display =
        "";

    } else {

      image.removeAttribute(
        "src"
      );

      image.classList.add(
        "hidden"
      );

      image.style.display =
        "none";
    }
  }


  if (fallback) {

    fallback.textContent =
      avatarLetter(username);

    if (photo) {

      fallback.classList.add(
        "hidden"
      );

      fallback.style.display =
        "none";

    } else {

      fallback.classList.remove(
        "hidden"
      );

      fallback.style.display =
        "";
    }

  } else if (!image) {

    element.textContent =
      avatarLetter(username);

    element.style.backgroundImage =
      "";

  } else {

    element.style.backgroundImage =
      "";
  }
}


function setAvatarData(
  element,
  username,
  photo
) {

  if (!element) {
    return;
  }


  const image =
    element.querySelector(
      "img"
    );

  const fallback =
    element.querySelector(
      "[data-avatar-fallback], .avatar-fallback"
    );


  if (image) {

    if (photo) {

      image.src =
        photo;

      image.classList.remove(
        "hidden"
      );

      image.style.display =
        "";

    } else {

      image.removeAttribute(
        "src"
      );

      image.classList.add(
        "hidden"
      );

      image.style.display =
        "none";
    }
  }


  if (fallback) {

    fallback.textContent =
      avatarLetter(username);

    if (photo) {

      fallback.classList.add(
        "hidden"
      );

      fallback.style.display =
        "none";

    } else {

      fallback.classList.remove(
        "hidden"
      );

      fallback.style.display =
        "";
    }

  } else if (!image) {

    element.textContent =
      avatarLetter(username);
  }


  if (
    !image &&
    !fallback
  ) {

    if (photo) {

      element.textContent =
        "";

      element.style.backgroundImage =
        `url("${photo}")`;

      element.style.backgroundSize =
        "cover";

      element.style.backgroundPosition =
        "center";

      element.style.backgroundRepeat =
        "no-repeat";

    } else {

      element.style.backgroundImage =
        "";

      element.style.backgroundSize =
        "";

      element.style.backgroundPosition =
        "";

      element.style.backgroundRepeat =
        "";

      element.textContent =
        avatarLetter(username);
    }
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

function openRegisterForm(event) {

  if (event) {

    event.preventDefault();
    event.stopPropagation();
  }


  if (loginBox) {

    loginBox.classList.add(
      "hidden"
    );

    loginBox.style.display =
      "none";
  }


  if (registerBox) {

    registerBox.classList.remove(
      "hidden"
    );

    registerBox.style.display =
      "block";
  }


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


  const username =
    document.getElementById(
      "registerUsername"
    );


  setTimeout(
    () => {

      username?.focus();

    },
    50
  );
}


function openLoginForm(event) {

  if (event) {

    event.preventDefault();
    event.stopPropagation();
  }


  if (registerBox) {

    registerBox.classList.add(
      "hidden"
    );

    registerBox.style.display =
      "none";
  }


  if (loginBox) {

    loginBox.classList.remove(
      "hidden"
    );

    loginBox.style.display =
      "block";
  }


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


  const username =
    document.getElementById(
      "loginUsername"
    );


  setTimeout(
    () => {

      username?.focus();

    },
    50
  );
}


/* ============================================================
   AUTH SWITCH BUTTONS
============================================================ */

if (showRegister) {

  showRegister.type =
    "button";

  showRegister.addEventListener(
    "click",
    openRegisterForm
  );
}


if (showLogin) {

  showLogin.type =
    "button";

  showLogin.addEventListener(
    "click",
    openLoginForm
  );
}


document.addEventListener(
  "click",
  event => {

    const registerButton =
      event.target.closest(
        "#showRegister"
      );

    if (registerButton) {

      openRegisterForm(
        event
      );

      return;
    }


    const loginButton =
      event.target.closest(
        "#showLogin"
      );

    if (loginButton) {

      openLoginForm(
        event
      );

      return;
    }
  },
  true
);


/* ============================================================
   REGISTER
============================================================ */

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();
      event.stopPropagation();


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


      if (username.length < 3) {

        showRegisterError(
          "Username must be at least 3 characters"
        );

        return;
      }


      if (!password) {

        showRegisterError(
          "Please enter a password"
        );

        return;
      }


      if (password.length < 4) {

        showRegisterError(
          "Password must be at least 4 characters"
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


      const submitButton =
        registerForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled =
          true;
      }


      try {

        const data =
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
          data.message ||
          "Account created"
        );


        registerForm.reset();

        openLoginForm();


        const loginUsername =
          document.getElementById(
            "loginUsername"
          );


        if (loginUsername) {

          loginUsername.value =
            username;

          loginUsername.focus();
        }


      } catch (error) {

        showRegisterError(
          error.message
        );

      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;
        }
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

    showToast(
      message
    );

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
      event.stopPropagation();


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


      const submitButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled =
          true;
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


        if (!currentUser) {

          throw new Error(
            "User information missing"
          );
        }


        loginForm.reset();

        await openChatApp();


      } catch (error) {

        removeToken();

        currentUser =
          null;

        showLoginError(
          error.message
        );

      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;
        }
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

    showToast(
      message
    );

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

  stopPrivateInboxRefresh();


  selectedUser =
    null;

  privateInboxUsers =
    [];


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


  if (registerBox) {

    registerBox.classList.add(
      "hidden"
    );

    registerBox.style.display =
      "none";
  }


  if (loginBox) {

    loginBox.classList.remove(
      "hidden"
    );

    loginBox.style.display =
      "block";
  }


  updateProfileUnreadBadge(0);
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
   * Private inbox notification
   * background refresh starts here.
   */

  ensurePrivateInboxUI();

  await loadPrivateInbox();

  startPrivateInboxRefresh();


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

    groupMessages.innerHTML =
      "";


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


        const openPrivate =
          event => {

            event.preventDefault();
            event.stopPropagation();


            openPrivateChatFromGroup(
              senderId,
              senderUsername,
              senderPhoto
            );
          };


        avatarButton.addEventListener(
          "click",
          openPrivate
        );


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
          openPrivate
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


      if (time.textContent) {

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
   GROUP REFRESH
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
   OPEN PRIVATE CHAT
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
   * Opening this chat means the user is
   * viewing the messages.
   */

  await markPrivateMessagesRead(
    id
  );


  updatePrivateInboxItem(
    id,
    0
  );


  stopGroupMessageRefresh();


  showPrivateView();


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


  await loadMessages();


  /*
   * Refresh inbox after opening chat.
   */

  loadPrivateInbox();


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


      if (time.textContent) {

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


        /*
         * Refresh inbox after sending.
         */

        await loadPrivateInbox();


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
   PRIVATE REFRESH
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

        /*
         * Keep notification list updated
         * while private chat is open.
         */

        await loadPrivateInbox();

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
   RELOAD PRIVATE
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
   PRIVATE INBOX UI
============================================================ */

function ensurePrivateInboxUI() {

  if (!profilePanel) {
    return;
  }


  /*
   * Find an existing container first.
   * Later HTML/CSS can provide its own container.
   */

  privateInboxContainer =
    profilePanel.querySelector(
      "#privateInbox"
    );


  /*
   * If HTML does not have it yet,
   * create it automatically.
   */

  if (!privateInboxContainer) {

    privateInboxContainer =
      document.createElement(
        "div"
      );

    privateInboxContainer.id =
      "privateInbox";

    privateInboxContainer.className =
      "private-inbox";


    const title =
      document.createElement(
        "div"
      );

    title.className =
      "private-inbox-title";

    title.textContent =
      "Private Messages";


    privateInboxContainer.appendChild(
      title
    );


    /*
     * Edit Profile controls should stay above
     * this inbox. We append the inbox after
     * the current profile content.
     */

    profilePanel.appendChild(
      privateInboxContainer
    );
  }


  /*
   * Profile unread badge
   */

  profileUnreadBadge =
    document.getElementById(
      "profileUnreadBadge"
    );


  if (
    !profileUnreadBadge &&
    myAvatarBtn
  ) {

    profileUnreadBadge =
      document.createElement(
        "span"
      );

    profileUnreadBadge.id =
      "profileUnreadBadge";

    profileUnreadBadge.className =
      "profile-unread-badge hidden";

    myAvatarBtn.appendChild(
      profileUnreadBadge
    );
  }


  if (
    !profileUnreadBadge &&
    profileUsername
  ) {

    profileUnreadBadge =
      document.createElement(
        "span"
      );

    profileUnreadBadge.id =
      "profileUnreadBadge";

    profileUnreadBadge.className =
      "profile-unread-badge hidden";

    profileUsername.appendChild(
      profileUnreadBadge
    );
  }
}


/* ============================================================
   PRIVATE INBOX DATA
============================================================ */

/*
 * Worker.js နောက်တစ်ဆင့်မှာ ဒီ endpoint ကို
 * ထည့်ပေးမယ်။
 *
 * Expected response:
 *
 * {
 *   "users": [
 *     {
 *       "id": 2,
 *       "username": "MgMg",
 *       "profile_photo": "...",
 *       "last_message": "Hello",
 *       "last_message_at": "...",
 *       "unread_count": 3
 *     }
 *   ],
 *   "total_unread": 3
 * }
 */

async function loadPrivateInbox() {

  if (!currentUser) {
    return;
  }


  if (privateInboxLoading) {
    return;
  }


  privateInboxLoading =
    true;


  try {

    const data =
      await api(
        "/messages/inbox"
      );


    const users =
      Array.isArray(
        data.users
      )
        ? data.users
        : Array.isArray(
            data.conversations
          )
          ? data.conversations
          : Array.isArray(data)
            ? data
            : [];


    privateInboxUsers =
      users;


    let totalUnread =
      Number(
        data.total_unread ??
        data.unread_count ??
        0
      );


    /*
     * If worker doesn't send total_unread,
     * calculate it from user list.
     */

    if (
      !Number.isFinite(
        totalUnread
      ) ||
      totalUnread < 0
    ) {

      totalUnread =
        0;
    }


    if (
      totalUnread === 0 &&
      users.length
    ) {

      totalUnread =
        users.reduce(
          (
            total,
            user
          ) => {

            const count =
              Number(
                user.unread_count ??
                user.unread ??
                0
              );

            return (
              total +
              (
                Number.isFinite(count) &&
                count > 0
                  ? count
                  : 0
              )
            );
          },
          0
        );
    }


    renderPrivateInbox(
      users
    );


    updateProfileUnreadBadge(
      totalUnread
    );


  } catch (error) {

    /*
     * Before worker.js is updated,
     * this endpoint may not exist.
     *
     * Do not show an error toast because
     * it would appear every 3 seconds.
     */

    privateInboxUsers =
      [];


    updateProfileUnreadBadge(
      0
    );

  } finally {

    privateInboxLoading =
      false;
  }
}


/* ============================================================
   RENDER PRIVATE INBOX
============================================================ */

function renderPrivateInbox(
  users
) {

  ensurePrivateInboxUI();


  if (!privateInboxContainer) {
    return;
  }


  /*
   * Keep title.
   */

  privateInboxContainer.innerHTML =
    "";


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "private-inbox-title";


  title.textContent =
    "Private Messages";


  privateInboxContainer.appendChild(
    title
  );


  if (
    !Array.isArray(users) ||
    !users.length
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "private-inbox-empty";


    empty.textContent =
      "No private messages yet";


    privateInboxContainer.appendChild(
      empty
    );


    return;
  }


  users.forEach(
    user => {

      const id =
        Number(
          user.id ??
          user.user_id ??
          user.sender_id
        );


      if (
        !Number.isFinite(id) ||
        id <= 0
      ) {

        return;
      }


      if (
        currentUser &&
        id ===
          Number(
            currentUser.id
          )
      ) {

        return;
      }


      const username =
        user.username ??
        user.sender_username ??
        user.name ??
        "User";


      const photo =
        user.profile_photo ??
        user.sender_profile_photo ??
        null;


      const lastMessage =
        user.last_message ??
        user.message ??
        user.preview ??
        "";


      const unreadCount =
        Number(
          user.unread_count ??
          user.unread ??
          0
        );


      const item =
        document.createElement(
          "button"
        );


      item.type =
        "button";


      item.className =
        "private-inbox-item";


      item.dataset.userId =
        String(id);


      /*
       * Avatar
       */

      const avatar =
        document.createElement(
          "div"
        );


      avatar.className =
        "private-inbox-avatar";


      setAvatarData(
        avatar,
        username,
        photo
      );


      /*
       * Middle area
       */

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
        username;


      const preview =
        document.createElement(
          "div"
        );


      preview.className =
        "private-inbox-preview";


      preview.textContent =
        lastMessage ||
        "Private message";


      info.appendChild(
        name
      );


      info.appendChild(
        preview
      );


      /*
       * Right side
       */

      const right =
        document.createElement(
          "div"
        );


      right.className =
        "private-inbox-right";


      if (
        Number.isFinite(
          unreadCount
        ) &&
        unreadCount > 0
      ) {

        const badge =
          document.createElement(
            "span"
          );


        badge.className =
          "private-inbox-badge";


        badge.textContent =
          String(
            unreadCount
          );


        right.appendChild(
          badge
        );
      }


      /*
       * Last message time
       */

      const lastTime =
        user.last_message_at ??
        user.created_at ??
        null;


      if (lastTime) {

        const time =
          document.createElement(
            "span"
          );


        time.className =
          "private-inbox-time";


        time.textContent =
          formatTime(
            lastTime
          );


        right.appendChild(
          time
        );
      }


      item.appendChild(
        avatar
      );


      item.appendChild(
        info
      );


      item.appendChild(
        right
      );


      item.addEventListener(
        "click",
        async event => {

          event.preventDefault();
          event.stopPropagation();


          await openPrivateChatFromInbox(
            {
              id,
              username,
              profile_photo:
                photo
            }
          );
        }
      );


      privateInboxContainer.appendChild(
        item
      );
    }
  );
}


/* ============================================================
   OPEN PRIVATE CHAT FROM INBOX
============================================================ */

async function openPrivateChatFromInbox(
  user
) {

  if (!user) {
    return;
  }


  const id =
    Number(
      user.id
    );


  if (
    !Number.isFinite(id) ||
    id <= 0
  ) {

    return;
  }


  await openPrivateChatFromGroup(
    id,
    user.username ||
      "User",
    user.profile_photo ||
      null
  );


  /*
   * Close profile after selecting a chat.
   */

  closeProfile();
}


/* ============================================================
   MARK PRIVATE MESSAGE READ
============================================================ */

/*
 * worker.js မှာ ဒီ endpoint ကို ထည့်မယ်။
 *
 * POST /messages/read
 * {
 *   user_id: 123
 * }
 */

async function markPrivateMessagesRead(
  userId
) {

  const id =
    Number(
      userId
    );


  if (
    !Number.isFinite(id) ||
    id <= 0
  ) {

    return;
  }


  try {

    await api(
      "/messages/read",
      {
        method: "POST",

        body:
          JSON.stringify({
            user_id:
              id
          })
      }
    );

  } catch {
    /*
     * Worker endpoint မရှိသေးရင်
     * chat မပျက်အောင် ignore လုပ်ထားမယ်။
     */
  }
}


/* ============================================================
   PROFILE UNREAD BADGE
============================================================ */

function updateProfileUnreadBadge(
  count
) {

  ensurePrivateInboxUI();


  const unread =
    Math.max(
      0,
      Number(count) || 0
    );


  if (!profileUnreadBadge) {
    return;
  }


  if (unread <= 0) {

    profileUnreadBadge.textContent =
      "";

    profileUnreadBadge.classList.add(
      "hidden"
    );

    return;
  }


  profileUnreadBadge.textContent =
    unread > 99
      ? "99+"
      : String(unread);


  profileUnreadBadge.classList.remove(
    "hidden"
  );
}


/* ============================================================
   UPDATE SINGLE INBOX ITEM
============================================================ */

function updatePrivateInboxItem(
  userId,
  unreadCount
) {

  if (!privateInboxContainer) {
    return;
  }


  const item =
    privateInboxContainer.querySelector(
      `[data-user-id="${CSS.escape(
        String(userId)
      )}"]`
    );


  if (!item) {
    return;
  }


  const right =
    item.querySelector(
      ".private-inbox-right"
    );


  if (!right) {
    return;
  }


  const oldBadge =
    right.querySelector(
      ".private-inbox-badge"
    );


  const count =
    Number(
      unreadCount
    ) || 0;


  if (count <= 0) {

    oldBadge?.remove();

    return;
  }


  const badge =
    oldBadge ||
    document.createElement(
      "span"
    );


  badge.className =
    "private-inbox-badge";


  badge.textContent =
    count > 99
      ? "99+"
      : String(count);


  if (!oldBadge) {

    right.prepend(
      badge
    );
  }
}


/* ============================================================
   PRIVATE INBOX REFRESH
============================================================ */

function startPrivateInboxRefresh() {

  stopPrivateInboxRefresh();


  privateInboxTimer =
    setInterval(
      async () => {

        if (
          document.visibilityState !==
          "visible"
        ) {

          return;
        }


        if (!currentUser) {
          return;
        }


        await loadPrivateInbox();

      },
      PRIVATE_INBOX_REFRESH_TIME
    );
}


function stopPrivateInboxRefresh() {

  if (privateInboxTimer) {

    clearInterval(
      privateInboxTimer
    );

    privateInboxTimer =
      null;
  }
}


/* ============================================================
   PROFILE
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


  /*
   * Make sure private inbox UI exists.
   */

  ensurePrivateInboxUI();
}


function openProfile() {

  updateProfilePanel();


  if (profilePanel) {

    profilePanel.classList.remove(
      "hidden"
    );
  }


  /*
   * Immediately refresh when profile opens.
   */

  loadPrivateInbox();
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
   CLOSE PROFILE OUTSIDE
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
