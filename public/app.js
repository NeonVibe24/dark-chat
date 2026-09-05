const API = "/api";

/* ============================================================
   VIDEOLINK2ME FIXED ROOM
============================================================ */

const VIDEOLINK2ME_ROOM = "https://videolink2me.com/zm1nec";

/* ============================================================
   APP STATE
============================================================ */

let currentUser = null;
let selectedUser = null;
let messageTimer = null;

/* ============================================================
   HELPERS
============================================================ */

function getToken() {
    return localStorage.getItem("token") || "";
}

async function api(url, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API + url, {
        ...options,
        headers
    });

    let data = null;

    try {
        data = await response.json();
    } catch (e) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
    }

    return data;
}

function showToast(message) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";

        toast.style.position = "fixed";
        toast.style.left = "50%";
        toast.style.bottom = "25px";
        toast.style.transform = "translateX(-50%)";
        toast.style.padding = "12px 18px";
        toast.style.background = "#222";
        toast.style.color = "#fff";
        toast.style.borderRadius = "12px";
        toast.style.zIndex = "999999";
        toast.style.fontSize = "14px";
        toast.style.maxWidth = "90%";
        toast.style.textAlign = "center";

        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        toast.style.display = "none";
    }, 2500);
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

function formatTime(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function avatar(user) {
    if (!user) return "";

    if (user.avatar) {
        return user.avatar;
    }

    const name = user.username || user.name || "?";

    return name.charAt(0).toUpperCase();
}

/* ============================================================
   ELEMENTS
============================================================ */

const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const usernameInput = document.getElementById("loginUsername");
const passwordInput = document.getElementById("loginPassword");

const registerUsernameInput =
    document.getElementById("registerUsername");

const registerPasswordInput =
    document.getElementById("registerPassword");

const usersList = document.getElementById("usersList");
const messagesContainer = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

const selectedUserName =
    document.getElementById("selectedUserName");

const selectedUserAvatar =
    document.getElementById("selectedUserAvatar");

const voiceCallBtn =
    document.getElementById("voiceCallBtn");

const videoCallBtn =
    document.getElementById("videoCallBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

/* ============================================================
   AUTH SCREEN
============================================================ */

function showLogin() {
    if (loginScreen) loginScreen.style.display = "";
    if (registerScreen) registerScreen.style.display = "none";
    if (chatScreen) chatScreen.style.display = "none";
}

function showRegister() {
    if (loginScreen) loginScreen.style.display = "none";
    if (registerScreen) registerScreen.style.display = "";
    if (chatScreen) chatScreen.style.display = "none";
}

function showChat() {
    if (loginScreen) loginScreen.style.display = "none";
    if (registerScreen) registerScreen.style.display = "none";
    if (chatScreen) chatScreen.style.display = "";
}

/* ============================================================
   LOGIN
============================================================ */

async function login(username, password) {
    try {
        const data = await api("/login", {
            method: "POST",
            body: JSON.stringify({
                username,
                password
            })
        });

        if (data.token) {
            localStorage.setItem("token", data.token);
        }

        currentUser = data.user || data;

        await openChatApp();

    } catch (error) {
        showToast(error.message || "Login failed");
    }
}

/* ============================================================
   REGISTER
============================================================ */

async function register(username, password) {
    try {
        const data = await api("/register", {
            method: "POST",
            body: JSON.stringify({
                username,
                password
            })
        });

        if (data.token) {
            localStorage.setItem("token", data.token);
        }

        currentUser = data.user || data;

        await openChatApp();

    } catch (error) {
        showToast(error.message || "Registration failed");
    }
}

/* ============================================================
   START APP
============================================================ */

async function startApp() {
    const token = getToken();

    if (!token) {
        showLogin();
        return;
    }

    try {
        const data = await api("/me");

        currentUser = data.user || data;

        await openChatApp();

    } catch (error) {
        localStorage.removeItem("token");
        currentUser = null;
        showLogin();
    }
}

/* ============================================================
   OPEN CHAT
============================================================ */

async function openChatApp() {
    showChat();

    await loadUsers();

    if (selectedUser) {
        await loadMessages();
    }

    startMessagePolling();
}

/* ============================================================
   USERS
============================================================ */

async function loadUsers() {
    try {
        const data = await api("/users");

        const users = Array.isArray(data)
            ? data
            : data.users || [];

        renderUsers(users);

    } catch (error) {
        showToast(error.message || "Failed to load users");
    }
}

function renderUsers(users) {
    if (!usersList) return;

    usersList.innerHTML = "";

    users.forEach(user => {

        if (
            currentUser &&
            user.id === currentUser.id
        ) {
            return;
        }

        const item = document.createElement("div");

        item.className = "user-item";

        if (
            selectedUser &&
            selectedUser.id === user.id
        ) {
            item.classList.add("active");
        }

        const avatarValue = avatar(user);

        item.innerHTML = `
            <div class="user-avatar">
                ${
                    avatarValue &&
                    String(avatarValue).startsWith("data:")
                        ? `<img src="${escapeHTML(avatarValue)}">`
                        : escapeHTML(avatarValue)
                }
            </div>

            <div class="user-info">
                <div class="user-name">
                    ${escapeHTML(user.username || user.name || "")}
                </div>
            </div>
        `;

        item.addEventListener("click", async () => {
            selectedUser = user;

            updateSelectedUserHeader();

            renderUsers(users);

            await loadMessages();
        });

        usersList.appendChild(item);
    });
}

/* ============================================================
   SELECTED USER
============================================================ */

function updateSelectedUserHeader() {
    if (!selectedUser) return;

    if (selectedUserName) {
        selectedUserName.textContent =
            selectedUser.username ||
            selectedUser.name ||
            "";
    }

    if (selectedUserAvatar) {
        const value = avatar(selectedUser);

        if (value && String(value).startsWith("data:")) {
            selectedUserAvatar.innerHTML =
                `<img src="${escapeHTML(value)}">`;
        } else {
            selectedUserAvatar.textContent = value;
        }
    }
}

/* ============================================================
   MESSAGES
============================================================ */

async function loadMessages() {
    if (!selectedUser) return;

    try {
        const data = await api(
            `/messages/${encodeURIComponent(selectedUser.id)}`
        );

        const messages = Array.isArray(data)
            ? data
            : data.messages || [];

        renderMessages(messages);

    } catch (error) {
        showToast(error.message || "Failed to load messages");
    }
}

/* ============================================================
   CALL MESSAGE FORMAT
============================================================ */

const CALL_PREFIX = "__PRIVATE_CHAT_CALL__";

function createCallMessage(type) {
    return (
        CALL_PREFIX +
        JSON.stringify({
            type: type,
            url: VIDEOLINK2ME_ROOM
        })
    );
}

function parseCallMessage(text) {
    if (
        typeof text !== "string" ||
        !text.startsWith(CALL_PREFIX)
    ) {
        return null;
    }

    try {
        const data = JSON.parse(
            text.substring(CALL_PREFIX.length)
        );

        if (!data || !data.url) {
            return null;
        }

        return data;

    } catch (error) {
        return null;
    }
}

/* ============================================================
   RENDER MESSAGES
============================================================ */

function renderMessages(messages) {
    if (!messagesContainer) return;

    messagesContainer.innerHTML = "";

    messages.forEach(message => {

        const wrapper = document.createElement("div");

        const senderId =
            message.sender_id ??
            message.senderId ??
            message.user_id;

        const isMine =
            currentUser &&
            String(senderId) === String(currentUser.id);

        wrapper.className =
            "message " +
            (isMine ? "sent" : "received");

        const messageText =
            message.message ??
            message.text ??
            "";

        const callData =
            parseCallMessage(messageText);

        if (callData) {

            const type =
                callData.type === "voice"
                    ? "Voice Call"
                    : "Video Call";

            wrapper.innerHTML = `
                <div class="call-message-card">

                    <div class="call-message-icon">
                        ${callData.type === "voice" ? "📞" : "📹"}
                    </div>

                    <div class="call-message-content">

                        <div class="call-message-title">
                            ${type}
                        </div>

                        <div class="call-message-service">
                            Videolink2me
                        </div>

                        <div class="call-message-link">
                            ${escapeHTML(callData.url)}
                        </div>

                        <button
                            type="button"
                            class="join-call-btn"
                            data-call-url="${escapeHTML(callData.url)}"
                        >
                            Join Call
                        </button>

                    </div>

                </div>
            `;

            const joinButton =
                wrapper.querySelector(".join-call-btn");

            if (joinButton) {
                joinButton.addEventListener("click", () => {
                    openCallLink(callData.url);
                });
            }

        } else {

            wrapper.innerHTML = `
                <div class="message-bubble">
                    ${escapeHTML(messageText)}
                </div>

                <div class="message-time">
                    ${formatTime(
                        message.created_at ||
                        message.createdAt ||
                        message.timestamp
                    )}
                </div>
            `;
        }

        messagesContainer.appendChild(wrapper);
    });

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}

/* ============================================================
   SEND MESSAGE
============================================================ */

async function sendMessage() {
    if (!selectedUser) {
        showToast("Select a user first");
        return;
    }

    const text =
        messageInput?.value?.trim() || "";

    if (!text) return;

    try {

        await api("/messages", {
            method: "POST",
            body: JSON.stringify({
                receiver_id: selectedUser.id,
                message: text
            })
        });

        if (messageInput) {
            messageInput.value = "";
        }

        await loadMessages();

    } catch (error) {
        showToast(error.message || "Failed to send message");
    }
}

/* ============================================================
   SEND CALL LINK
============================================================ */

async function sendCallLink(type) {
    if (!selectedUser) {
        showToast("Select a user first");
        return;
    }

    try {

        await api("/messages", {
            method: "POST",
            body: JSON.stringify({
                receiver_id: selectedUser.id,
                message: createCallMessage(type)
            })
        });

        await loadMessages();

        showToast(
            type === "voice"
                ? "Voice call link sent"
                : "Video call link sent"
        );

    } catch (error) {
        showToast(
            error.message ||
            "Failed to send call link"
        );
    }
}

/* ============================================================
   OPEN FIXED VIDEOLINK2ME ROOM
============================================================ */

function openCallLink(url) {

    if (!url) {
        showToast("Call link is missing");
        return;
    }

    let parsed;

    try {
        parsed = new URL(url);
    } catch (error) {
        showToast("Invalid call link");
        return;
    }

    if (
        parsed.protocol !== "https:" ||
        !(
            parsed.hostname === "videolink2me.com" ||
            parsed.hostname.endsWith(".videolink2me.com")
        )
    ) {
        showToast("Invalid Videolink2me link");
        return;
    }

    /*
     * Open directly in the current WebView.
     *
     * This is intentional:
     * Android WebView can load the room directly,
     * provided the native WebView grants camera/microphone
     * permission requests.
     */

    window.location.href = url;
}

/* ============================================================
   CALL DIALOG
============================================================ */

function showCallDialog(type) {

    const old =
        document.getElementById("callLinkDialog");

    if (old) old.remove();

    const overlay =
        document.createElement("div");

    overlay.id = "callLinkDialog";

    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,.72)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "20px";
    overlay.style.zIndex = "999999";

    const card =
        document.createElement("div");

    card.style.width = "100%";
    card.style.maxWidth = "420px";
    card.style.background = "#161616";
    card.style.color = "#fff";
    card.style.borderRadius = "20px";
    card.style.padding = "24px";
    card.style.boxSizing = "border-box";

    const title =
        type === "voice"
            ? "Voice Call"
            : "Video Call";

    card.innerHTML = `
        <div style="
            font-size:22px;
            font-weight:700;
            margin-bottom:10px;
        ">
            ${title}
        </div>

        <div style="
            font-size:14px;
            line-height:1.6;
            color:#aaa;
            margin-bottom:18px;
        ">
            Videolink2me room ကို အသုံးပြုပါမယ်။
            အောက်က Join Call ကိုနှိပ်ပြီး
            room ထဲဝင်ပါ။
        </div>

        <div style="
            background:#222;
            border-radius:12px;
            padding:12px;
            font-size:13px;
            word-break:break-all;
            margin-bottom:18px;
        ">
            ${escapeHTML(VIDEOLINK2ME_ROOM)}
        </div>

        <button
            id="openFixedRoomBtn"
            style="
                width:100%;
                border:0;
                border-radius:12px;
                padding:14px;
                background:#5865f2;
                color:#fff;
                font-size:15px;
                font-weight:700;
                margin-bottom:10px;
            "
        >
            Join Call
        </button>

        <button
            id="sendFixedRoomBtn"
            style="
                width:100%;
                border:0;
                border-radius:12px;
                padding:14px;
                background:#252525;
                color:#fff;
                font-size:15px;
                font-weight:700;
                margin-bottom:10px;
            "
        >
            Send Room Link
        </button>

        <button
            id="cancelCallDialogBtn"
            style="
                width:100%;
                border:0;
                border-radius:12px;
                padding:12px;
                background:transparent;
                color:#aaa;
                font-size:14px;
            "
        >
            Cancel
        </button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document
        .getElementById("openFixedRoomBtn")
        ?.addEventListener("click", () => {

            overlay.remove();

            openCallLink(VIDEOLINK2ME_ROOM);
        });

    document
        .getElementById("sendFixedRoomBtn")
        ?.addEventListener("click", async () => {

            if (!selectedUser) {
                showToast("Select a user first");
                return;
            }

            overlay.remove();

            await sendCallLink(type);
        });

    document
        .getElementById("cancelCallDialogBtn")
        ?.addEventListener("click", () => {
            overlay.remove();
        });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
}

/* ============================================================
   START CALL
============================================================ */

function startCall(type) {

    if (!selectedUser) {
        showToast("Select a user first");
        return;
    }

    showCallDialog(type);
}

/* ============================================================
   MESSAGE POLLING
============================================================ */

function startMessagePolling() {

    clearInterval(messageTimer);

    messageTimer = setInterval(() => {

        if (
            currentUser &&
            selectedUser
        ) {
            loadMessages();
        }

    }, 3000);
}

function stopMessagePolling() {
    clearInterval(messageTimer);
    messageTimer = null;
}

/* ============================================================
   LOGOUT
============================================================ */

function logout() {

    stopMessagePolling();

    localStorage.removeItem("token");

    currentUser = null;
    selectedUser = null;

    showLogin();
}

/* ============================================================
   EVENT LISTENERS
============================================================ */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const username =
                usernameInput?.value?.trim() || "";

            const password =
                passwordInput?.value || "";

            if (!username || !password) {
                showToast(
                    "Username and password are required"
                );
                return;
            }

            await login(username, password);
        }
    );
}

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const username =
                registerUsernameInput?.value?.trim() || "";

            const password =
                registerPasswordInput?.value || "";

            if (!username || !password) {
                showToast(
                    "Username and password are required"
                );
                return;
            }

            await register(
                username,
                password
            );
        }
    );
}

/* ============================================================
   SEND BUTTON
============================================================ */

if (sendMessageBtn) {
    sendMessageBtn.addEventListener(
        "click",
        sendMessage
    );
}

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();
                sendMessage();
            }
        }
    );
}

/* ============================================================
   CALL BUTTONS
============================================================ */

if (voiceCallBtn) {

    voiceCallBtn.addEventListener(
        "click",
        event => {
            event.preventDefault();
            startCall("voice");
        }
    );
}

if (videoCallBtn) {

    videoCallBtn.addEventListener(
        "click",
        event => {
            event.preventDefault();
            startCall("video");
        }
    );
}

/* ============================================================
   LOGOUT
============================================================ */

if (logoutBtn) {
    logoutBtn.addEventListener(
        "click",
        logout
    );
}

/* ============================================================
   BACK BUTTON SUPPORT
============================================================ */

document.addEventListener(
    "click",
    event => {

        const backButton =
            event.target.closest(
                "#backBtn, .back-btn, [data-action='back']"
            );

        if (!backButton) return;

        if (selectedUser) {
            selectedUser = null;

            if (selectedUserName) {
                selectedUserName.textContent = "";
            }

            if (messagesContainer) {
                messagesContainer.innerHTML = "";
            }

            return;
        }
    }
);

/* ============================================================
   REFRESH USERS
============================================================ */

document.addEventListener(
    "click",
    event => {

        const refreshButton =
            event.target.closest(
                "#refreshUsersBtn, .refresh-users-btn"
            );

        if (!refreshButton) return;

        loadUsers();
    }
);

/* ============================================================
   START
============================================================ */

startApp();
