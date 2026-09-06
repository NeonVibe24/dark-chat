const API = "/api";

let currentUser = null;
let selectedUser = null;

let groupMessageTimer = null;
let privateMessageTimer = null;
let inboxTimer = null;

let token =
  localStorage.getItem("dark_chat_token") || "";


/* ============================================================
   DOM HELPERS
============================================================ */

function $(id) {
  return document.getElementById(id);
}


function show(element) {
  if (!element) return;

  element.classList.remove("hidden");
}


function hide(element) {
  if (!element) return;

  element.classList.add("hidden");
}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ============================================================
   TOAST
============================================================ */

function toast(message) {

  const existing =
    document.querySelector(".dark-chat-toast");

  if (existing) {
    existing.remove();
  }


  const el =
    document.createElement("div");

  el.className =
    "dark-chat-toast";

  el.textContent =
    String(message || "");


  Object.assign(
    el.style,
    {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      zIndex: "99999",
      padding: "12px 18px",
      borderRadius: "12px",
      background: "#171717",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.12)",
      boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      fontSize: "14px",
      maxWidth: "90%",
      textAlign: "center"
    }
  );


  document.body.appendChild(el);


  setTimeout(() => {

    if (el.parentNode) {
      el.remove();
    }

  }, 3000);
}


/* ============================================================
   USER ID NORMALIZER

   IMPORTANT

   Worker POST /api/messages expects:

     receiver_id

   Other API endpoints use:

     user_id

   This helper makes sure the correct numeric user ID
   is always extracted from a user object.
============================================================ */

function getUserId(user) {

  if (!user) {
    return 0;
  }


  const possibleIds = [

    user.id,

    user.user_id,

    user.userId,

    user.receiver_id,

    user.receiverId,

    user.sender_id,

    user.senderId,

    user?.user?.id,

    user?.user?.user_id,

    user?.sender?.id,

    user?.other_user_id

  ];


  for (
    const value of possibleIds
  ) {

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {

      const number =
        Number(value);


      if (
        Number.isInteger(number) &&
        number > 0
      ) {

        return number;

      }

    }

  }


  return 0;
}


/* ============================================================
   API HELPER
============================================================ */

async function api(
  path,
  options = {}
) {

  const headers = {
    ...(options.headers || {})
  };


  if (options.body !== undefined) {

    headers["Content-Type"] =
      "application/json";

  }


  if (token) {

    headers["Authorization"] =
      `Bearer ${token}`;

  }


  const response =
    await fetch(
      `${API}${path}`,
      {
        ...options,
        headers
      }
    );


  let data = null;


  try {

    data =
      await response.json();

  } catch {

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


    error.data =
      data;


    throw error;

  }


  return data;

}


/* ============================================================
   ELEMENTS
============================================================ */

const authScreen =
  $("authScreen");

const loginForm =
  $("loginForm");

const registerForm =
  $("registerForm");

const loginSection =
  $("loginSection");

const registerSection =
  $("registerSection");

const appScreen =
  $("appScreen");

const authError =
  $("authError");

const loginError =
  $("loginError");

const registerError =
  $("registerError");

const usernameInput =
  $("username");

const emailInput =
  $("email");

const passwordInput =
  $("password");

const registerUsernameInput =
  $("registerUsername");

const registerEmailInput =
  $("registerEmail");

const registerPasswordInput =
  $("registerPassword");

const usersList =
  $("usersList");

const inboxList =
  $("inboxList");

const inboxCount =
  $("inboxCount");

const groupChat =
  $("groupChat");

const privateChat =
  $("privateChat");

const emptyChat =
  $("emptyChat");

const groupMessages =
  $("groupMessages");

const privateMessages =
  $("privateMessages");

const groupMessageForm =
  $("groupMessageForm");

const messageForm =
  $("messageForm");

const groupMessageInput =
  $("groupMessageInput");

const messageInput =
  $("messageInput");

const privateChatUsername =
  $("privateChatUsername");

const privateChatAvatar =
  $("privateChatAvatar");

