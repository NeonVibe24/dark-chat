const API = "/api";

let currentUser = null;
let selectedUser = null;

let groupMessageTimer = null;
let privateMessageTimer = null;
let inboxTimer = null;

let token = localStorage.getItem("dark_chat_token") || "";


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function show(el) {
  if (!el) return;
  el.classList.remove("hidden");
}

function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initials(name) {
  const value = String(name || "U").trim();
  return value ? value.charAt(0).toUpperCase() : "U";
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function toast(message) {
  const el = $("toast");

  if (!el) return;

  el.textContent = message || "";

  show(el);

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    hide(el);
  }, 2500);
}


/* =========================================================
   API
========================================================= */

async function api(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API + path, {
    ...options,
    headers
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}


/* =========================================================
   AUTH ELEMENTS
========================================================= */

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

const showRegisterBtn = $("showRegister");
const showLoginBtn = $("showLogin");


/* =========================================================
   CHAT ELEMENTS
========================================================= */

const chatScreen = $("chatScreen");

const groupChat = $("groupChat");
const privateChat = $("privateChat");
const emptyChat = $("emptyChat");

const groupMessages = $("groupMessages");
const messagesBox = $("messagesBox");

const groupMessageForm = $("groupMessageForm");
const groupMessageInput = $("groupMessageInput");

const messageForm = $("messageForm");
const messageInput = $("messageInput");

const privateBackBtn = $("privateBackBtn");

const reloadGroupMessages = $("reloadGroupMessages");
const reloadMessages = $("reloadMessages");

const logoutBtn = $("logoutBtn");


/* =========================================================
   PROFILE ELEMENTS
========================================================= */

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


/* =========================================================
   PRIVATE CHAT HEADER
========================================================= */

const chatUsername = $("chatUsername");
const chatStatus = $("chatStatus");

const chatAvatar = $("chatAvatar");
const chatAvatarImage = $("chatAvatarImage");
const chatAvatarFallback = $("chatAvatarFallback");


/* =========================================================
   AUTH SCREEN
========================================================= */

function openLogin() {
  show(authScreen);
  show(loginBox);
  hide(registerBox);

  if (loginError) {
    loginError.textContent = "";
    hide(loginError);
  }
}

function openRegister() {
  show(authScreen);
  hide(loginBox);
  show(registerBox);

  if (registerError) {
    registerError.textContent = "";
    hide(registerError);
  }
}

if (showRegisterBtn) {
  showRegisterBtn.addEventListener("click", openRegister);
}

if (showLoginBtn) {
  showLoginBtn.addEventListener("click", openLogin);
}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = loginUsername?.value.trim() || "";
    const password = loginPassword?.value || "";

    if (!username || !password) {
      setAuthError(loginError, "Enter username and password.");
      return;
    }

    const submitBtn =
      loginForm.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({
          username,
          password
        })
      });

      token =
        data?.token ||
        data?.access_token ||
        data?.session?.token ||
        "";

      if (!token) {
        throw new Error("Login token was not returned.");
      }

      localStorage.setItem("dark_chat_token", token);

      currentUser =
        data?.user ||
        data?.currentUser ||
        null;

      if (!currentUser) {
        currentUser = await getCurrentUser();
      }

      await enterChat();

    } catch (error) {
      setAuthError(
        loginError,
        error?.message || "Login failed."
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}


/* =========================================================
   REGISTER
========================================================= */

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
      registerUsername?.value.trim() || "";

    const password =
      registerPassword?.value || "";

    const confirm =
      registerPasswordConfirm?.value || "";

    if (!username || !password || !confirm) {
      setAuthError(
        registerError,
        "Please fill in all fields."
      );
      return;
    }

    if (password !== confirm) {
      setAuthError(
        registerError,
        "Passwords do not match."
      );
      return;
    }

    const submitBtn =
      registerForm.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    try {
      await api("/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password
        })
      });

      toast("Account created.");

      registerForm.reset();

      openLogin();

      if (loginUsername) {
        loginUsername.value = username;
      }

      if (loginPassword) {
        loginPassword.focus();
      }

    } catch (error) {
      setAuthError(
        registerError,
        error?.message || "Registration failed."
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}


function setAuthError(element, message) {
  if (!element) return;

  element.textContent = message || "";

  if (message) {
    show(element);
  } else {
    hide(element);
  }
}


/* =========================================================
   CURRENT USER
========================================================= */

async function getCurrentUser() {
  const possibleEndpoints = [
    "/me",
    "/profile",
    "/auth/me"
  ];

  let lastError = null;

  for (const endpoint of possibleEndpoints) {
    try {
      const data = await api(endpoint);

      return (
        data?.user ||
        data?.currentUser ||
        data
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load profile.");
}


/* =========================================================
   ENTER CHAT
========================================================= */

async function enterChat() {
  show(chatScreen);
  hide(authScreen);

  show(groupChat);
  hide(privateChat);
  hide(emptyChat);

  selectedUser = null;

  updateMyProfile();

  await loadGroupMessages();

  startTimers();

  updateKeyboardLayout();

  setTimeout(() => {
    if (groupMessageInput) {
      groupMessageInput.focus({
        preventScroll: true
      });
    }
  }, 150);
}


/* =========================================================
   PROFILE DISPLAY
========================================================= */

function getAvatarUrl(user) {
  if (!user) return "";

  return (
    user.avatar_url ||
    user.avatarUrl ||
    user.profile_photo ||
    user.profile_photo_url ||
    user.photo_url ||
    user.photo ||
    ""
  );
}

function updateAvatar(image, fallback, user) {
  if (!image || !fallback) return;

  const name =
    user?.username ||
    user?.name ||
    "U";

  fallback.textContent = initials(name);

  const url = getAvatarUrl(user);

  if (url) {
    image.src = url;
    show(image);
    hide(fallback);

    image.onerror = () => {
      image.removeAttribute("src");
      hide(image);
      show(fallback);
    };
  } else {
    image.removeAttribute("src");
    hide(image);
    show(fallback);
  }
}

function updateMyProfile() {
  if (!currentUser) return;

  const username =
    currentUser.username ||
    currentUser.name ||
    "User";

  if (myUsername) {
    myUsername.textContent = username;
  }

  updateAvatar(
    myAvatar,
    myAvatarFallback,
    currentUser
  );

  updateAvatar(
    profileAvatarImage,
    profileAvatarFallback,
    currentUser
  );

  if (profileUsername) {
    profileUsername.textContent = username;
  }
}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await api("/logout", {
        method: "POST"
      });
    } catch {
      // Local logout still works if server logout fails.
    }

    stopTimers();

    token = "";
    currentUser = null;
    selectedUser = null;

    localStorage.removeItem("dark_chat_token");

    closeProfile();

    if (loginForm) {
      loginForm.reset();
    }

    if (registerForm) {
      registerForm.reset();
    }

    openLogin();

    toast("Logged out.");
  });
}


