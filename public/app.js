const API = "/api";

/* ============================================================
   GLOBAL STATE
============================================================ */

let currentUser = null;
let selectedUser = null;

let messageTimer = null;


/* ============================================================
   VIDEO LINK SETTINGS
============================================================ */

const VIDEOLINK2ME_START =
    "https://videolink2me.com/start";

const VIDEOLINK2ME_HOST =
    "videolink2me.com";

let currentVideoRoom = null;


/* ============================================================
   DOM HELPERS
============================================================ */

function $(id){
    return document.getElementById(id);
}


function show(id){
    const el = $(id);
    if(el) el.classList.remove("hidden");
}


function hide(id){
    const el = $(id);
    if(el) el.classList.add("hidden");
}


function text(id,value){
    const el = $(id);
    if(el) el.textContent = value ?? "";
}


function escapeHtml(value){
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


function initials(name){
    const s = String(name || "U").trim();

    if(!s) return "U";

    return s
        .split(/\s+/)
        .slice(0,2)
        .map(x => x.charAt(0).toUpperCase())
        .join("");
}


function showToast(message){
    const el = $("toast");

    if(!el) return;

    el.textContent = message;

    el.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        el.classList.remove("show");
    },3000);
}


/* ============================================================
   API
============================================================ */

async function apiRequest(
    url,
    options = {}
){

    const config = {
        credentials:"include",
        ...options,
        headers:{
            "Content-Type":"application/json",
            ...(options.headers || {})
        }
    };

    const response =
        await fetch(
            API + url,
            config
        );

    let data = null;

    try{
        data = await response.json();
    }catch{
        data = {};
    }

    if(!response.ok){

        throw new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status})`
        );

    }

    return data;
}


/* ============================================================
   AUTH
============================================================ */

async function login(
    email,
    password
){

    return await apiRequest(
        "/login",
        {
            method:"POST",
            body:JSON.stringify({
                email,
                password
            })
        }
    );

}


async function register(
    username,
    email,
    password
){

    return await apiRequest(
        "/register",
        {
            method:"POST",
            body:JSON.stringify({
                username,
                email,
                password
            })
        }
    );

}


async function logout(){

    try{

        await apiRequest(
            "/logout",
            {
                method:"POST"
            }
        );

    }catch(e){}

    currentUser = null;
    selectedUser = null;

    stopMessagePolling();

    hide("chatScreen");
    show("authScreen");

    $("loginPassword").value = "";

}


/* ============================================================
   LOAD CURRENT USER
============================================================ */

async function loadCurrentUser(){

    try{

        const data =
            await apiRequest("/me");

        currentUser =
            data.user ||
            data;

        if(!currentUser){

            throw new Error(
                "Not authenticated"
            );

        }

        renderCurrentUser();

        show("chatScreen");
        hide("authScreen");

        await loadUsers();

        startMessagePolling();

    }catch(e){

        currentUser = null;

        hide("chatScreen");
        show("authScreen");

    }

}


function renderCurrentUser(){

    if(!currentUser) return;

    text(
        "myUsername",
        currentUser.username ||
        currentUser.name ||
        "User"
    );

    const avatar =
        $("myAvatar");

    if(avatar){

        if(currentUser.avatar ||
           currentUser.profile_photo){

            avatar.innerHTML =
                `<img src="${
                    escapeHtml(
                        currentUser.avatar ||
                        currentUser.profile_photo
                    )
                }" alt="">`;

        }else{

            avatar.textContent =
                initials(
                    currentUser.username ||
                    currentUser.name
                );

        }

    }

    renderProfile();

}


/* ============================================================
   USERS
============================================================ */

async function loadUsers(){

    const list =
        $("usersList");

    if(!list) return;

    list.innerHTML =
        `<div class="loading">
            Loading users...
        </div>`;

    try{

        const data =
            await apiRequest("/users");

        const users =
            Array.isArray(data)
                ? data
                : (
                    data.users ||
                    data.data ||
                    []
                );

        const filtered =
            users.filter(
                user =>
                    String(
                        user.id
                    ) !== String(
                        currentUser?.id
                    )
            );

        if(!filtered.length){

            list.innerHTML =
                `<div class="loading">
                    No users found
                </div>`;

            return;
        }

        list.innerHTML =
            filtered
            .map(renderUser)
            .join("");

    }catch(e){

        list.innerHTML =
            `<div class="loading">
                Unable to load users
            </div>`;

    }

}


