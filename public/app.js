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
  document.getElementById("reloadGroupMessages");


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

      registerForm?.classList.add(
        "hidden"
      );

      loginForm?.classList.remove(
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
          ?.value
          .trim();


      const email =
        document
          .getElementById(
            "registerEmail"
          )
          ?.value
          .trim();


      const password =
        document
          .getElementById(
            "registerPassword"
          )
          ?.value;


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
            email || "";
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
          ?.value
          .trim();


      const password =
        document
          .getElementById(
            "loginPassword"
          )
          ?.value;


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


        if (!data.token) {

          throw new Error(
            "Login token missing"
          );
        }


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
      data.user;


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


  if (currentUser) {

    if (myUsername) {

      myUsername.textContent =
        currentUser.username ||
        "User";
    }


    setAvatar(
      myAvatar,
      currentUser
    );
  }


  updateProfilePanel();


  /*
   * IMPORTANT:
   *
   * Sidebar User List မသုံးတော့ဘူး။
   *
   * Group Chat ထဲက Profile ကိုနှိပ်မှ
   * Private Chat သွားမယ်။
   */


  hideSidebarUserList();


  await openGroupChat();
}


/* ============================================================
   HIDE SIDEBAR USER LIST
============================================================ */

function hideSidebarUserList() {

  if (!usersList) {
    return;
  }


  /*
   * User list container ကို
   * လုံးဝမပြတော့ဘူး။
   */

  usersList.innerHTML =
    "";


  usersList.style.display =
    "none";


  usersList.style.visibility =
    "hidden";


  usersList.style.pointerEvents =
    "none";
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
  }


  ensureGroupComposer();


  await loadGroupMessages();


  startGroupMessageRefresh();


  setTimeout(
    () => {

      if (groupMessageInput) {

        groupMessageInput.focus();
      }

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


    renderGroupMessages(
      Array.isArray(
        data.messages
      )
        ? data.messages
        : []
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
       * Worker response:
       *
       * sender_id
       * sender_username
       * sender_profile_photo
       *
       * OR
       *
       * sender: {...}
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
       * MESSAGE ROW
       */

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


      /*
       * OTHER USER PROFILE
       *
       * Profile ပုံကိုနှိပ်ရင်
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
          "avatar-button group-message-avatar";


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
          event => {

            event.preventDefault();

            event.stopPropagation();


            if (
              Number.isFinite(
                senderId
              ) &&
              senderId > 0
            ) {

              openPrivateChatFromGroup(
                senderId,
                senderUsername,
                senderPhoto
              );

            } else {

              showToast(
                "User information unavailable"
              );
            }
          }
        );


        row.appendChild(
          profileButton
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
        "group-message-content";


      /*
       * USERNAME
       *
       * Username ကိုနှိပ်ရင်လည်း
       * Private Chat သွားမယ်။
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


        name.title =
          `Chat with ${senderUsername}`;


        name.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();


            if (
              Number.isFinite(
                senderId
              ) &&
              senderId > 0
            ) {

              openPrivateChatFromGroup(
                senderId,
                senderUsername,
                senderPhoto
              );

            } else {

              showToast(
                "User information unavailable"
              );
            }
          }
        );


        content.appendChild(
          name
        );
      }


      /*
       * MESSAGE BUBBLE
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


      if (
        time.textContent
      ) {

        bubble.appendChild(
          time
        );
      }


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


  /*
   * Scroll bottom
   */

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
        groupMessageInput
          .value
          .trim();


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


  /*
   * Invalid ID
   */

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
   * ကိုယ့် Profile ကိုနှိပ်ရင်
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


  const user = {

    id,

    username:
      username ||
      "User",

    profile_photo:
      profilePhoto ||
      null
  };


  selectedUser =
    user;


  /*
   * Group timer ပိတ်
   */

  stopGroupMessageRefresh();


  /*
   * Private UI
   */

  showPrivateView();


  /*
   * Header
   */

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


  /*
   * Private messages load
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
   PRIVATE CHAT LOAD
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
      Array.isArray(
        data.messages
      )
        ? data.messages
        : []
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


      if (
        time.textContent
      ) {

        bubble.appendChild(
          time
        );
      }


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

        showToast(
          "Select a user from Group Chat"
        );

        return;
      }


      if (!messageInput) {
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
   REFRESH USERS
============================================================ */

/*
 * Sidebar User List မသုံးတော့တဲ့အတွက်
 * refreshUsers ကို User list refresh မလုပ်စေတော့ဘူး။
 *
 * HTML ထဲမှာ button ရှိနေသေးရင်လည်း
 * မလိုအပ်တဲ့ User API request မဖြစ်အောင်
 * listener ကို ဒီလိုပိတ်ထားတယ်။
 */

if (refreshUsers) {

  refreshUsers.addEventListener(
    "click",
    async event => {

      event.preventDefault();

      hideSidebarUserList();

      showToast(
        "Users are available in Public Group Chat"
      );
    }
  );
}


/* ============================================================
   RELOAD PRIVATE MESSAGES
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


  if (profilePanelName) {

    profilePanelName.textContent =
      currentUser.username ||
      "User";
  }


  if (profilePanelEmail) {

    profilePanelEmail.textContent =
      currentUser.email ||
      "";
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


        showToast(
          "Photo updated"
        );


        /*
         * Group Chat ကိုပြန် load လုပ်မယ်။
         *
         * ကိုယ့် profile photo ပြောင်းပြီး
         * Group message တွေမှာ အသစ်ပြချင်လို့။
         */

        await loadGroupMessages();


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


        await loadGroupMessages();


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