/* =========================================================
   GROUP CHAT
========================================================= */

async function loadGroupMessages() {
  if (!groupMessages) return;

  try {
    const data = await api("/group/messages");

    const messages =
      Array.isArray(data)
        ? data
        : (
          data?.messages ||
          data?.items ||
          data?.results ||
          []
        );

    renderGroupMessages(messages);

  } catch (error) {
    console.error("Group messages:", error);
  }
}


function renderGroupMessages(messages) {
  if (!groupMessages) return;

  if (!messages.length) {
    groupMessages.innerHTML = `
      <div class="empty-chat">
        <div class="empty-chat-inner">
          <h2>Public Group Chat</h2>
          <p>No messages yet.</p>
        </div>
      </div>
    `;

    return;
  }

  const wasNearBottom =
    groupMessages.scrollHeight -
    groupMessages.scrollTop -
    groupMessages.clientHeight < 120;

  groupMessages.innerHTML = messages
    .map(renderGroupMessage)
    .join("");

  attachGroupUserButtons();

  if (wasNearBottom) {
    scrollToBottom(groupMessages);
  }
}


function renderGroupMessage(message) {
  const sender =
    message?.user ||
    message?.sender ||
    message?.author ||
    {};

  const senderId =
    message?.user_id ??
    message?.sender_id ??
    sender?.id ??
    "";

  const senderName =
    message?.username ||
    message?.sender_username ||
    sender?.username ||
    sender?.name ||
    "User";

  const text =
    message?.content ??
    message?.message ??
    message?.text ??
    "";

  const time =
    message?.created_at ||
    message?.createdAt ||
    message?.timestamp ||
    message?.time ||
    "";

  const avatar =
    getAvatarUrl(message) ||
    getAvatarUrl(sender);

  const mine =
    currentUser &&
    String(senderId) === String(currentUser.id);

  const avatarHtml = avatar
    ? `
      <img
        src="${escapeHtml(avatar)}"
        alt=""
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      >
      <span
        class="avatar-fallback"
        style="display:none;"
      >
        ${escapeHtml(initials(senderName))}
      </span>
    `
    : `
      <span class="avatar-fallback">
        ${escapeHtml(initials(senderName))}
      </span>
    `;

  return `
    <div
      class="group-message ${mine ? "mine" : ""}"
      data-user-id="${escapeHtml(senderId)}"
    >

      ${
        mine
          ? ""
          : `
            <div class="message-sender">

              <button
                type="button"
                class="avatar group-user-avatar"
                data-user-id="${escapeHtml(senderId)}"
                data-username="${escapeHtml(senderName)}"
                data-avatar="${escapeHtml(avatar)}"
              >
                ${avatarHtml}
              </button>

              <button
                type="button"
                class="message-sender-name group-user-name"
                data-user-id="${escapeHtml(senderId)}"
                data-username="${escapeHtml(senderName)}"
              >
                ${escapeHtml(senderName)}
              </button>

            </div>
          `
      }

      <div class="message-content">

        ${
          mine
            ? ""
            : ""
        }

        <div class="message-bubble">
          ${escapeHtml(text)}
        </div>

        <div class="message-time">
          ${escapeHtml(formatTime(time))}
        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   GROUP USER CLICK
========================================================= */

function attachGroupUserButtons() {
  if (!groupMessages) return;

  groupMessages
    .querySelectorAll(
      ".group-user-avatar, .group-user-name"
    )
    .forEach(button => {

      button.addEventListener("click", () => {
        const id =
          button.dataset.userId;

        const username =
          button.dataset.username ||
          "User";

        if (!id) return;

        if (
          currentUser &&
          String(id) === String(currentUser.id)
        ) {
          return;
        }

        openPrivateChat({
          id,
          username,
          avatar_url:
            button.dataset.avatar || ""
        });
      });

    });
}


/* =========================================================
   SEND GROUP MESSAGE
========================================================= */

if (groupMessageForm) {
  groupMessageForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
      toast("Please login first.");
      return;
    }

    const input =
      groupMessageInput;

    if (!input) return;

    const text =
      input.value.trim();

    if (!text) {
      input.focus();
      return;
    }

    const submitBtn =
      groupMessageForm.querySelector(
        'button[type="submit"]'
      );

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    try {
      await api("/group/messages", {
        method: "POST",
        body: JSON.stringify({
          content: text,
          message: text,
          text: text
        })
      });

      input.value = "";

      await loadGroupMessages();

      keepInputFocused(input);

    } catch (error) {
      toast(
        error?.message ||
        "Message could not be sent."
      );

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}


/* =========================================================
   PRIVATE CHAT
========================================================= */

async function openPrivateChat(user) {
  if (!user) return;

  selectedUser = {
    ...user
  };

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


function updatePrivateHeader() {
  if (!selectedUser) return;

  const username =
    selectedUser.username ||
    selectedUser.name ||
    "User";

  if (chatUsername) {
    chatUsername.textContent =
      username;
  }

  if (chatStatus) {
    chatStatus.textContent =
      "Private Chat";
  }

  updateAvatar(
    chatAvatarImage,
    chatAvatarFallback,
    selectedUser
  );
}


/* =========================================================
   PRIVATE BACK
========================================================= */

function closePrivateChat() {
  selectedUser = null;

  stopPrivateTimer();

  hide(privateChat);
  show(groupChat);
  hide(emptyChat);

  loadGroupMessages();

  setTimeout(() => {
    if (groupMessageInput) {
      groupMessageInput.focus({
        preventScroll: true
      });
    }
  }, 100);
}

if (privateBackBtn) {
  privateBackBtn.addEventListener(
    "click",
    closePrivateChat
  );
}


/* =========================================================
   PRIVATE MESSAGES
========================================================= */

async function loadPrivateMessages() {
  if (!messagesBox || !selectedUser) return;

  const userId =
    selectedUser.id ??
    selectedUser.user_id;

  if (!userId) return;

  try {
    const data = await api(
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

    renderPrivateMessages(messages);

    markPrivateMessagesRead(userId);

  } catch (error) {
    console.error(
      "Private messages:",
      error
    );
  }
}


function renderPrivateMessages(messages) {
  if (!messagesBox) return;

  if (!messages.length) {
    messagesBox.innerHTML = `
      <div class="empty-chat">
        <div class="empty-chat-inner">
          <h2>Private Chat</h2>
          <p>No messages yet.</p>
        </div>
      </div>
    `;

    return;
  }

  const wasNearBottom =
    messagesBox.scrollHeight -
    messagesBox.scrollTop -
    messagesBox.clientHeight < 120;

  messagesBox.innerHTML = messages
    .map(renderPrivateMessage)
    .join("");

  if (wasNearBottom) {
    scrollToBottom(messagesBox);
  }
}


function renderPrivateMessage(message) {
  const sender =
    message?.user ||
    message?.sender ||
    {};

  const senderId =
    message?.sender_id ??
    message?.user_id ??
    sender?.id ??
    "";

  const text =
    message?.content ??
    message?.message ??
    message?.text ??
    "";

  const time =
    message?.created_at ||
    message?.createdAt ||
    message?.timestamp ||
    "";

  const mine =
    currentUser &&
    String(senderId) ===
      String(currentUser.id);

  return `
    <div
      class="private-message ${mine ? "mine" : ""}"
    >

      <div class="message-content">

        <div class="message-bubble">
          ${escapeHtml(text)}
        </div>

        <div class="message-time">
          ${escapeHtml(formatTime(time))}
        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   SEND PRIVATE MESSAGE
========================================================= */

if (messageForm) {
  messageForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!selectedUser) {
        toast("Select a user first.");
        return;
      }

      const input =
        messageInput;

      if (!input) return;

      const text =
        input.value.trim();

      if (!text) {
        input.focus();
        return;
      }

      const userId =
        selectedUser.id ??
        selectedUser.user_id;

      if (!userId) {
        toast("Invalid user.");
        return;
      }

      const submitBtn =
        messageForm.querySelector(
          'button[type="submit"]'
        );

      if (submitBtn) {
        submitBtn.disabled = true;
      }

      try {
        await api("/messages", {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            content: text,
            message: text,
            text: text
          })
        });

        input.value = "";

        await loadPrivateMessages();

        keepInputFocused(input);

      } catch (error) {
        toast(
          error?.message ||
          "Message could not be sent."
        );

      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    }
  );
}