const groupChatAvatar =
  $("groupChatAvatar");

const currentUsername =
  $("currentUsername");

const currentAvatar =
  $("currentAvatar");

const profilePhotoInput =
  $("profilePhotoInput");

const profilePhotoPreview =
  $("profilePhotoPreview");

const logoutButton =
  $("logoutButton");

const backButton =
  $("backButton");

const groupButton =
  $("groupButton");

const profileButton =
  $("profileButton");

const profilePanel =
  $("profilePanel");


/* ============================================================
   AUTH SCREEN
============================================================ */

function showAuth() {

  show(authScreen);
  hide(appScreen);

}


function showApp() {

  hide(authScreen);
  show(appScreen);

}


/* ============================================================
   AUTH ERROR
============================================================ */

function setAuthError(message) {

  if (authError) {

    authError.textContent =
      message || "";

    if (message) {
      show(authError);
    } else {
      hide(authError);
    }

  }

}


function setLoginError(message) {

  if (loginError) {

    loginError.textContent =
      message || "";

    if (message) {
      show(loginError);
    } else {
      hide(loginError);
    }

  }

}


function setRegisterError(message) {

  if (registerError) {

    registerError.textContent =
      message || "";

    if (message) {
      show(registerError);
    } else {
      hide(registerError);
    }

  }

}


/* ============================================================
   AUTH TABS
============================================================ */

function showLoginForm() {

  show(loginSection);
  hide(registerSection);

}


function showRegisterForm() {

  hide(loginSection);
  show(registerSection);

}


document
  .querySelectorAll(
    "[data-auth='login'], #showLogin"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        showLoginForm();

      }
    );

  });


document
  .querySelectorAll(
    "[data-auth='register'], #showRegister"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        showRegisterForm();

      }
    );

  });


/* ============================================================
   LOGIN
============================================================ */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      setLoginError("");


      const username =
        String(
          usernameInput?.value || ""
        ).trim();


      const email =
        String(
          emailInput?.value || ""
        ).trim();


      const password =
        String(
          passwordInput?.value || ""
        );


      if (
        !username &&
        !email
      ) {

        setLoginError(
          "Username or email is required."
        );

        return;

      }


      if (!password) {

        setLoginError(
          "Password is required."
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

                  email,

                  password

                })

            }
          );


        if (data?.token) {

          token =
            data.token;

          localStorage.setItem(
            "dark_chat_token",
            token
          );

        }


        currentUser =
          data?.user ||
          null;


        if (!currentUser) {

          await getCurrentUser();

        }


        showApp();

        await initializeApp();

      } catch (error) {

        console.error(
          "Login:",
          error
        );


        setLoginError(
          error?.message ||
          "Login failed."
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

      setRegisterError("");


      const username =
        String(
          registerUsernameInput?.value || ""
        ).trim();


      const email =
        String(
          registerEmailInput?.value || ""
        ).trim();


      const password =
        String(
          registerPasswordInput?.value || ""
        );


      if (!username) {

        setRegisterError(
          "Username is required."
        );

        return;

      }


      if (!password) {

        setRegisterError(
          "Password is required."
        );

        return;

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

                  email,

                  password

                })

            }
          );


        if (data?.token) {

          token =
            data.token;

          localStorage.setItem(
            "dark_chat_token",
            token
          );

        }


        currentUser =
          data?.user ||
          null;


        if (!currentUser) {

          await getCurrentUser();

        }


        showApp();

        await initializeApp();

      } catch (error) {

        console.error(
          "Register:",
          error
        );


        setRegisterError(
          error?.message ||
          "Registration failed."
        );

      }

    }
  );

}


/* ============================================================
   CURRENT USER
============================================================ */

async function getCurrentUser() {

  if (!token) {
    return null;
  }


  const endpoints = [

    "/me",

    "/profile",

    "/auth/me"

  ];


  for (
    const endpoint of endpoints
  ) {

    try {

      const data =
        await api(endpoint);


      const user =
        data?.user ||
        data?.data ||
        data;


      if (user) {

        const id =
          getUserId(user);


        if (id > 0) {

          currentUser = {
            ...user,
            id
          };


          return currentUser;

        }

      }

    } catch (error) {

      console.log(
        `Current user ${endpoint}:`,
        error?.message
      );

    }

  }


  return null;
}