function renderUser(user){

    const id =
        escapeHtml(user.id);

    const name =
        escapeHtml(
            user.username ||
            user.name ||
            "User"
        );

    const avatar =
        user.avatar ||
        user.profile_photo ||
        user.photo ||
        "";

    let avatarHtml;

    if(avatar){

        avatarHtml =
            `<img
                src="${escapeHtml(avatar)}"
                alt=""
            >`;

    }else{

        avatarHtml =
            escapeHtml(
                initials(
                    user.username ||
                    user.name
                )
            );

    }

    return `
        <button
            class="user-item ${
                selectedUser &&
                String(selectedUser.id) === String(user.id)
                    ? "active"
                    : ""
            }"
            data-user-id="${id}"
            type="button"
        >

            <div class="avatar">
                ${avatarHtml}
            </div>

            <div class="user-item-info">

                <strong>
                    ${name}
                </strong>

                <span>
                    ${user.online ? "Online" : "Offline"}
                </span>

            </div>

        </button>
    `;

}


async function selectUser(user){

    if(!user) return;

    selectedUser = user;

    hide("emptyChat");
    show("activeChat");

    text(
        "chatUsername",
        user.username ||
        user.name ||
        "User"
    );

    text(
        "chatStatus",
        user.online
            ? "Online"
            : "Offline"
    );

    renderChatAvatar(user);

    await loadMessages();

    refreshUserListActiveState();

}


function renderChatAvatar(user){

    const el =
        $("chatAvatar");

    if(!el) return;

    const avatar =
        user.avatar ||
        user.profile_photo ||
        user.photo ||
        "";

    if(avatar){

        el.innerHTML =
            `<img
                src="${escapeHtml(avatar)}"
                alt=""
            >`;

    }else{

        el.textContent =
            initials(
                user.username ||
                user.name
            );

    }

}


function refreshUserListActiveState(){

    document
        .querySelectorAll(
            ".user-item"
        )
        .forEach(item => {

            item.classList.toggle(
                "active",
                selectedUser &&
                String(
                    item.dataset.userId
                ) ===
                String(selectedUser.id)
            );

        });

}


/* ============================================================
   USER LOOKUP
============================================================ */

async function getUserById(id){

    const data =
        await apiRequest(
            "/users"
        );

    const users =
        Array.isArray(data)
            ? data
            : (
                data.users ||
                data.data ||
                []
            );

    return users.find(
        user =>
            String(user.id) === String(id)
    );

}


/* ============================================================
   MESSAGES
============================================================ */

async function loadMessages(){

    if(!selectedUser) return;

    const box =
        $("messages");

    if(!box) return;

    try{

        const data =
            await apiRequest(
                `/messages?user_id=${
                    encodeURIComponent(
                        selectedUser.id
                    )
                }`
            );

        const messages =
            Array.isArray(data)
                ? data
                : (
                    data.messages ||
                    data.data ||
                    []
                );

        renderMessages(messages);

    }catch(e){

        box.innerHTML =
            `<div class="loading">
                Unable to load messages
            </div>`;

    }

}


function renderMessages(messages){

    const box =
        $("messages");

    if(!box) return;

    const wasBottom =
        box.scrollHeight -
        box.scrollTop -
        box.clientHeight <
        80;

    box.innerHTML =
        messages
        .map(renderMessage)
        .join("");

    if(wasBottom){

        box.scrollTop =
            box.scrollHeight;

    }

}


function renderMessage(message){

    const senderId =
        message.sender_id ??
        message.senderId ??
        message.from_id;

    const mine =
        String(senderId) ===
        String(currentUser?.id);

    const body =
        String(
            message.message ??
            message.text ??
            ""
        );

    const time =
        message.created_at ||
        message.createdAt ||
        "";

    const link =
        extractVideolink(body);

    let content = escapeHtml(body);

    if(link){

        content = `
            <div class="video-link-message">

                <div>
                    🎥 Video Call
                </div>

                <button
                    type="button"
                    class="join-video-link"
                    data-video-url="${escapeHtml(link)}"
                >
                    Join Call
                </button>

            </div>
        `;

    }

    return `
        <div class="message-row ${
            mine ? "mine" : "theirs"
        }">

            <div class="message-bubble">

                ${content}

                ${
                    time
                        ? `<small>${escapeHtml(formatTime(time))}</small>`
                        : ""
                }

            </div>

        </div>
    `;

}