/* =========================================================
   READ PRIVATE MESSAGES
========================================================= */

async function markPrivateMessagesRead(userId) {
  if (!userId) return;

  try {
    await api("/messages/read", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId
      })
    });
  } catch (error) {
    console.error(
      "Mark read:",
      error
    );
  }
}


/* =========================================================
   INBOX
========================================================= */

async function loadInbox() {
  if (!profilePanel) return;

  try {
    const data =
      await api("/messages/inbox");

    const items =
      Array.isArray(data)
        ? data
        : (
          data?.messages ||
          data?.inbox ||
          data?.items ||
          []
        );

    renderInbox(items);

  } catch (error) {
    console.error(
      "Inbox:",
      error
    );
  }
}


function renderInbox(items) {
  if (!profilePanel) return;

  let inbox =
    $("privateInbox");

  if (!inbox) {
    inbox =
      document.createElement("div");

    inbox.id =
      "privateInbox";

    inbox.className =
      "private-inbox";

    profilePanel.appendChild(inbox);
  }

  inbox.innerHTML = `
    <div class="private-inbox-title">
      Private Messages
    </div>

    <div
      id="privateUserList"
      class="private-user-list"
    >
      ${
        items.length
          ? items.map(renderInboxItem).join("")
          : `
            <div
              id="privateInboxEmpty"
              class="private-inbox-empty"
            >
              No private messages
            </div>
          `
      }
    </div>
  `;

  inbox
    .querySelectorAll(
      ".private-inbox-item"
    )
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const userId =
            item.dataset.userId;

          const username =
            item.dataset.username ||
            "User";

          const avatar =
            item.dataset.avatar ||
            "";

          if (!userId) return;

          openPrivateChat({
            id: userId,
            username,
            avatar_url: avatar
          });

          closeProfile();
        }
      );

    });
}


