const bootScreen = document.getElementById("boot");
const loginScreen = document.getElementById("login");
const desktop = document.getElementById("desktop");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("error");
const browserForm = document.getElementById("browser-form");
const browserSearch = document.getElementById("browser-search");
const startMenu = document.getElementById("start-menu");
const startSearch = document.getElementById("start-search");
const storeSearch = document.getElementById("store-search");
const notesTextarea = document.getElementById("notes-textarea");
const calculatorDisplay = document.getElementById("calculator-display");
const paintCanvas = document.getElementById("paint-canvas");
const paintColour = document.getElementById("paint-colour");
const paintSize = document.getElementById("paint-size");

let windowLayer = 10;
let openedWindowCount = 0;
let currentWallpaperIndex = 0;
let lastFocusedInput = null;
let calculatorExpression = "";
let notesSaveTimer;
let installedApps = new Set();

const wallpapers = [
    {
        name: "Nova",
        background:
            "radial-gradient(circle at 18% 20%, rgba(255,255,255,.23), transparent 24%), linear-gradient(135deg, #2563eb, #7c3aed)"
    },
    {
        name: "Sunset",
        background:
            "radial-gradient(circle at 75% 20%, rgba(253,224,71,.35), transparent 25%), linear-gradient(135deg, #f97316, #db2777 55%, #6d28d9)"
    },
    {
        name: "Aurora",
        background:
            "radial-gradient(circle at 30% 25%, rgba(52,211,153,.75), transparent 24%), radial-gradient(circle at 75% 75%, rgba(45,212,191,.32), transparent 30%), linear-gradient(145deg, #042f2e, #0f172a)"
    },
    {
        name: "Deep Space",
        background:
            "radial-gradient(circle at 20% 25%, #818cf8 0 2px, transparent 3px), radial-gradient(circle at 70% 35%, #fff 0 1px, transparent 2px), radial-gradient(circle at 80% 75%, #c4b5fd 0 2px, transparent 3px), linear-gradient(145deg, #020617, #172554)"
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

    const username = document
        .getElementById("username")
        .value
        .trim();

    const passwordInput =
        document.getElementById("password");

    if (!username || !passwordInput.value) {
        loginError.textContent =
            "Enter both a username and password.";

        return;
    }

    loginError.textContent = "";
    passwordInput.value = "";

    document.getElementById(
        "start-username"
    ).textContent = username;

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

        appWindow.style.left =
            `${Math.min(
                210 + offset,
                window.innerWidth - 180
            )}px`;

        appWindow.style.top =
            `${Math.min(
                95 + offset,
                window.innerHeight - 180
            )}px`;

        openedWindowCount += 1;
    }

    appWindow.style.display = "block";

    bringToFront(appWindow);
    closeStartMenu();
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
    document.getElementById(
        "prompt-title"
    ).textContent = title;

    document.getElementById(
        "prompt-heading"
    ).textContent = title;

    document.getElementById(
        "prompt-message"
    ).textContent = message;

    openApp("system-prompt");
}

/* Start menu */

function closeStartMenu() {
    startMenu.classList.remove("open");
}

function toggleStartMenu() {
    closeTopMenus();
    startMenu.classList.toggle("open");

    if (startMenu.classList.contains("open")) {
        startSearch.value = "";
        filterStartApps();

        window.setTimeout(() => {
            startSearch.focus();
        }, 50);
    }
}

function openAppFromStart(appId) {
    closeStartMenu();
    openApp(appId);
}

function lockNovaOS() {
    closeStartMenu();
    closeTopMenus();

    document
        .querySelectorAll(".window")
        .forEach((appWindow) => {
            appWindow.style.display = "none";
        });

    desktop.style.display = "none";
    loginScreen.style.display = "flex";

    document.getElementById("password").value = "";
    document.getElementById("password").focus();
}

/* Bring clicked windows to the front */

document.addEventListener("pointerdown", (event) => {
    const appWindow = event.target.closest(".window");

    if (appWindow) {
        bringToFront(appWindow);
    }
});

/* Draggable windows */