/* ============================================================
   USER PROFILE UI
============================================================ */

function updateCurrentUserUI() {

  if (!currentUser) {
    return;
  }


  const username =
    currentUser.username ||
    "User";


  const avatar =
    currentUser.profile_photo ||
    "";


  if (currentUsername) {

    currentUsername.textContent =
      username;

  }


  if (currentAvatar) {

    if (avatar) {

      currentAvatar.src =
        avatar;

      currentAvatar.style.display =
        "block";

    } else {

      currentAvatar.removeAttribute(
        "src"
      );

      currentAvatar.style.display =
        "";

    }

  }


  if (profilePhotoPreview) {

    if (avatar) {

      profilePhotoPreview.src =
        avatar;

    } else {

      profilePhotoPreview.removeAttribute(
        "src"
      );

    }

  }

}


/* ============================================================
   SELECTED PRIVATE USER
============================================================ */

function normalizeSelectedUser(user) {

  const id =
    getUserId(user);


  return {

    ...(user || {}),

    id,

    user_id:
      id,

    username:
      user?.username ||
      user?.sender_username ||
      user?.name ||
      user?.other_username ||
      "User",

    profile_photo:
      user?.profile_photo ||
      user?.sender_profile_photo ||
      user?.avatar_url ||
      user?.avatar ||
      user?.other_profile_photo ||
      ""

  };

}


/* ============================================================
   PRIVATE HEADER
============================================================ */

function updatePrivateHeader() {

  if (!selectedUser) {
    return;
  }


  const username =
    selectedUser.username ||
    "User";


  const avatar =
    selectedUser.profile_photo ||
    "";


  if (privateChatUsername) {

    privateChatUsername.textContent =
      username;

  }


  if (privateChatAvatar) {

    if (avatar) {

      privateChatAvatar.src =
        avatar;

      privateChatAvatar.style.display =
        "block";

    } else {

      privateChatAvatar.removeAttribute(
        "src"
      );

      privateChatAvatar.style.display =
        "";

    }

  }

}


/* ============================================================
   OPEN PRIVATE CHAT
============================================================ */

async function openPrivateChat(user) {

  const normalized =
    normalizeSelectedUser(user);


  if (
    !normalized.id
  ) {

    toast(
      "Invalid user."
    );

    console.error(
      "Invalid selected user:",
      user
    );

    return;

  }


  if (
    currentUser &&
    normalized.id ===
      getUserId(currentUser)
  ) {

    return;

  }


  selectedUser =
    normalized;


  hide(groupChat);
  show(privateChat);
  hide(emptyChat);


  updatePrivateHeader();


  await loadPrivateMessages();


  startPrivateTimer();


  setTimeout(() => {

    if (messageInput) {

      messageInput.focus({
        preventScroll: true
      });

    }

  }, 100);

}


/* ============================================================
   OPEN PUBLIC GROUP
============================================================ */

async function openGroupChat() {

  selectedUser =
    null;


  stopPrivateTimer();


  hide(privateChat);
  hide(emptyChat);
  show(groupChat);


  await loadGroupMessages();


  startGroupTimer();

}


/* ============================================================
   PRIVATE MESSAGES
============================================================ */

async function loadPrivateMessages() {

  if (
    !privateMessages ||
    !selectedUser
  ) {

    return;

  }


  const userId =
    getUserId(
      selectedUser
    );


  if (!userId) {

    console.error(
      "Private chat user ID is invalid:",
      selectedUser
    );

    return;

  }


  try {

    const data =
      await api(
        `/messages?user_id=${encodeURIComponent(userId)}`
      );


    const messages =
      Array.isArray(data)
        ? data
        : (
          data?.messages ||
          data?.items ||
          data?.results ||
          []
        );


    renderPrivateMessages(
      messages
    );


    await markPrivateMessagesRead(
      userId
    );


  } catch (error) {

    console.error(
      "Private messages:",
      error
    );

  }

}