function renderInboxItem(item) {
  const user =
    item?.user ||
    item?.sender ||
    item?.other_user ||
    {};

  const userId =
    item?.user_id ??
    item?.sender_id ??
    item?.other_user_id ??
    user?.id ??
    "";

  const username =
    item?.username ||
    item?.sender_username ||
    user?.username ||
    user?.name ||
    "User";

  const avatar =
    getAvatarUrl(item) ||
    getAvatarUrl(user);

  const preview =
    item?.last_message ||
    item?.content ||
    item?.message ||
    "";

  const unread =
    Number(
      item?.unread_count ||
      item?.unread ||
      0
    );

  const time =
    item?.created_at ||
    item?.updated_at ||
    item?.timestamp ||
    "";

  const avatarHtml = avatar
    ? `
      <img
        src="${escapeHtml(avatar)}"
        alt=""
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      >
      <span
        style="display:none;"
        class="avatar-fallback"
      >
        ${escapeHtml(initials(username))}
      </span>
    `
    : `
      <span class="avatar-fallback">
        ${escapeHtml(initials(username))}
      </span>
    `;

  return `
    <button
      type="button"
      class="private-inbox-item"
      data-user-id="${escapeHtml(userId)}"
      data-username="${escapeHtml(username)}"
      data-avatar="${escapeHtml(avatar)}"
    >

      <div class="private-inbox-avatar">
        ${avatarHtml}
      </div>

      <div class="private-inbox-info">

        <div class="private-inbox-username">
          ${escapeHtml(username)}
        </div>

        <div class="private-inbox-preview">
          ${escapeHtml(preview)}
        </div>

      </div>

      <div class="private-inbox-right">

        ${
          unread > 0
            ? `
              <span class="private-inbox-badge">
                ${escapeHtml(unread)}
              </span>
            `
            : ""
        }

        <span class="private-inbox-time">
          ${escapeHtml(formatTime(time))}
        </span>

      </div>

    </button>
  `;
}