document
    .querySelectorAll(".window")
    .forEach((appWindow) => {
        const titlebar =
            appWindow.querySelector(".titlebar");

        let dragOffsetX = 0;
        let dragOffsetY = 0;

        titlebar.addEventListener(
            "pointerdown",
            (event) => {
                if (
                    event.target.closest("button") ||
                    window.innerWidth <= 650
                ) {
                    return;
                }

                const bounds =
                    appWindow.getBoundingClientRect();

                dragOffsetX =
                    event.clientX - bounds.left;

                dragOffsetY =
                    event.clientY - bounds.top;

                titlebar.setPointerCapture(
                    event.pointerId
                );

                bringToFront(appWindow);
            }
        );

        titlebar.addEventListener(
            "pointermove",
            (event) => {
                if (
                    !titlebar.hasPointerCapture(
                        event.pointerId
                    )
                ) {
                    return;
                }

                const maxLeft = Math.max(
                    0,
                    window.innerWidth -
                    appWindow.offsetWidth
                );

                const maxTop = Math.max(
                    34,
                    window.innerHeight - 80
                );

                const nextLeft = Math.min(
                    Math.max(
                        0,
                        event.clientX - dragOffsetX
                    ),
                    maxLeft
                );

                const nextTop = Math.min(
                    Math.max(
                        34,
                        event.clientY - dragOffsetY
                    ),
                    maxTop
                );

                appWindow.style.left =
                    `${nextLeft}px`;

                appWindow.style.top =
                    `${nextTop}px`;
            }
        );
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
        query.includes(".") &&
        !query.includes(" ");

    const target = looksLikeUrl
        ? (
            /^https?:\/\//i.test(query)
                ? query
                : `https://${query}`
        )
        : (
            `https://www.google.com/search?q=` +
            encodeURIComponent(query)
        );

    window.open(
        target,
        "_blank",
        "noopener,noreferrer"
    );
});

/* Nova Store */

function saveInstalledApps() {
    try {
        localStorage.setItem(
            "novaInstalledApps",
            JSON.stringify([...installedApps])
        );
    } catch {
        /*
        NovaOS still works when browser
        storage is unavailable.
        */
    }
}

function syncInstalledApps() {
    document
        .querySelectorAll("[data-install-app]")
        .forEach((button) => {
            const appId =
                button.dataset.installApp;

            const isInstalled =
                installedApps.has(appId);

            button.textContent =
                isInstalled ? "Open" : "Install";

            button.classList.toggle(
                "installed",
                isInstalled
            );
        });

    document
        .querySelectorAll("[data-installed-app]")
        .forEach((button) => {
            button.hidden = !installedApps.has(
                button.dataset.installedApp
            );
        });

    filterStartApps();
}

function installOrOpenApp(appId) {
    if (installedApps.has(appId)) {
        openApp(appId);
        return;
    }

    installedApps.add(appId);

    saveInstalledApps();
    syncInstalledApps();

    const appNames = {
        calculator: "Nova Calculator",
        notes: "Nova Notes",
        paint: "Nova Paint"
    };

    showNovaPrompt(
        "App installed",
        `${appNames[appId]} was added to your Start menu.`
    );
}

function openInstalledApp(appId) {
    if (installedApps.has(appId)) {
        openAppFromStart(appId);
    } else {
        openAppFromStart("store");
    }
}

document
    .querySelectorAll("[data-install-app]")
    .forEach((button) => {
        button.addEventListener("click", () => {
            installOrOpenApp(
                button.dataset.installApp
            );
        });
    });

/* Start-menu search */

function filterStartApps() {
    const query =
        startSearch.value.trim().toLowerCase();

    let visibleApps = 0;

    document
        .querySelectorAll(".start-app")
        .forEach((button) => {
            const requiredInstall =
                button.dataset.installedApp;

            const isAvailable =
                !requiredInstall ||
                installedApps.has(requiredInstall);

            const matches =
                button.dataset.startName.includes(query);

            const shouldShow =
                isAvailable && matches;

            button.hidden = !shouldShow;

            if (shouldShow) {
                visibleApps += 1;
            }
        });

    document.getElementById(
        "start-empty"
    ).hidden = visibleApps !== 0;
}

startSearch.addEventListener(
    "input",
    filterStartApps
);

/* Store search */

storeSearch.addEventListener("input", () => {
    const query =
        storeSearch.value.trim().toLowerCase();

    let visibleApps = 0;
    let visibleAvailableApps = 0;
    let visibleSoonApps = 0;

    document
        .querySelectorAll(
            ".store-card, .soon-card"
        )
        .forEach((card) => {
            const matches =
                card.dataset.storeName.includes(query);

            card.hidden = !matches;

            if (matches) {
                visibleApps += 1;

                if (
                    card.classList.contains(
                        "store-card"
                    )
                ) {
                    visibleAvailableApps += 1;
                } else {
                    visibleSoonApps += 1;
                }
            }
        });

    document.querySelector(
        ".store-section-title"
    ).hidden = visibleAvailableApps === 0;

    document.querySelector(
        ".soon-section"
    ).hidden = visibleSoonApps === 0;

    document.getElementById(
        "store-empty"
    ).hidden = visibleApps !== 0;
});

/* Restore installed apps */