/* ============================================================
   RENDER PRIVATE MESSAGES
============================================================ */

function renderPrivateMessages(
  messages
) {

  if (!privateMessages) {
    return;
  }


  privateMessages.innerHTML =
    "";


  const currentId =
    getUserId(
      currentUser
    );


  for (
    const message of messages
  ) {

    const sender =
      message?.sender ||
      message?.user ||
      {};


    const senderId =
      getUserId({

        id:
          message?.sender_id ??
          sender?.id,

        user_id:
          message?.sender_id ??
          sender?.user_id

      });


    const isMine =
      String(senderId) ===
      String(currentId);


    const row =
      document.createElement("div");


    row.className =
      isMine
        ? "private-message mine"
        : "private-message";


    const bubble =
      document.createElement("div");


    bubble.className =
      "message-bubble";


    const content =
      message?.message ??
      message?.content ??
      message?.text ??
      "";


    bubble.textContent =
      content;


    row.appendChild(
      bubble
    );


    privateMessages.appendChild(
      row
    );

  }


  scrollPrivateMessagesToBottom();

}


/* ============================================================
   PRIVATE SEND MESSAGE

   IMPORTANT FIX

   Worker expects:

     receiver_id
     message

   Previously app.js sent:

     user_id

   which caused:

     Invalid receiver ID

============================================================ */

if (messageForm) {

  messageForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!selectedUser) {

        toast(
          "Select a user first."
        );

        return;

      }


      const input =
        messageInput;


      if (!input) {
        return;
      }


      const text =
        String(
          input.value || ""
        ).trim();


      if (!text) {

        input.focus();

        return;

      }


      const receiverId =
        getUserId(
          selectedUser
        );


      if (
        !Number.isInteger(
          receiverId
        ) ||
        receiverId <= 0
      ) {

        console.error(
          "Invalid receiver:",
          selectedUser
        );


        toast(
          "Invalid receiver ID."
        );

        return;

      }


      const currentId =
        getUserId(
          currentUser
        );


      if (
        currentId &&
        receiverId === currentId
      ) {

        toast(
          "You cannot message yourself."
        );

        return;

      }


      const submitBtn =
        messageForm.querySelector(
          'button[type="submit"]'
        );


      if (submitBtn) {

        submitBtn.disabled =
          true;

      }


      try {

        /*
         * Worker requires receiver_id.
         *
         * Only send the fields the Worker
         * actually needs.
         */

        await api(
          "/messages",
          {
            method: "POST",

            body:
              JSON.stringify({

                receiver_id:
                  receiverId,

                message:
                  text

              })

          }
        );


        input.value =
          "";


        await loadPrivateMessages();


        keepInputFocused(
          input
        );


      } catch (error) {

        console.error(
          "Send private message:",
          error
        );


        toast(
          error?.message ||
          "Message could not be sent."
        );


      } finally {

        if (submitBtn) {

          submitBtn.disabled =
            false;

        }

      }

    }
  );

}


/* ============================================================
   MARK PRIVATE MESSAGES READ
============================================================ */

async function markPrivateMessagesRead(
  userId
) {

  const otherUserId =
    Number(userId);


  if (
    !Number.isInteger(
      otherUserId
    ) ||
    otherUserId <= 0
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
              otherUserId

          })

      }
    );


    await loadInbox(
      false
    );


  } catch (error) {

    console.error(
      "Mark read:",
      error
    );

  }

}


/* ============================================================
   GROUP MESSAGES
============================================================ */

