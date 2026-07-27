const bootScreen = document.getElementById("boot");
const loginScreen = document.getElementById("login");
const desktop = document.getElementById("desktop");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("error");
const browserForm = document.getElementById("browser-form");
const browserSearch = document.getElementById("browser-search");

let windowLayer = 10;
let openedWindowCount = 0;

const wallpapers = [
    {
        name: "Nova",
        background: "radial-gradient(circle at 18% 20%, rgba(255,255,255,.23), transparent 24%), linear-gradient(135deg, #2563eb, #7c3aed)"
    },
    {
        name: "Sunset",
        background: "radial-gradient(circle at 75% 20%, rgba(253,224,71,.35), transparent 25%), linear-gradient(135deg, #f97316, #db2777 55%, #6d28d9)"
    },
    {
        name: "Aurora",
        background: "radial-gradient(circle at 30% 25%, rgba(52,211,153,.75), transparent 24%), radial-gradient(circle at 75% 75%, rgba(45,212,191,.32), transparent 30%), linear-gradient(145deg, #042f2e, #0f172a)"
    },
    {
        name: "Deep Space",
        background: "radial-gradient(circle at 20% 25%, #818cf8 0 2px, transparent 3px), radial-gradient(circle at 70% 35%, #fff 0 1px, transparent 2px), radial-gradient(circle at 80% 75%, #c4b5fd 0 2px, transparent 3px), linear-gradient(145deg, #020617, #172554)"
    }
];

window.addEventListener("load", () => {
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 250 : 2500;

    window.setTimeout(() => {
        bootScreen.style.display = "none";
        loginScreen.style.display = "flex";
        document.getElementById("username").focus();
    }, delay);
});

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password");

    if (!username || !passwordInput.value) {
        loginError.textContent = "Enter both a username and password.";
        return;
    }

    loginError.textContent = "";
    passwordInput.value = "";
    loginScreen.style.display = "none";
    desktop.style.display = "block";
});

function bringToFront(appWindow) {
    windowLayer += 1;
    appWindow.style.zIndex = windowLayer;
}

function openApp(appId) {
    const appWindow = document.getElementById(appId);

    if (!appWindow) {
        return;
    }

    if (appWindow.style.display !== "block") {
        const offset = (openedWindowCount % 5) * 28;
        appWindow.style.left = `${Math.min(210 + offset, window.innerWidth - 180)}px`;
        appWindow.style.top = `${Math.min(95 + offset, window.innerHeight - 180)}px`;
        openedWindowCount += 1;
    }

    appWindow.style.display = "block";
    bringToFront(appWindow);
}

function closeApp(appId) {
    const appWindow = document.getElementById(appId);

    if (appWindow) {
        appWindow.style.display = "none";
    }
}

document.addEventListener("pointerdown", (event) => {
    const appWindow = event.target.closest(".window");

    if (appWindow) {
        bringToFront(appWindow);
    }
});

document.querySelectorAll(".window").forEach((appWindow) => {
    const titlebar = appWindow.querySelector(".titlebar");
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    titlebar.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button") || window.innerWidth <= 650) {
            return;
        }

        const bounds = appWindow.getBoundingClientRect();
        dragOffsetX = event.clientX - bounds.left;
        dragOffsetY = event.clientY - bounds.top;
        titlebar.setPointerCapture(event.pointerId);
        bringToFront(appWindow);
    });

    titlebar.addEventListener("pointermove", (event) => {
        if (!titlebar.hasPointerCapture(event.pointerId)) {
            return;
        }

        const maxLeft = Math.max(0, window.innerWidth - appWindow.offsetWidth);
        const maxTop = Math.max(34, window.innerHeight - 80);
        const nextLeft = Math.min(Math.max(0, event.clientX - dragOffsetX), maxLeft);
        const nextTop = Math.min(Math.max(34, event.clientY - dragOffsetY), maxTop);

        appWindow.style.left = `${nextLeft}px`;
        appWindow.style.top = `${nextTop}px`;
    });
});

browserForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = browserSearch.value.trim();

    if (!query) {
        browserSearch.focus();
        return;
    }

    const looksLikeUrl = query.includes(".") && !query.includes(" ");
    const target = looksLikeUrl
        ? (/^https?:\/\//i.test(query) ? query : `https://${query}`)
        : `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    window.open(target, "_blank", "noopener,noreferrer");
});

function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function changeWallpaper(index) {
    const selected = wallpapers[index];

    if (!selected) {
        return;
    }

    desktop.style.background = selected.background;
    desktop.style.backgroundSize = "cover";
    document.getElementById("wallpaper-status").textContent = `Wallpaper: ${selected.name}`;

    document.querySelectorAll(".wallpaper").forEach((button, buttonIndex) => {
        button.classList.toggle("selected", buttonIndex === index);
    });

    try {
        localStorage.setItem("novaWallpaper", String(index));
    } catch {
        // NovaOS still works when browser storage is unavailable.
    }
}

try {
    const savedWallpaper = Number(localStorage.getItem("novaWallpaper"));
    if (Number.isInteger(savedWallpaper) && wallpapers[savedWallpaper]) {
        changeWallpaper(savedWallpaper);
    } else {
        changeWallpaper(0);
    }
} catch {
    changeWallpaper(0);
}

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const openWindows = [...document.querySelectorAll(".window")]
        .filter((appWindow) => appWindow.style.display === "block")
        .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));

    if (openWindows[0]) {
        openWindows[0].style.display = "none";
    }
});

window.setInterval(updateClock, 1000);
updateClock();