try {
    const savedApps = JSON.parse(
        localStorage.getItem(
            "novaInstalledApps"
        ) || "[]"
    );

    installedApps = new Set(
        Array.isArray(savedApps)
            ? savedApps
            : []
    );
} catch {
    installedApps = new Set();
}

syncInstalledApps();

/* Nova Notes */

try {
    notesTextarea.value =
        localStorage.getItem("novaNotes") || "";
} catch {
    notesTextarea.value = "";
}

notesTextarea.addEventListener("input", () => {
    const status =
        document.getElementById("notes-status");

    status.textContent = "Saving…";

    window.clearTimeout(notesSaveTimer);

    notesSaveTimer = window.setTimeout(() => {
        try {
            localStorage.setItem(
                "novaNotes",
                notesTextarea.value
            );

            status.textContent = "Saved";
        } catch {
            status.textContent = "Could not save";
        }
    }, 350);
});

/* Nova Paint */

const paintContext =
    paintCanvas.getContext("2d");

let isPainting = false;

function resetPaintCanvas() {
    paintContext.save();

    paintContext.fillStyle = "#ffffff";

    paintContext.fillRect(
        0,
        0,
        paintCanvas.width,
        paintCanvas.height
    );

    paintContext.restore();
}

function getPaintPoint(event) {
    const bounds =
        paintCanvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - bounds.left) *
            (paintCanvas.width / bounds.width),

        y:
            (event.clientY - bounds.top) *
            (paintCanvas.height / bounds.height)
    };
}

paintCanvas.addEventListener(
    "pointerdown",
    (event) => {
        isPainting = true;

        paintCanvas.setPointerCapture(
            event.pointerId
        );

        const point = getPaintPoint(event);

        paintContext.fillStyle =
            paintColour.value;

        paintContext.beginPath();

        paintContext.arc(
            point.x,
            point.y,
            Number(paintSize.value) / 2,
            0,
            Math.PI * 2
        );

        paintContext.fill();
        paintContext.beginPath();

        paintContext.moveTo(
            point.x,
            point.y
        );
    }
);

paintCanvas.addEventListener(
    "pointermove",
    (event) => {
        if (!isPainting) {
            return;
        }

        const point = getPaintPoint(event);

        paintContext.lineTo(
            point.x,
            point.y
        );

        paintContext.strokeStyle =
            paintColour.value;

        paintContext.lineWidth =
            Number(paintSize.value);

        paintContext.lineCap = "round";
        paintContext.lineJoin = "round";
        paintContext.stroke();
    }
);

function stopPainting() {
    isPainting = false;
    paintContext.closePath();
}

paintCanvas.addEventListener(
    "pointerup",
    stopPainting
);

paintCanvas.addEventListener(
    "pointercancel",
    stopPainting
);

document.getElementById(
    "paint-clear"
).addEventListener(
    "click",
    resetPaintCanvas
);

document.getElementById(
    "paint-save"
).addEventListener("click", () => {
    const downloadLink =
        document.createElement("a");

    downloadLink.download =
        "nova-paint.png";

    downloadLink.href =
        paintCanvas.toDataURL("image/png");

    downloadLink.click();
});

resetPaintCanvas();

/* Calculator */

function updateCalculatorDisplay(value) {
    calculatorDisplay.value =
        value
            .replaceAll("*", "×")
            .replaceAll("/", "÷") ||
        "0";
}

document
    .querySelectorAll(
        "[data-calculator-value]"
    )
    .forEach((button) => {
        button.addEventListener("click", () => {
            if (
                calculatorDisplay.value === "Error"
            ) {
                calculatorExpression = "";
            }

            calculatorExpression +=
                button.dataset.calculatorValue;

            updateCalculatorDisplay(
                calculatorExpression
            );
        });
    });

document
    .querySelectorAll(
        "[data-calculator-action]"
    )
    .forEach((button) => {
        button.addEventListener("click", () => {
            const action =
                button.dataset.calculatorAction;

            if (action === "clear") {
                calculatorExpression = "";

                updateCalculatorDisplay(
                    calculatorExpression
                );

                return;
            }

            if (action === "delete") {
                calculatorExpression =
                    calculatorExpression.slice(0, -1);

                updateCalculatorDisplay(
                    calculatorExpression
                );

                return;
            }

            if (action === "equals") {
                const isSafeExpression =
                    /^[0-9+\-*/.() ]+$/.test(
                        calculatorExpression
                    );

                if (
                    !isSafeExpression ||
                    !calculatorExpression
                ) {
                    calculatorDisplay.value =
                        "Error";

                    calculatorExpression = "";

                    return;
                }

                try {
                    const result = Function(
                        `"use strict"; return (` +
                        `${calculatorExpression})`
                    )();

                    if (!Number.isFinite(result)) {
                        throw new Error(
                            "Invalid result"
                        );
                    }

                    calculatorExpression =
                        String(
                            Number(
                                result.toFixed(10)
                            )
                        );

                    updateCalculatorDisplay(
                        calculatorExpression
                    );
                } catch {
                    calculatorDisplay.value =
                        "Error";

                    calculatorExpression = "";
                }
            }
        });
    });