async function loadGroupMessages() {

  if (!groupMessages) {
    return;
  }


  try {

    const data =
      await api(
        "/group/messages"
      );


    const messages =
      Array.isArray(data)
        ? data
        : (
          data?.messages ||
          data?.items ||
          data?.results ||
          []
        );


    renderGroupMessages(
      messages
    );


  } catch (error) {

    console.error(
      "Group messages:",
      error
    );

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


  for (
    const message of messages
  ) {

    renderGroupMessage(
      message
    );

  }


  attachGroupUserButtons();


  scrollGroupMessagesToBottom();

}


/* ============================================================
   GROUP MESSAGE
============================================================ */

function renderGroupMessage(
  message
) {

  if (!groupMessages) {
    return;
  }


  const sender =
    message?.user ||
    message?.sender ||
    message?.author ||
    {};


  const senderId =
    getUserId({

      id:
        message?.sender_id ??
        message?.user_id ??
        sender?.id,

      user_id:
        message?.sender_id ??
        message?.user_id ??
        sender?.user_id

    });


  const senderName =
    message?.username ||
    message?.sender_username ||
    sender?.username ||
    sender?.name ||
    "User";


  const avatar =
    message?.profile_photo ||
    message?.sender_profile_photo ||
    sender?.profile_photo ||
    "";


  const content =
    message?.message ??
    message?.content ??
    message?.text ??
    "";


  const row =
    document.createElement("div");


  row.className =
    "group-message";


  const userArea =
    document.createElement("div");


  userArea.className =
    "group-message-user";


  const avatarButton =
    document.createElement("button");


  avatarButton.type =
    "button";


  avatarButton.className =
    "group-user-avatar";


  avatarButton.dataset.userId =
    String(senderId);


  avatarButton.dataset.username =
    senderName;


  avatarButton.dataset.avatar =
    avatar;


  if (avatar) {

    const img =
      document.createElement("img");

    img.src =
      avatar;

    img.alt =
      senderName;

    avatarButton.appendChild(
      img
    );

  } else {

    avatarButton.textContent =
      senderName
        .charAt(0)
        .toUpperCase();

  }


  const nameButton =
    document.createElement("button");


  nameButton.type =
    "button";


  nameButton.className =
    "group-user-name";


  nameButton.textContent =
    senderName;


  nameButton.dataset.userId =
    String(senderId);


  nameButton.dataset.username =
    senderName;


  nameButton.dataset.avatar =
    avatar;


  userArea.appendChild(
    avatarButton
  );


  userArea.appendChild(
    nameButton
  );


  const bubble =
    document.createElement("div");


  bubble.className =
    "group-message-bubble";


  bubble.textContent =
    content;


  row.appendChild(
    userArea
  );


  row.appendChild(
    bubble
  );


  groupMessages.appendChild(
    row
  );

}


/* ============================================================
   GROUP USER -> PRIVATE CHAT
============================================================ */

function attachGroupUserButtons() {

  if (!groupMessages) {
    return;
  }


  groupMessages
    .querySelectorAll(
      ".group-user-avatar, .group-user-name"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            Number(
              button.dataset.userId
            );


          const username =
            button.dataset.username ||
            "User";


          const avatar =
            button.dataset.avatar ||
            "";


          if (
            !Number.isInteger(id) ||
            id <= 0
          ) {

            toast(
              "Invalid user."
            );

            return;

          }


          if (
            currentUser &&
            id ===
              getUserId(currentUser)
          ) {

            return;

          }


          openPrivateChat({

            id,

            user_id:
              id,

            username,

            profile_photo:
              avatar,

            avatar_url:
              avatar

          });

        }
      );

    });

}


/* ============================================================
   GROUP SEND
============================================================ */

if (groupMessageForm) {

  groupMessageForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const input =
        groupMessageInput;


      if (!input) {
        return;
      }


      const text =
        String(
          input.value || ""
        ).trim();


      if (!text) {

        input.focus();

        return;

      }


      const submitBtn =
        groupMessageForm.querySelector(
          'button[type="submit"]'
        );


      if (submitBtn) {

        submitBtn.disabled =
          true;

      }


      try {

        await api(
          "/group/messages",
          {
            method: "POST",

            body:
              JSON.stringify({

                message:
                  text

              })

          }
        );


        input.value =
          "";


        await loadGroupMessages();


        keepInputFocused(
          input
        );


      } catch (error) {

        console.error(
          "Group send:",
          error
        );


        toast(
          error?.message ||
          "Message could not be sent."
        );


      } finally {

        if (submitBtn) {

          submitBtn.disabled =
            false;

        }

      }

    }
  );

}


