const bootScreen = document.getElementById("boot");
const loginScreen = document.getElementById("login");
const desktop = document.getElementById("desktop");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("error");
const browserForm = document.getElementById("browser-form");
const browserSearch = document.getElementById("browser-search");

let windowLayer = 10;
let openedWindowCount = 0;
let currentWallpaperIndex = 0;
let lastFocusedInput = null;

const wallpapers = [
    {
        name: "Nova",
        background:
            "radial-gradient(circle at 18% 20%, " +
            "rgba(255,255,255,.23), transparent 24%), " +
            "linear-gradient(135deg, #2563eb, #7c3aed)"
    },
    {
        name: "Sunset",
        background:
            "radial-gradient(circle at 75% 20%, " +
            "rgba(253,224,71,.35), transparent 25%), " +
            "linear-gradient(135deg, #f97316, #db2777 55%, #6d28d9)"
    },
    {
        name: "Aurora",
        background:
            "radial-gradient(circle at 30% 25%, " +
            "rgba(52,211,153,.75), transparent 24%), " +
            "radial-gradient(circle at 75% 75%, " +
            "rgba(45,212,191,.32), transparent 30%), " +
            "linear-gradient(145deg, #042f2e, #0f172a)"
    },
    {
        name: "Deep Space",
        background:
            "radial-gradient(circle at 20% 25%, " +
            "#818cf8 0 2px, transparent 3px), " +
            "radial-gradient(circle at 70% 35%, " +
            "#fff 0 1px, transparent 2px), " +
            "radial-gradient(circle at 80% 75%, " +
            "#c4b5fd 0 2px, transparent 3px), " +
            "linear-gradient(145deg, #020617, #172554)"
    }
];

/* Boot screen */

window.addEventListener("load", () => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const delay = reducedMotion ? 250 : 2500;

    window.setTimeout(() => {
        bootScreen.style.display = "none";
        loginScreen.style.display = "flex";
        document.getElementById("username").focus();
    }, delay);
});

/* Login */

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const username = usernameInput.value.trim();

    if (!username || !passwordInput.value) {
        loginError.textContent =
            "Enter both a username and password.";

        return;
    }

    loginError.textContent = "";
    passwordInput.value = "";

    loginScreen.style.display = "none";
    desktop.style.display = "block";
});

/* App windows */

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

        const leftPosition = Math.min(
            210 + offset,
            window.innerWidth - 180
        );

        const topPosition = Math.min(
            95 + offset,
            window.innerHeight - 180
        );

        appWindow.style.left = `${leftPosition}px`;
        appWindow.style.top = `${topPosition}px`;

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

function getOpenWindows() {
    return [...document.querySelectorAll(".window")]
        .filter((appWindow) => {
            return appWindow.style.display === "block";
        })
        .sort((firstWindow, secondWindow) => {
            return (
                Number(secondWindow.style.zIndex) -
                Number(firstWindow.style.zIndex)
            );
        });
}

function closeActiveWindow() {
    const activeWindow = getOpenWindows()[0];

    if (activeWindow) {
        activeWindow.style.display = "none";
    }
}

function showNovaPrompt(title, message) {
    document.getElementById("prompt-title").textContent = title;
    document.getElementById("prompt-heading").textContent = title;
    document.getElementById("prompt-message").textContent = message;

    openApp("system-prompt");
}

/* Bring clicked windows to the front */

document.addEventListener("pointerdown", (event) => {
    const appWindow = event.target.closest(".window");

    if (appWindow) {
        bringToFront(appWindow);
    }
});

/* Make windows draggable */

document.querySelectorAll(".window").forEach((appWindow) => {
    const titlebar = appWindow.querySelector(".titlebar");

    let dragOffsetX = 0;
    let dragOffsetY = 0;

    titlebar.addEventListener("pointerdown", (event) => {
        const closeButtonWasClicked =
            event.target.closest("button");

        if (closeButtonWasClicked || window.innerWidth <= 650) {
            return;
        }

        const bounds = appWindow.getBoundingClientRect();

        dragOffsetX = event.clientX - bounds.left;
        dragOffsetY = event.clientY - bounds.top;

        titlebar.setPointerCapture(event.pointerId);
        bringToFront(appWindow);
    });

    titlebar.addEventListener("pointermove", (event) => {
        const isDragging = titlebar.hasPointerCapture(
            event.pointerId
        );

        if (!isDragging) {
            return;
        }

        const maxLeft = Math.max(
            0,
            window.innerWidth - appWindow.offsetWidth
        );

        const maxTop = Math.max(
            34,
            window.innerHeight - 80
        );

        const nextLeft = Math.min(
            Math.max(0, event.clientX - dragOffsetX),
            maxLeft
        );

        const nextTop = Math.min(
            Math.max(34, event.clientY - dragOffsetY),
            maxTop
        );

        appWindow.style.left = `${nextLeft}px`;
        appWindow.style.top = `${nextTop}px`;
    });
});

/* Browser search */

browserForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = browserSearch.value.trim();

    if (!query) {
        browserSearch.focus();
        return;
    }

    const looksLikeUrl =
        query.includes(".") && !query.includes(" ");

    let target;

    if (looksLikeUrl) {
        const alreadyHasProtocol =
            /^https?:\/\//i.test(query);

        target = alreadyHasProtocol
            ? query
            : `https://${query}`;
    } else {
        target =
            `https://www.google.com/search?q=` +
            encodeURIComponent(query);
    }

    window.open(
        target,
        "_blank",
        "noopener,noreferrer"
    );
});

/* Clock */

function updateClock() {
    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleString([], {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
}

window.setInterval(updateClock, 1000);
updateClock();

/* Wallpaper controls */

function changeWallpaper(index) {
    const selected = wallpapers[index];

    if (!selected) {
        return;
    }

    desktop.style.background = selected.background;
    desktop.style.backgroundSize = "cover";

    currentWallpaperIndex = index;

    document.getElementById(
        "wallpaper-status"
    ).textContent = `Wallpaper: ${selected.name}`;

    document
        .querySelectorAll(".wallpaper")
        .forEach((button, buttonIndex) => {
            button.classList.toggle(
                "selected",
                buttonIndex === index
            );
        });

    try {
        localStorage.setItem(
            "novaWallpaper",
            String(index)
        );
    } catch {
        /*
        NovaOS still works when browser storage
        is unavailable.
        */
    }
}

/* Restore saved wallpaper */

try {
    const savedWallpaper = Number(
        localStorage.getItem("novaWallpaper")
    );

    if (
        Number.isInteger(savedWallpaper) &&
        wallpapers[savedWallpaper]
    ) {
        changeWallpaper(savedWallpaper);
    } else {
        changeWallpaper(0);
    }
} catch {
    changeWallpaper(0);
}

/* Top menu controls */

function closeTopMenus() {
    document
        .querySelectorAll(".top-menu")
        .forEach((menu) => {
            menu.classList.remove("open");

            menu
                .querySelector(".menu-button")
                .setAttribute(
                    "aria-expanded",
                    "false"
                );
        });
}

document
    .querySelectorAll(".menu-button")
    .forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const menu = button.closest(".top-menu");

            const shouldOpen =
                !menu.classList.contains("open");

            closeTopMenus();

            if (shouldOpen) {
                menu.classList.add("open");

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        });
    });

/* Remember the most recently used text field */

document.addEventListener("focusin", (event) => {
    if (event.target instanceof HTMLInputElement) {
        lastFocusedInput = event.target;
    }
});

/* Top menu actions */

document
    .querySelectorAll(".menu-dropdown [data-action]")
    .forEach((button) => {
        button.addEventListener("click", async () => {
            const action = button.dataset.action;

            closeTopMenus();

            if (action === "open-files") {
                openApp("files");
            }

            if (action === "open-browser") {
                openApp("browser");
            }

            if (action === "open-settings") {
                openApp("settings");
            }

            if (action === "close-active") {
                closeActiveWindow();
            }

            if (action === "next-wallpaper") {
                const nextWallpaper =
                    (currentWallpaperIndex + 1) %
                    wallpapers.length;

                changeWallpaper(nextWallpaper);
            }

            if (action === "lock") {
                document
                    .querySelectorAll(".window")
                    .forEach((appWindow) => {
                        appWindow.style.display = "none";
                    });

                desktop.style.display = "none";
                loginScreen.style.display = "flex";

                document
                    .getElementById("username")
                    .focus();
            }

            if (action === "select-all") {
                const activeField = lastFocusedInput;

                if (
                    activeField instanceof
                    HTMLInputElement
                ) {
                    activeField.focus();
                    activeField.select();
                } else {
                    showNovaPrompt(
                        "Edit",
                        "Click inside a text field first, " +
                        "then choose Select All."
                    );
                }
            }

            if (action === "clear-field") {
                const activeField = lastFocusedInput;

                if (
                    activeField instanceof
                    HTMLInputElement
                ) {
                    activeField.value = "";
                    activeField.focus();
                } else {
                    showNovaPrompt(
                        "Edit",
                        "Click inside a text field first, " +
                        "then choose Clear Field."
                    );
                }
            }

            if (action === "fullscreen") {
                try {
                    if (document.fullscreenElement) {
                        await document.exitFullscreen();
                    } else {
                        await document
                            .documentElement
                            .requestFullscreen();
                    }
                } catch {
                    showNovaPrompt(
                        "Full Screen",
                        "Your browser did not allow " +
                        "NovaOS to enter full screen."
                    );
                }
            }

            if (action === "shortcuts") {
                showNovaPrompt(
                    "Keyboard Shortcuts",
                    "Esc — close the active window\n" +
                    "Ctrl+A — select text\n" +
                    "Enter — submit login or browser search"
                );
            }

            if (action === "about") {
                showNovaPrompt(
                    "About NovaOS",
                    "NovaOS is a browser-based desktop " +
                    "experience built with HTML, CSS, " +
                    "and JavaScript."
                );
            }
        });
    });

/* Close menus when clicking elsewhere */

document.addEventListener("click", (event) => {
    const clickedInsideMenu =
        event.target.closest(".top-menu");

    if (!clickedInsideMenu) {
        closeTopMenus();
    }
});

/* Escape closes the menu or active window */

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const openMenu =
        document.querySelector(".top-menu.open");

    if (openMenu) {
        closeTopMenus();
    } else {
        closeActiveWindow();
    }
});