/* Clock */

function updateClock() {
    const now = new Date();

    document.getElementById(
        "clock"
    ).textContent = now.toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

window.setInterval(updateClock, 1000);
updateClock();

/* Wallpaper */

function changeWallpaper(index) {
    const selected = wallpapers[index];

    if (!selected) {
        return;
    }

    desktop.style.background =
        selected.background;

    desktop.style.backgroundSize = "cover";

    currentWallpaperIndex = index;

    document.getElementById(
        "wallpaper-status"
    ).textContent =
        `Wallpaper: ${selected.name}`;

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
        NovaOS still works when browser
        storage is unavailable.
        */
    }
}

/* Restore wallpaper */

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

/* Top menus */

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
        button.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                const menu =
                    button.closest(".top-menu");

                const shouldOpen =
                    !menu.classList.contains(
                        "open"
                    );

                closeStartMenu();
                closeTopMenus();

                if (shouldOpen) {
                    menu.classList.add("open");

                    button.setAttribute(
                        "aria-expanded",
                        "true"
                    );
                }
            }
        );
    });

/* Remember the most recent input */

document.addEventListener(
    "focusin",
    (event) => {
        if (
            event.target instanceof
            HTMLInputElement
        ) {
            lastFocusedInput = event.target;
        }
    }
);

/* Top-menu actions */

document
    .querySelectorAll(
        ".menu-dropdown [data-action]"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            async () => {
                const action =
                    button.dataset.action;

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

                if (action === "open-store") {
                    openApp("store");
                }

                if (action === "close-active") {
                    closeActiveWindow();
                }

                if (action === "next-wallpaper") {
                    changeWallpaper(
                        (
                            currentWallpaperIndex + 1
                        ) % wallpapers.length
                    );
                }

                if (action === "lock") {
                    lockNovaOS();
                }

                if (action === "select-all") {
                    const activeField =
                        lastFocusedInput;

                    if (
                        activeField instanceof
                        HTMLInputElement
                    ) {
                        activeField.focus();
                        activeField.select();
                    } else {
                        showNovaPrompt(
                            "Edit",
                            "Click inside a text " +
                            "field first, then " +
                            "choose Select All."
                        );
                    }
                }

                if (action === "clear-field") {
                    const activeField =
                        lastFocusedInput;

                    if (
                        activeField instanceof
                        HTMLInputElement
                    ) {
                        activeField.value = "";
                        activeField.focus();
                    } else {
                        showNovaPrompt(
                            "Edit",
                            "Click inside a text " +
                            "field first, then " +
                            "choose Clear Field."
                        );
                    }
                }

                if (action === "fullscreen") {
                    try {
                        if (
                            document.fullscreenElement
                        ) {
                            await document
                                .exitFullscreen();
                        } else {
                            await document
                                .documentElement
                                .requestFullscreen();
                        }
                    } catch {
                        showNovaPrompt(
                            "Full Screen",
                            "Your browser did not " +
                            "allow NovaOS to enter " +
                            "full screen."
                        );
                    }
                }

                if (action === "shortcuts") {
                    showNovaPrompt(
                        "Keyboard Shortcuts",
                        "Esc — close the active " +
                        "window\nCtrl+A — select " +
                        "text\nEnter — submit login " +
                        "or browser search"
                    );
                }

                if (action === "about") {
                    showNovaPrompt(
                        "About NovaOS",
                        "NovaOS is a browser-based " +
                        "desktop experience built " +
                        "with HTML, CSS, and " +
                        "JavaScript."
                    );
                }
            }
        );
    });

/* Close menus when clicking outside */

document.addEventListener("click", (event) => {
    if (!event.target.closest(".top-menu")) {
        closeTopMenus();
    }

    if (
        !event.target.closest("#start-menu") &&
        !event.target.closest(".start-button")
    ) {
        closeStartMenu();
    }
});

/* Escape key */

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const openMenu =
        document.querySelector(".top-menu.open");

    if (openMenu) {
        closeTopMenus();
    } else if (
        startMenu.classList.contains("open")
    ) {
        closeStartMenu();
    } else {
        closeActiveWindow();
    }
});