/* ============================================================
   INBOX
============================================================ */

async function loadInbox(
  showLoading = true
) {

  if (!inboxList) {
    return;
  }


  try {

    const data =
      await api(
        "/messages/inbox"
      );


    const inbox =
      Array.isArray(data)
        ? data
        : (
          data?.inbox ||
          data?.users ||
          data?.items ||
          []
        );


    renderInbox(
      inbox
    );


    const total =
      Number(
        data?.total_unread ??
        data?.unread_count ??
        inbox.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item?.unread_count ||
              item?.unread ||
              0
            ),
          0
        )
      );


    updateInboxCount(
      total
    );


  } catch (error) {

    console.error(
      "Inbox:",
      error
    );

  }

}


/* ============================================================
   RENDER INBOX
============================================================ */

function renderInbox(
  inbox
) {

  if (!inboxList) {
    return;
  }


  inboxList.innerHTML =
    "";


  for (
    const item of inbox
  ) {

    renderInboxItem(
      item
    );

  }

}


/* ============================================================
   INBOX ITEM
============================================================ */

function renderInboxItem(
  item
) {

  if (!inboxList) {
    return;
  }


  const user =
    item?.user ||
    item?.sender ||
    item?.other_user ||
    {};


  const userId =
    getUserId({

      id:
        item?.user_id ??
        item?.sender_id ??
        item?.other_user_id ??
        user?.id,

      user_id:
        item?.user_id ??
        item?.sender_id ??
        item?.other_user_id ??
        user?.user_id,

      sender_id:
        item?.sender_id ??
        user?.sender_id

    });


  if (!userId) {
    return;
  }


  const username =
    item?.username ||
    item?.sender_username ||
    item?.other_username ||
    user?.username ||
    user?.name ||
    "User";


  const avatar =
    item?.profile_photo ||
    item?.sender_profile_photo ||
    item?.other_profile_photo ||
    user?.profile_photo ||
    "";


  const lastMessage =
    item?.last_message ||
    item?.message ||
    "";


  const unread =
    Number(
      item?.unread_count ||
      item?.unread ||
      0
    );


  const button =
    document.createElement("button");


  button.type =
    "button";


  button.className =
    "inbox-item";


  button.dataset.userId =
    String(userId);


  const avatarEl =
    document.createElement("div");


  avatarEl.className =
    "inbox-avatar";


  if (avatar) {

    const img =
      document.createElement("img");

    img.src =
      avatar;

    img.alt =
      username;

    avatarEl.appendChild(
      img
    );

  } else {

    avatarEl.textContent =
      username
        .charAt(0)
        .toUpperCase();

  }


  const content =
    document.createElement("div");


  content.className =
    "inbox-content";


  const name =
    document.createElement("div");


  name.className =
    "inbox-name";


  name.textContent =
    username;


  const preview =
    document.createElement("div");


  preview.className =
    "inbox-preview";


  preview.textContent =
    lastMessage;


  content.appendChild(
    name
  );


  content.appendChild(
    preview
  );


  button.appendChild(
    avatarEl
  );


  button.appendChild(
    content
  );


  if (unread > 0) {

    const badge =
      document.createElement("span");


    badge.className =
      "inbox-unread";


    badge.textContent =
      String(unread);


    button.appendChild(
      badge
    );

  }


  button.addEventListener(
    "click",
    () => {

      openPrivateChat({

        id:
          userId,

        user_id:
          userId,

        username,

        profile_photo:
          avatar,

        avatar_url:
          avatar

      });

    }
  );


  inboxList.appendChild(
    button
  );

}


/* ============================================================
   INBOX COUNT
============================================================ */