/* =========================================================
   PROFILE PANEL
========================================================= */

function openProfile() {
  if (!profilePanel) return;

  updateMyProfile();

  show(profilePanel);

  loadInbox();
}

function closeProfile() {
  hide(profilePanel);
}

if (myAvatarBtn) {
  myAvatarBtn.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      if (
        profilePanel &&
        !profilePanel.classList.contains("hidden")
      ) {
        closeProfile();
      } else {
        openProfile();
      }
    }
  );
}


/* =========================================================
   PROFILE PHOTO
========================================================= */

if (profilePhotoInput) {
  profilePhotoInput.addEventListener(
    "change",
    async () => {

      const file =
        profilePhotoInput.files?.[0];

      if (!file) return;

      try {

        const formData =
          new FormData();

        formData.append(
          "photo",
          file
        );

        const response =
          await fetch(
            API + "/profile/photo",
            {
              method: "POST",
              headers: token
                ? {
                    Authorization:
                      `Bearer ${token}`
                  }
                : {},
              body: formData
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
            data?.message ||
            "Upload failed."
          );
        }

        currentUser =
          data?.user ||
          data?.currentUser ||
          {
            ...currentUser,
            ...(data || {})
          };

        updateMyProfile();

        toast(
          "Profile photo updated."
        );

      } catch (error) {

        toast(
          error?.message ||
          "Profile photo upload failed."
        );

      } finally {
        profilePhotoInput.value = "";
      }
    }
  );
}


/* =========================================================
   REMOVE PROFILE PHOTO
========================================================= */