function formatTime(value){

    try{

        const date =
            new Date(value);

        if(Number.isNaN(date.getTime()))
            return "";

        return date.toLocaleTimeString(
            [],
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    }catch{

        return "";

    }

}


async function sendMessage(message){

    if(!selectedUser) return;

    const value =
        String(message || "").trim();

    if(!value) return;

    await apiRequest(
        "/messages",
        {
            method:"POST",
            body:JSON.stringify({
                receiver_id:
                    selectedUser.id,

                message:value
            })
        }
    );

    await loadMessages();

}


/* ============================================================
   MESSAGE POLLING
============================================================ */

function startMessagePolling(){

    stopMessagePolling();

    messageTimer =
        setInterval(
            async () => {

                if(
                    currentUser &&
                    selectedUser &&
                    !document.hidden
                ){

                    await loadMessages();

                }

            },
            3000
        );

}


function stopMessagePolling(){

    if(messageTimer){

        clearInterval(
            messageTimer
        );

        messageTimer = null;

    }

}


/* ============================================================
   VIDEO LINK DETECTION
============================================================ */

function extractVideolink(message){

    const text =
        String(message || "");

    const match =
        text.match(
            /https?:\/\/(?:www\.)?videolink2me\.com\/[^\s<>"']+/i
        );

    if(!match) return null;

    return match[0].replace(
        /[),.!?]+$/,
        ""
    );

}


function isValidVideolink(url){

    try{

        const parsed =
            new URL(url);

        return (
            parsed.protocol === "https:" &&
            (
                parsed.hostname ===
                    VIDEOLINK2ME_HOST ||
                parsed.hostname ===
                    "www." + VIDEOLINK2ME_HOST
            )
        );

    }catch{

        return false;

    }

}


/* ============================================================
   VIDEO CALL UI
============================================================ */

function openVideoLinkPanel(){

    if(!selectedUser){

        showToast(
            "Select a user first"
        );

        return;

    }

    const input =
        $("videoRoomLinkInput");

    if(input){

        input.value = "";

    }

    show("videoLinkPanel");

}


function closeVideoLinkPanel(){

    hide("videoLinkPanel");

}


function openVideolinkStart(){

    /*
     * This opens the official room creation page.
     *
     * The service creates the room after the user
     * presses Start video call.
     */

    openExternalOrSameWindow(
        VIDEOLINK2ME_START
    );

}


/* ============================================================
   OPEN VIDEO ROOM
============================================================ */

function openVideoRoom(url){

    if(!isValidVideolink(url)){

        showToast(
            "Invalid Videolink2me link"
        );

        return;

    }

    currentVideoRoom = url;

    show("callScreen");

    const container =
        $("videolinkContainer");

    const frame =
        $("videolinkFrame");

    if(container)
        container.style.display = "block";

    if(frame){

        frame.src = url;

    }

    text(
        "callUserName",
        selectedUser?.username ||
        selectedUser?.name ||
        "Video Call"
    );

    text(
        "callDuration",
        "Videolink2me"
    );

    /*
     * Iframe may be blocked by Videolink2me's
     * security headers. If that happens, fall back
     * to navigating the WebView directly.
     */

    setTimeout(() => {

        if(
            frame &&
            frame.contentWindow
        ){

            /*
             * Cross-origin pages cannot be inspected,
             * so we do not attempt DOM access.
             */

        }

    },1500);

}


function closeVideoRoom(){

    const frame =
        $("videolinkFrame");

    if(frame){

        frame.src =
            "about:blank";

    }

    const container =
        $("videolinkContainer");

    if(container){

        container.style.display =
            "none";

    }

    currentVideoRoom = null;

    hide("callScreen");

}


/* ============================================================
   EXTERNAL / WEBVIEW NAVIGATION
============================================================ */

function openExternalOrSameWindow(url){

    try{

        /*
         * In Android WebView this normally remains
         * inside the WebView when the WebViewClient
         * allows navigation.
         */

        window.location.href = url;

    }catch(e){

        window.open(
            url,
            "_blank"
        );

    }

}


/* ============================================================
   VIDEO LINK SEND
============================================================ */

async function sendVideoRoomLink(){

    if(!selectedUser){

        showToast(
            "Select a user first"
        );

        return;

    }

    const input =
        $("videoRoomLinkInput");

    const url =
        String(
            input?.value || ""
        ).trim();

    if(!isValidVideolink(url)){

        showToast(
            "Enter a valid Videolink2me room link"
        );

        return;

    }

    try{

        await sendMessage(url);

        closeVideoLinkPanel();

        showToast(
            "Video call link sent"
        );

        openVideoRoom(url);

    }catch(e){

        showToast(
            e.message ||
            "Unable to send video link"
        );

    }

}


/* ============================================================
   VOICE CALL
============================================================ */

function startVoiceCall(){

    /*
     * Videolink2me is primarily being used here
     * as the hosted video-call engine.
     *
     * Voice call button therefore opens the same
     * room flow rather than starting the old
     * custom WebRTC implementation.
     */

    if(!selectedUser){

        showToast(
            "Select a user first"
        );

        return;

    }

    openVideoLinkPanel();

}


/* ============================================================
   PROFILE
============================================================ */

function renderProfile(){

    if(!currentUser) return;

    text(
        "profilePanelName",
        currentUser.username ||
        currentUser.name ||
        "User"
    );

    text(
        "profilePanelEmail",
        currentUser.email ||
        "user@email.com"
    );

    const large =
        $("profilePhotoLarge");

    if(!large) return;

    const avatar =
        currentUser.avatar ||
        currentUser.profile_photo ||
        currentUser.photo ||
        "";

    if(avatar){

        large.innerHTML =
            `<img
                src="${escapeHtml(avatar)}"
                alt=""
            >`;

    }else{

        large.textContent =
            initials(
                currentUser.username ||
                currentUser.name
            );

    }

}


function openProfile(){

    renderProfile();

    show("profilePanel");

}


function closeProfile(){

    hide("profilePanel");

}


/* ============================================================
   PROFILE PHOTO
============================================================ */

async function uploadProfilePhoto(file){

    if(!file) return;

    /*
     * Uses multipart/form-data so the server can
     * receive the original image.
     */

    const form =
        new FormData();

    form.append(
        "photo",
        file
    );

    try{

        const response =
            await fetch(
                API + "/profile/photo",
                {
                    method:"POST",
                    credentials:"include",
                    body:form
                }
            );

        const data =
            await response.json();

        if(!response.ok){

            throw new Error(
                data.error ||
                "Photo upload failed"
            );

        }

        currentUser =
            data.user ||
            currentUser;

        renderCurrentUser();

        showToast(
            "Profile photo updated"
        );

    }catch(e){

        showToast(
            e.message ||
            "Unable to upload photo"
        );

    }

}


async function removeProfilePhoto(){

    try{

        const data =
            await apiRequest(
                "/profile/photo",
                {
                    method:"DELETE"
                }
            );

        currentUser =
            data.user ||
            currentUser;

        renderCurrentUser();

        showToast(
            "Profile photo removed"
        );

    }catch(e){

        showToast(
            e.message ||
            "Unable to remove photo"
        );

    }

}


/* ============================================================
   EVENT LISTENERS
============================================================ */

function setupEvents(){


    /* --------------------------------------------------------
       LOGIN
    -------------------------------------------------------- */

    $("loginForm")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const email =
                    $("loginEmail").value.trim();

                const password =
                    $("loginPassword").value;

                const error =
                    $("loginError");

                if(error)
                    error.textContent = "";

                try{

                    await login(
                        email,
                        password
                    );

                    await loadCurrentUser();

                }catch(e){

                    if(error){

                        error.textContent =
                            e.message ||
                            "Login failed";

                    }

                }

            }
        );


    /* --------------------------------------------------------
       REGISTER
    -------------------------------------------------------- */

    $("registerForm")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const username =
                    $("registerUsername")
                        .value
                        .trim();

                const email =
                    $("registerEmail")
                        .value
                        .trim();

                const password =
                    $("registerPassword")
                        .value;

                const error =
                    $("registerError");

                if(error)
                    error.textContent = "";

                try{

                    await register(
                        username,
                        email,
                        password
                    );

                    await login(
                        email,
                        password
                    );

                    await loadCurrentUser();

                }catch(e){

                    if(error){

                        error.textContent =
                            e.message ||
                            "Registration failed";

                    }

                }

            }
        );


    /* --------------------------------------------------------
       LOGIN / REGISTER SWITCH
    -------------------------------------------------------- */

    $("showRegister")
        ?.addEventListener(
            "click",
            () => {

                hide("loginForm");
                show("registerForm");

            }
        );


    $("showLogin")
        ?.addEventListener(
            "click",
            () => {

                hide("registerForm");
                show("loginForm");

            }
        );


    /* --------------------------------------------------------
       LOGOUT
    -------------------------------------------------------- */

    $("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    /* --------------------------------------------------------
       REFRESH USERS
    -------------------------------------------------------- */

    $("refreshUsers")
        ?.addEventListener(
            "click",
            loadUsers
        );


    $("reloadMessages")
        ?.addEventListener(
            "click",
            loadMessages
        );


    /* --------------------------------------------------------
       USER LIST
    -------------------------------------------------------- */

    $("usersList")
        ?.addEventListener(
            "click",
            async event => {

                const item =
                    event.target.closest(
                        ".user-item"
                    );

                if(!item) return;

                const id =
                    item.dataset.userId;

                try{

                    const user =
                        await getUserById(id);

                    if(user){

                        await selectUser(
                            user
                        );

                    }

                }catch(e){

                    showToast(
                        "Unable to open conversation"
                    );

                }

            }
        );


    /* --------------------------------------------------------
       SEND MESSAGE
    -------------------------------------------------------- */

    $("messageForm")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const input =
                    $("messageInput");

                const value =
                    input.value.trim();

                if(!value) return;

                try{

                    input.value = "";

                    await sendMessage(
                        value
                    );

                }catch(e){

                    input.value = value;

                    showToast(
                        e.message ||
                        "Unable to send message"
                    );

                }

            }
        );


    /* --------------------------------------------------------
       VIDEO CALL
    -------------------------------------------------------- */

    $("videoCallBtn")
        ?.addEventListener(
            "click",
            openVideoLinkPanel
        );


    /* --------------------------------------------------------
       VOICE CALL
    -------------------------------------------------------- */

    $("voiceCallBtn")
        ?.addEventListener(
            "click",
            startVoiceCall
        );


    /* --------------------------------------------------------
       VIDEO LINK PANEL
    -------------------------------------------------------- */

    $("cancelVideoLinkBtn")
        ?.addEventListener(
            "click",
            closeVideoLinkPanel
        );


    $("openVideolinkStartBtn")
        ?.addEventListener(
            "click",
            openVideolinkStart
        );


    $("sendVideoLinkBtn")
        ?.addEventListener(
            "click",
            sendVideoRoomLink
        );


    /* --------------------------------------------------------
       JOIN VIDEO LINK FROM MESSAGE
    -------------------------------------------------------- */

    $("messages")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".join-video-link"
                    );

                if(!button) return;

                const url =
                    button.dataset.videoUrl;

                if(
                    isValidVideolink(url)
                ){

                    openVideoRoom(url);

                }

            }
        );


    /* --------------------------------------------------------
       PROFILE
    -------------------------------------------------------- */

    $("myAvatarBtn")
        ?.addEventListener(
            "click",
            openProfile
        );


    $("closeProfilePanel")
        ?.addEventListener(
            "click",
            closeProfile
        );


    $("profilePanelBackdrop")
        ?.addEventListener(
            "click",
            closeProfile
        );


    $("profilePhotoBtn")
        ?.addEventListener(
            "click",
            () => {

                $("profilePhotoInput")
                    ?.click();

            }
        );


    $("changeProfilePhoto")
        ?.addEventListener(
            "click",
            () => {

                $("profilePhotoInput")
                    ?.click();

            }
        );


    $("profilePhotoInput")
        ?.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if(file){

                    await uploadProfilePhoto(
                        file
                    );

                }

                event.target.value = "";

            }
        );


    $("removeProfilePhoto")
        ?.addEventListener(
            "click",
            removeProfilePhoto
        );


    /* --------------------------------------------------------
       END CALL
    -------------------------------------------------------- */

    $("endCallBtn")
        ?.addEventListener(
            "click",
            closeVideoRoom
        );


    /* --------------------------------------------------------
       ESCAPE
    -------------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if(event.key !== "Escape")
                return;

            if(
                !$("profilePanel")
                    ?.classList.contains(
                        "hidden"
                    )
            ){

                closeProfile();

            }

            if(
                !$("videoLinkPanel")
                    ?.classList.contains(
                        "hidden"
                    )
            ){

                closeVideoLinkPanel();

            }

        }
    );


    /* --------------------------------------------------------
       BACK/FORWARD
    -------------------------------------------------------- */

    window.addEventListener(
        "pageshow",
        () => {

            if(currentUser){

                loadUsers();

            }

        }
    );

}


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupEvents();

        await loadCurrentUser();

    }
);