function updateInboxCount(
  count
) {

  const value =
    Math.max(
      0,
      Number(count) || 0
    );


  if (inboxCount) {

    inboxCount.textContent =
      value > 0
        ? String(value)
        : "";

    if (value > 0) {
      inboxCount.classList.add(
        "has-unread"
      );
    } else {
      inboxCount.classList.remove(
        "has-unread"
      );
    }

  }


  document
    .querySelectorAll(
      "[data-inbox-count]"
    )
    .forEach(element => {

      element.textContent =
        value > 0
          ? String(value)
          : "";

    });

}


/* ============================================================
   PROFILE PHOTO UPLOAD
============================================================ */

if (profilePhotoInput) {

  profilePhotoInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        toast(
          "Please select an image."
        );

        profilePhotoInput.value =
          "";

        return;

      }


      try {

        const base64 =
          await fileToDataURL(
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
                    base64

                })

            }
          );


        currentUser =
          data?.user ||
          currentUser;


        updateCurrentUserUI();


        toast(
          "Profile photo updated."
        );


      } catch (error) {

        console.error(
          "Profile photo:",
          error
        );


        toast(
          error?.message ||
          "Profile photo could not be updated."
        );

      }


      profilePhotoInput.value =
        "";

    }
  );

}


/* ============================================================
   FILE -> DATA URL
============================================================ */

function fileToDataURL(
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
        () => resolve(
          reader.result
        );


      reader.onerror =
        () => reject(
          new Error(
            "Could not read image."
          )
        );


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* ============================================================
   PROFILE PHOTO DELETE
============================================================ */

document
  .querySelectorAll(
    "#removeProfilePhoto, [data-remove-profile-photo]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        event.preventDefault();


        try {

          const data =
            await api(
              "/profile/photo",
              {
                method: "DELETE"
              }
            );


          currentUser =
            data?.user ||
            currentUser;


          updateCurrentUserUI();


          toast(
            "Profile photo removed."
          );


        } catch (error) {

          console.error(
            "Remove profile photo:",
            error
          );


          toast(
            error?.message ||
            "Profile photo could not be removed."
          );

        }

      }
    );

  });


/* ============================================================
   LOGOUT
============================================================ */

if (logoutButton) {

  logoutButton.addEventListener(
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

      } catch (error) {

        console.error(
          "Logout:",
          error
        );

      }


      token =
        "";


      currentUser =
        null;


      selectedUser =
        null;


      localStorage.removeItem(
        "dark_chat_token"
      );


      stopAllTimers();


      showAuth();


      showLoginForm();

    }
  );

}


/* ============================================================
   BACK BUTTON
============================================================ */

if (backButton) {

  backButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      selectedUser =
        null;


      stopPrivateTimer();


      hide(privateChat);


      if (emptyChat) {
        show(emptyChat);
      }


      openGroupChat();

    }
  );

}


/* ============================================================
   GROUP BUTTON
============================================================ */

if (groupButton) {

  groupButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      openGroupChat();

    }
  );

}


/* ============================================================
   PROFILE BUTTON
============================================================ */

if (profileButton) {

  profileButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      if (!profilePanel) {
        return;
      }


      profilePanel.classList.toggle(
        "hidden"
      );

    }
  );

}


/* ============================================================
   USERS LIST
============================================================ */