if (removeProfilePhoto) {
  removeProfilePhoto.addEventListener(
    "click",
    async () => {

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
          data?.currentUser ||
          {
            ...currentUser,
            avatar_url: null,
            avatarUrl: null,
            profile_photo: null,
            profile_photo_url: null,
            photo_url: null,
            photo: null
          };

        updateMyProfile();

        toast(
          "Profile photo removed."
        );

      } catch (error) {

        toast(
          error?.message ||
          "Could not remove photo."
        );

      }
    }
  );
}


/* =========================================================
   REFRESH BUTTONS
========================================================= */

if (reloadGroupMessages) {
  reloadGroupMessages.addEventListener(
    "click",
    async () => {
      await loadGroupMessages();
    }
  );
}

if (reloadMessages) {
  reloadMessages.addEventListener(
    "click",
    async () => {
      await loadPrivateMessages();
    }
  );
}


/* =========================================================
   TIMERS
========================================================= */

function startTimers() {
  stopTimers();

  groupMessageTimer =
    setInterval(
      () => {
        if (
          currentUser &&
          groupChat &&
          !groupChat.classList.contains("hidden")
        ) {
          loadGroupMessages();
        }
      },
      3000
    );

  inboxTimer =
    setInterval(
      () => {
        if (
          profilePanel &&
          !profilePanel.classList.contains("hidden")
        ) {
          loadInbox();
        }
      },
      3000
    );

  if (selectedUser) {
    startPrivateTimer();
  }
}


function startPrivateTimer() {
  stopPrivateTimer();

  if (!selectedUser) return;

  privateMessageTimer =
    setInterval(
      () => {
        if (
          selectedUser &&
          privateChat &&
          !privateChat.classList.contains("hidden")
        ) {
          loadPrivateMessages();
        }
      },
      3000
    );
}


function stopPrivateTimer() {
  if (privateMessageTimer) {
    clearInterval(
      privateMessageTimer
    );

    privateMessageTimer = null;
  }
}


function stopTimers() {
  if (groupMessageTimer) {
    clearInterval(
      groupMessageTimer
    );

    groupMessageTimer = null;
  }

  if (inboxTimer) {
    clearInterval(
      inboxTimer
    );

    inboxTimer = null;
  }

  stopPrivateTimer();
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom(element) {
  if (!element) return;

  requestAnimationFrame(() => {
    element.scrollTop =
      element.scrollHeight;
  });
}


/* =========================================================
   KEEP KEYBOARD INPUT
========================================================= */

function keepInputFocused(input) {
  if (!input) return;

  setTimeout(() => {

    try {
      input.focus({
        preventScroll: true
      });
    } catch {
      input.focus();
    }

  }, 80);
}


/* =========================================================
   MOBILE KEYBOARD / VISUAL VIEWPORT
========================================================= */

function updateKeyboardLayout() {
  const viewport =
    window.visualViewport;

  if (!viewport) return;

  const height =
    viewport.height;

  document.documentElement.style.setProperty(
    "--app-vh",
    `${height}px`
  );
}

if (window.visualViewport) {

  window.visualViewport.addEventListener(
    "resize",
    updateKeyboardLayout
  );

  window.visualViewport.addEventListener(
    "scroll",
    updateKeyboardLayout
  );
}

window.addEventListener(
  "resize",
  updateKeyboardLayout
);


/* =========================================================
   CLOSE PROFILE WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (!profilePanel) return;

    if (
      profilePanel.classList.contains("hidden")
    ) {
      return;
    }

    if (
      profilePanel.contains(event.target) ||
      myAvatarBtn?.contains(event.target)
    ) {
      return;
    }

    closeProfile();
  }
);


/* =========================================================
   STARTUP
========================================================= */

async function startApp() {

  updateKeyboardLayout();

  if (!token) {
    openLogin();
    return;
  }

  try {

    currentUser =
      await getCurrentUser();

    await enterChat();

  } catch (error) {

    console.error(
      "Session restore:",
      error
    );

    token = "";

    localStorage.removeItem(
      "dark_chat_token"
    );

    currentUser = null;

    openLogin();
  }
}


startApp();