async function loadUsers() {

  if (!usersList) {
    return;
  }


  try {

    const data =
      await api(
        "/users"
      );


    const users =
      Array.isArray(data)
        ? data
        : (
          data?.users ||
          data?.items ||
          data?.results ||
          []
        );


    renderUsers(
      users
    );


  } catch (error) {

    console.error(
      "Users:",
      error
    );

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


  for (
    const user of users
  ) {

    const id =
      getUserId(
        user
      );


    if (!id) {
      continue;
    }


    const username =
      user?.username ||
      "User";


    const avatar =
      user?.profile_photo ||
      "";


    const button =
      document.createElement("button");


    button.type =
      "button";


    button.className =
      "user-item";


    button.dataset.userId =
      String(id);


    const avatarEl =
      document.createElement("div");


    avatarEl.className =
      "user-avatar";


    if (avatar) {

      const img =
        document.createElement("img");


      img.src =
        avatar;


      img.alt =
        username;


      avatarEl.appendChild(
        img
      );

    } else {

      avatarEl.textContent =
        username
          .charAt(0)
          .toUpperCase();

    }


    const name =
      document.createElement("span");


    name.className =
      "user-name";


    name.textContent =
      username;


    button.appendChild(
      avatarEl
    );


    button.appendChild(
      name
    );


    button.addEventListener(
      "click",
      () => {

        openPrivateChat(
          normalizeSelectedUser(
            user
          )
        );

      }
    );


    usersList.appendChild(
      button
    );

  }

}


/* ============================================================
   SCROLL
============================================================ */

function scrollPrivateMessagesToBottom() {

  if (!privateMessages) {
    return;
  }


  privateMessages.scrollTop =
    privateMessages.scrollHeight;

}


function scrollGroupMessagesToBottom() {

  if (!groupMessages) {
    return;
  }


  groupMessages.scrollTop =
    groupMessages.scrollHeight;

}


/* ============================================================
   INPUT FOCUS
============================================================ */

function keepInputFocused(
  input
) {

  if (!input) {
    return;
  }


  setTimeout(() => {

    try {

      input.focus({
        preventScroll: true
      });

    } catch {

      input.focus();

    }

  }, 50);

}


/* ============================================================
   ENTER KEY
============================================================ */

function setupMessageKeyboard(
  input,
  form
) {

  if (!input || !form) {
    return;
  }


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();


        if (
          typeof form.requestSubmit ===
          "function"
        ) {

          form.requestSubmit();

        } else {

          form.dispatchEvent(
            new Event(
              "submit",
              {
                bubbles: true,
                cancelable: true
              }
            )
          );

        }

      }

    }
  );

}


setupMessageKeyboard(
  messageInput,
  messageForm
);


setupMessageKeyboard(
  groupMessageInput,
  groupMessageForm
);


/* ============================================================
   REFRESH TIMERS
============================================================ */

function startGroupTimer() {

  stopGroupTimer();


  groupMessageTimer =
    setInterval(
      async () => {

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


function stopGroupTimer() {

  if (
    groupMessageTimer
  ) {

    clearInterval(
      groupMessageTimer
    );


    groupMessageTimer =
      null;

  }

}


function startPrivateTimer() {

  stopPrivateTimer();


  privateMessageTimer =
    setInterval(
      async () => {

        if (
          !selectedUser ||
          !privateChat ||
          privateChat.classList.contains(
            "hidden"
          )
        ) {

          return;

        }


        await loadPrivateMessages();

      },
      3000
    );

}


function stopPrivateTimer() {

  if (
    privateMessageTimer
  ) {

    clearInterval(
      privateMessageTimer
    );


    privateMessageTimer =
      null;

  }

}


function startInboxTimer() {

  stopInboxTimer();


  inboxTimer =
    setInterval(
      async () => {

        await loadInbox(
          false
        );

      },
      5000
    );

}


function stopInboxTimer() {

  if (
    inboxTimer
  ) {

    clearInterval(
      inboxTimer
    );


    inboxTimer =
      null;

  }

}


function stopAllTimers() {

  stopGroupTimer();

  stopPrivateTimer();

  stopInboxTimer();

}


/* ============================================================
   INITIALIZE APP
============================================================ */

async function initializeApp() {

  updateCurrentUserUI();


  await Promise.allSettled([

    loadUsers(),

    loadInbox(),

    loadGroupMessages()

  ]);


  await openGroupChat();


  startInboxTimer();

}


/* ============================================================
   STARTUP
============================================================ */

async function startup() {

  if (!token) {

    showAuth();

    showLoginForm();

    return;

  }


  const user =
    await getCurrentUser();


  if (!user) {

    token =
      "";

    localStorage.removeItem(
      "dark_chat_token"
    );


    showAuth();

    showLoginForm();

    return;

  }


  showApp();


  await initializeApp();

}


document.addEventListener(
  "DOMContentLoaded",
  () => {

    startup();

  }
);
