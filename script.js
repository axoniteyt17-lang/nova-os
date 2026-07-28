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
const filesGrid = document.getElementById("files-grid");
const filesPath = document.getElementById("files-path");
const filesBackButton = document.getElementById("files-back");
const filesRenameButton = document.getElementById("files-rename");
const filesDeleteButton = document.getElementById("files-delete");
const filesDownloadButton = document.getElementById("files-download");
const filesImportInput = document.getElementById("files-import-input");
const fileEditor = document.getElementById("file-editor");
const fileEditorContent = document.getElementById("file-editor-content");

let windowLayer = 10;
let openedWindowCount = 0;
let currentWallpaperIndex = 0;
let lastFocusedInput = null;
let calculatorExpression = "";
let notesSaveTimer;
let installedApps = new Set();
let currentFolderId = "root";
let selectedFileId = null;
let editingFileId = null;
let folderHistory = [];

const defaultFileSystem = {
    id: "root",
    name: "Home",
    type: "folder",
    children: [
        {
            id: "welcome-file",
            name: "Welcome.txt",
            type: "file",
            content: "Welcome to NovaOS!\n\nThis is a real editable file. Change this text and press Save file."
        },
        {
            id: "games-folder",
            name: "Games",
            type: "folder",
            children: [
                {
                    id: "games-readme",
                    name: "Games.txt",
                    type: "file",
                    content: "Your installed NovaOS games will appear here."
                }
            ]
        },
        {
            id: "photos-folder",
            name: "Photos",
            type: "folder",
            children: []
        }
    ]
};

let novaFileSystem = loadFileSystem();

function cloneDefaultFileSystem() {
    return JSON.parse(JSON.stringify(defaultFileSystem));
}

function loadFileSystem() {
    try {
        const savedFileSystem = JSON.parse(
            localStorage.getItem("novaFileSystem") || "null"
        );

        if (
            savedFileSystem &&
            savedFileSystem.id === "root" &&
            savedFileSystem.type === "folder" &&
            Array.isArray(savedFileSystem.children)
        ) {
            return savedFileSystem;
        }
    } catch {
        // Use the starter files if saved data cannot be read.
    }

    return cloneDefaultFileSystem();
}

function saveFileSystem() {
    try {
        localStorage.setItem(
            "novaFileSystem",
            JSON.stringify(novaFileSystem)
        );
    } catch {
        showNovaPrompt(
            "File Explorer",
            "NovaOS could not save the File Explorer changes in this browser."
        );
    }
}

function createFileId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return `nova-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findFileItem(itemId, item = novaFileSystem) {
    if (item.id === itemId) {
        return item;
    }

    if (item.type !== "folder") {
        return null;
    }

    for (const child of item.children) {
        const result = findFileItem(itemId, child);

        if (result) {
            return result;
        }
    }

    return null;
}

function findParentFolder(itemId, folder = novaFileSystem) {
    if (folder.type !== "folder") {
        return null;
    }

    if (folder.children.some((child) => child.id === itemId)) {
        return folder;
    }

    for (const child of folder.children) {
        if (child.type === "folder") {
            const result = findParentFolder(itemId, child);

            if (result) {
                return result;
            }
        }
    }

    return null;
}

function getFolderPath(folderId, folder = novaFileSystem, path = []) {
    const nextPath = [...path, folder];

    if (folder.id === folderId) {
        return nextPath;
    }

    for (const child of folder.children) {
        if (child.type === "folder") {
            const result = getFolderPath(folderId, child, nextPath);

            if (result) {
                return result;
            }
        }
    }

    return null;
}

function getCurrentFolder() {
    const folder = findFileItem(currentFolderId);

    if (!folder || folder.type !== "folder") {
        currentFolderId = "root";
        folderHistory = [];
        return novaFileSystem;
    }

    return folder;
}

function getFileIcon(item) {
    if (item.type === "folder") {
        return item.name.toLowerCase() === "photos"
            ? "🖼️"
            : item.name.toLowerCase() === "games"
              ? "🎮"
              : "📁";
    }

    const extension = item.name.includes(".")
        ? item.name.split(".").pop().toLowerCase()
        : "";

    if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
        return "🖼️";
    }

    if (["html", "css", "js", "json"].includes(extension)) {
        return "💻";
    }

    return "📄";
}

function setSelectedFile(itemId) {
    selectedFileId = itemId;

    document.querySelectorAll(".file-entry").forEach((entry) => {
        entry.classList.toggle(
            "selected",
            entry.dataset.fileId === itemId
        );
    });

    const hasSelection = Boolean(selectedFileId);

    filesRenameButton.disabled = !hasSelection;
    filesDeleteButton.disabled = !hasSelection;
    filesDownloadButton.disabled = !hasSelection;
}

function renderFileExplorer() {
    const folder = getCurrentFolder();

    const items = [...folder.children].sort((first, second) => {
        if (first.type !== second.type) {
            return first.type === "folder" ? -1 : 1;
        }

        return first.name.localeCompare(second.name);
    });

    filesGrid.replaceChildren();
    selectedFileId = null;

    filesRenameButton.disabled = true;
    filesDeleteButton.disabled = true;
    filesDownloadButton.disabled = true;

    const path = getFolderPath(folder.id) || [novaFileSystem];

    filesPath.textContent = path
        .map((part) => part.name)
        .join("  ›  ");

    filesBackButton.disabled = folderHistory.length === 0;

    items.forEach((item) => {
        const entry = document.createElement("button");
        const icon = document.createElement("span");
        const name = document.createElement("strong");
        const details = document.createElement("small");

        entry.className = "file-entry";
        entry.type = "button";
        entry.dataset.fileId = item.id;
        entry.title = `Double-click to open ${item.name}`;

        icon.className = "file-entry-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = getFileIcon(item);

        name.textContent = item.name;

        details.textContent =
            item.type === "folder"
                ? `${item.children.length} item${
                      item.children.length === 1 ? "" : "s"
                  }`
                : "Text file";

        entry.append(icon, name, details);

        entry.addEventListener("click", () => {
            setSelectedFile(item.id);
        });

        entry.addEventListener("dblclick", () => {
            openFileItem(item.id);
        });

        filesGrid.append(entry);
    });

    document.getElementById("files-empty").hidden =
        items.length !== 0;

    document.getElementById("files-status").textContent =
        `${items.length} item${items.length === 1 ? "" : "s"}`;
}

function openFileItem(itemId) {
    const item = findFileItem(itemId);

    if (!item) {
        return;
    }

    if (item.type === "folder") {
        folderHistory.push(currentFolderId);
        currentFolderId = item.id;

        closeFileEditor(true);
        renderFileExplorer();
        return;
    }

    editingFileId = item.id;

    document.getElementById("file-editor-name").textContent =
        item.name;

    fileEditorContent.value = item.content || "";

    document.getElementById("file-editor-status").textContent =
        "Ready";

    fileEditor.hidden = false;
    fileEditorContent.focus();
}

function closeFileEditor(forceClose = false) {
    if (
        !forceClose &&
        !fileEditor.hidden &&
        document.getElementById("file-editor-status").textContent ===
            "Unsaved changes" &&
        !window.confirm(
            "Close this file without saving your changes?"
        )
    ) {
        return;
    }

    editingFileId = null;
    fileEditor.hidden = true;
}

function askForItemName(type, currentName = "") {
    const label = type === "folder" ? "folder" : "file";

    const answer = window.prompt(
        currentName
            ? `Rename this ${label}:`
            : `Enter a name for the new ${label}:`,
        currentName ||
            (type === "folder" ? "New folder" : "New file.txt")
    );

    if (answer === null) {
        return null;
    }

    const cleanedName = answer.trim().replace(/[\\/]/g, "-");

    if (!cleanedName) {
        showNovaPrompt(
            "File Explorer",
            "The name cannot be empty."
        );

        return null;
    }

    return cleanedName;
}

function folderHasName(folder, name, ignoredItemId = null) {
    return folder.children.some(
        (item) =>
            item.id !== ignoredItemId &&
            item.name.toLowerCase() === name.toLowerCase()
    );
}

function createFileSystemItem(type) {
    const folder = getCurrentFolder();
    const name = askForItemName(type);

    if (!name) {
        return;
    }

    if (folderHasName(folder, name)) {
        showNovaPrompt(
            "File Explorer",
            `An item named "${name}" already exists in this folder.`
        );

        return;
    }

    const newItem = {
        id: createFileId(),
        name,
        type
    };

    if (type === "folder") {
        newItem.children = [];
    } else {
        newItem.content = "";
    }

    folder.children.push(newItem);

    saveFileSystem();
    renderFileExplorer();
    setSelectedFile(newItem.id);

    if (type === "file") {
        openFileItem(newItem.id);
    }
}

function renameSelectedFileItem() {
    const item = findFileItem(selectedFileId);
    const parent = item ? findParentFolder(item.id) : null;

    if (!item || !parent) {
        return;
    }

    const newName = askForItemName(item.type, item.name);

    if (!newName || newName === item.name) {
        return;
    }

    if (folderHasName(parent, newName, item.id)) {
        showNovaPrompt(
            "File Explorer",
            `An item named "${newName}" already exists in this folder.`
        );

        return;
    }

    item.name = newName;

    saveFileSystem();
    renderFileExplorer();
    setSelectedFile(item.id);
}

function deleteSelectedFileItem() {
    const item = findFileItem(selectedFileId);
    const parent = item ? findParentFolder(item.id) : null;

    if (!item || !parent) {
        return;
    }

    const extraWarning =
        item.type === "folder" && item.children.length
            ? " Everything inside it will also be deleted."
            : "";

    if (!window.confirm(`Delete "${item.name}"?${extraWarning}`)) {
        return;
    }

    parent.children = parent.children.filter(
        (child) => child.id !== item.id
    );

    if (editingFileId === item.id) {
        closeFileEditor(true);
    }

    saveFileSystem();
    renderFileExplorer();
}

function makeAvailableFileName(folder, requestedName) {
    if (!folderHasName(folder, requestedName)) {
        return requestedName;
    }

    const dotIndex = requestedName.lastIndexOf(".");
    const hasExtension = dotIndex > 0;

    const baseName = hasExtension
        ? requestedName.slice(0, dotIndex)
        : requestedName;

    const extension = hasExtension
        ? requestedName.slice(dotIndex)
        : "";

    let copyNumber = 2;

    let availableName =
        `${baseName} (${copyNumber})${extension}`;

    while (folderHasName(folder, availableName)) {
        copyNumber += 1;
        availableName =
            `${baseName} (${copyNumber})${extension}`;
    }

    return availableName;
}

function downloadWithLink(
    fileName,
    contents,
    mimeType = "text/plain"
) {
    const blob = new Blob([contents], {
        type: `${mimeType};charset=utf-8`
    });

    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = fileName;
    downloadLink.click();

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);
}

async function saveSelectedItemToComputer() {
    const item = findFileItem(selectedFileId);

    if (!item) {
        return;
    }

    const isFolder = item.type === "folder";

    const fileName = isFolder
        ? `${item.name}.nova.json`
        : item.name;

    const contents = isFolder
        ? JSON.stringify(item, null, 2)
        : item.content || "";

    const mimeType =
        isFolder || fileName.toLowerCase().endsWith(".json")
            ? "application/json"
            : "text/plain";

    if (typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName
            });

            const writable = await handle.createWritable();

            await writable.write(contents);
            await writable.close();

            document.getElementById("files-status").textContent =
                `Saved ${fileName} to your computer`;

            return;
        } catch (error) {
            if (error && error.name === "AbortError") {
                return;
            }
        }
    }

    downloadWithLink(fileName, contents, mimeType);

    document.getElementById("files-status").textContent =
        `Downloaded ${fileName}`;
}

async function importRealFiles(fileList) {
    const folder = getCurrentFolder();
    const importedItems = [];

    for (const realFile of fileList) {
        try {
            const contents = await realFile.text();

            const importedItem = {
                id: createFileId(),
                name: makeAvailableFileName(
                    folder,
                    realFile.name
                ),
                type: "file",
                content: contents
            };

            folder.children.push(importedItem);
            importedItems.push(importedItem);
        } catch {
            showNovaPrompt(
                "Import failed",
                `${realFile.name} could not be imported.`
            );
        }
    }

    filesImportInput.value = "";

    if (!importedItems.length) {
        return;
    }

    saveFileSystem();
    renderFileExplorer();

    setSelectedFile(
        importedItems[importedItems.length - 1].id
    );

    document.getElementById("files-status").textContent =
        `Imported ${importedItems.length} file${
            importedItems.length === 1 ? "" : "s"
        }`;
}

function getOrCreateSaveFolder(folderName = "Saves") {
    let saveFolder = novaFileSystem.children.find(
        (item) =>
            item.type === "folder" &&
            item.name.toLowerCase() === folderName.toLowerCase()
    );

    if (!saveFolder) {
        saveFolder = {
            id: createFileId(),
            name: folderName,
            type: "folder",
            children: []
        };

        novaFileSystem.children.push(saveFolder);
    }

    return saveFolder;
}

function saveAppProgress(
    fileName,
    data,
    folderName = "Saves"
) {
    const saveFolder = getOrCreateSaveFolder(folderName);

    const contents =
        typeof data === "string"
            ? data
            : JSON.stringify(data, null, 2);

    let saveFile = saveFolder.children.find(
        (item) =>
            item.type === "file" &&
            item.name.toLowerCase() === fileName.toLowerCase()
    );

    if (saveFile) {
        saveFile.content = contents;
    } else {
        saveFile = {
            id: createFileId(),
            name: fileName,
            type: "file",
            content: contents
        };

        saveFolder.children.push(saveFile);
    }

    saveFileSystem();

    if (
        currentFolderId === saveFolder.id ||
        currentFolderId === "root"
    ) {
        renderFileExplorer();
    }

    return saveFile.id;
}

function loadAppProgress(
    fileName,
    folderName = "Saves"
) {
    const saveFolder = novaFileSystem.children.find(
        (item) =>
            item.type === "folder" &&
            item.name.toLowerCase() === folderName.toLowerCase()
    );

    const saveFile = saveFolder?.children.find(
        (item) =>
            item.type === "file" &&
            item.name.toLowerCase() === fileName.toLowerCase()
    );

    if (!saveFile) {
        return null;
    }

    try {
        return JSON.parse(saveFile.content);
    } catch {
        return saveFile.content;
    }
}

window.NovaFS = {
    save: saveAppProgress,
    load: loadAppProgress,

    download(fileName, folderName = "Saves") {
        const saveFolder = novaFileSystem.children.find(
            (item) =>
                item.type === "folder" &&
                item.name.toLowerCase() ===
                    folderName.toLowerCase()
        );

        const saveFile = saveFolder?.children.find(
            (item) =>
                item.type === "file" &&
                item.name.toLowerCase() ===
                    fileName.toLowerCase()
        );

        if (!saveFile) {
            return false;
        }

        downloadWithLink(
            saveFile.name,
            saveFile.content || ""
        );

        return true;
    }
};

filesBackButton.addEventListener("click", () => {
    const previousFolderId = folderHistory.pop();

    if (previousFolderId) {
        currentFolderId = previousFolderId;
        closeFileEditor(true);
        renderFileExplorer();
    }
});

document
    .getElementById("files-new-file")
    .addEventListener("click", () => {
        createFileSystemItem("file");
    });

document
    .getElementById("files-new-folder")
    .addEventListener("click", () => {
        createFileSystemItem("folder");
    });

document
    .getElementById("files-import")
    .addEventListener("click", () => {
        filesImportInput.click();
    });

filesImportInput.addEventListener("change", () => {
    importRealFiles([...filesImportInput.files]);
});

filesDownloadButton.addEventListener(
    "click",
    saveSelectedItemToComputer
);

filesRenameButton.addEventListener(
    "click",
    renameSelectedFileItem
);

filesDeleteButton.addEventListener(
    "click",
    deleteSelectedFileItem
);

document
    .getElementById("file-editor-close")
    .addEventListener("click", () => {
        closeFileEditor();
    });

fileEditorContent.addEventListener("input", () => {
    document.getElementById(
        "file-editor-status"
    ).textContent = "Unsaved changes";
});

document
    .getElementById("file-editor-save")
    .addEventListener("click", () => {
        const file = findFileItem(editingFileId);

        if (!file || file.type !== "file") {
            return;
        }

        file.content = fileEditorContent.value;

        saveFileSystem();

        document.getElementById(
            "file-editor-status"
        ).textContent = "Saved";
    });

filesGrid.addEventListener("click", (event) => {
    if (event.target === filesGrid) {
        setSelectedFile(null);
    }
});

renderFileExplorer();

/* ===================================== */
/* WALLPAPER GALLERY                     */
/* ===================================== */

const wallpapers = [
    {
        name: "Nova",
        background:
            "radial-gradient(circle at 18% 20%, rgba(255,255,255,.23), transparent 24%), linear-gradient(135deg, #2563eb, #7c3aed)"
    },
    {
        name: "Aqua",
        background:
            "radial-gradient(ellipse at 35% 20%, rgba(255,255,255,.9) 0 4%, transparent 22%), radial-gradient(ellipse at 65% 85%, rgba(45,212,191,.8), transparent 35%), linear-gradient(155deg, #38bdf8, #0369a1 55%, #0f766e)"
    },
    {
        name: "Jaguar",
        background:
            "radial-gradient(circle at 22% 35%, #fb923c 0 2%, transparent 3%), radial-gradient(circle at 72% 24%, #fdba74 0 1.5%, transparent 2.5%), radial-gradient(circle at 58% 72%, #f97316 0 2%, transparent 3%), linear-gradient(140deg, #111827, #78350f 48%, #020617)"
    },
    {
        name: "Panther",
        background:
            "repeating-radial-gradient(ellipse at 50% 120%, transparent 0 11%, rgba(59,130,246,.24) 12% 14%), linear-gradient(145deg, #020617, #1e3a8a 50%, #0f172a)"
    },
    {
        name: "Tiger",
        background:
            "radial-gradient(ellipse at 70% 18%, rgba(255,255,255,.68), transparent 18%), repeating-linear-gradient(112deg, transparent 0 8%, rgba(251,146,60,.2) 9% 12%), linear-gradient(135deg, #0f172a, #c2410c 52%, #fbbf24)"
    },
    {
        name: "Leopard Aurora",
        background:
            "radial-gradient(ellipse at 30% 45%, rgba(34,211,238,.78), transparent 28%), radial-gradient(ellipse at 72% 58%, rgba(217,70,239,.72), transparent 32%), radial-gradient(ellipse at 48% 15%, rgba(255,255,255,.48), transparent 18%), linear-gradient(145deg, #020617, #172554 48%, #581c87)"
    },
    {
        name: "Snow Aurora",
        background:
            "radial-gradient(ellipse at 32% 42%, rgba(125,211,252,.82), transparent 30%), radial-gradient(ellipse at 72% 60%, rgba(216,180,254,.76), transparent 34%), linear-gradient(145deg, #e0f2fe, #93c5fd 45%, #c4b5fd)"
    },
    {
        name: "Lion Galaxy",
        background:
            "radial-gradient(circle at 25% 32%, #fff 0 1px, transparent 2px), radial-gradient(circle at 75% 42%, #fde68a 0 1px, transparent 2px), radial-gradient(ellipse at 52% 54%, rgba(249,115,22,.82), transparent 18%), radial-gradient(ellipse at 40% 48%, rgba(168,85,247,.7), transparent 32%), linear-gradient(140deg, #020617, #1e1b4b 60%, #4c1d95)"
    },
    {
        name: "Mountain Lion",
        background:
            "radial-gradient(circle at 18% 18%, #fff 0 1px, transparent 2px), radial-gradient(circle at 82% 28%, #fff 0 1px, transparent 2px), radial-gradient(ellipse at 58% 58%, rgba(236,72,153,.74), transparent 22%), radial-gradient(ellipse at 38% 48%, rgba(59,130,246,.72), transparent 34%), linear-gradient(145deg, #030712, #312e81 58%, #831843)"
    },
    {
        name: "Mavericks Wave",
        background:
            "radial-gradient(ellipse at 25% 92%, rgba(255,255,255,.92) 0 9%, transparent 10%), radial-gradient(ellipse at 42% 94%, rgba(186,230,253,.86) 0 18%, transparent 19%), radial-gradient(ellipse at 60% 110%, #0284c7 0 38%, transparent 39%), linear-gradient(165deg, #bae6fd, #0ea5e9 48%, #164e63)"
    },
    {
        name: "Yosemite Peaks",
        background:
            "linear-gradient(145deg, transparent 0 45%, rgba(255,255,255,.6) 46% 48%, #64748b 49% 63%, #334155 64%), linear-gradient(155deg, #fda4af, #fdba74 45%, #7dd3fc)"
    },
    {
        name: "El Capitan",
        background:
            "linear-gradient(112deg, transparent 0 52%, rgba(255,255,255,.3) 53% 55%, #78716c 56% 74%, #292524 75%), linear-gradient(165deg, #60a5fa, #fca5a5 52%, #f59e0b)"
    },
    {
        name: "Sierra",
        background:
            "linear-gradient(155deg, transparent 0 47%, rgba(226,232,240,.88) 48% 53%, #475569 54% 72%, #1e293b 73%), linear-gradient(165deg, #38bdf8, #fca5a5 48%, #fb923c)"
    },
    {
        name: "High Sierra",
        background:
            "linear-gradient(145deg, transparent 0 46%, rgba(255,255,255,.78) 47% 51%, #64748b 52% 68%, #334155 69%), radial-gradient(ellipse at 30% 85%, rgba(34,197,94,.72), transparent 28%), linear-gradient(165deg, #93c5fd, #fdba74 55%, #166534)"
    },
    {
        name: "Mojave Day",
        background:
            "radial-gradient(ellipse at 52% 90%, #f59e0b 0 18%, transparent 19%), radial-gradient(ellipse at 48% 105%, #b45309 0 38%, transparent 39%), linear-gradient(170deg, #38bdf8, #fef3c7 58%, #fb923c)"
    },
    {
        name: "Mojave Night",
        background:
            "radial-gradient(circle at 78% 18%, #f8fafc 0 4%, rgba(248,250,252,.25) 5%, transparent 12%), radial-gradient(ellipse at 52% 93%, #7c2d12 0 18%, transparent 19%), radial-gradient(ellipse at 48% 108%, #431407 0 38%, transparent 39%), linear-gradient(170deg, #020617, #172554 58%, #7c2d12)"
    },
    {
        name: "Catalina",
        background:
            "linear-gradient(150deg, transparent 0 50%, #7c2d12 51% 65%, #431407 66%), radial-gradient(ellipse at 45% 80%, #fb923c 0 20%, transparent 21%), linear-gradient(165deg, #0ea5e9, #f9a8d4 52%, #f97316)"
    },
    {
        name: "Big Sur",
        background:
            "radial-gradient(ellipse at 10% 80%, #f9a8d4 0 28%, transparent 29%), radial-gradient(ellipse at 88% 20%, #7dd3fc 0 32%, transparent 33%), radial-gradient(ellipse at 52% 52%, #c4b5fd 0 34%, transparent 35%), linear-gradient(135deg, #fb7185, #818cf8 52%, #38bdf8)"
    },
    {
        name: "Monterey",
        background:
            "radial-gradient(ellipse at 8% 15%, #fb7185 0 28%, transparent 29%), radial-gradient(ellipse at 92% 88%, #38bdf8 0 32%, transparent 33%), conic-gradient(from 210deg at 50% 50%, #7c3aed, #ec4899, #f97316, #2563eb, #7c3aed)"
    },
    {
        name: "Ventura",
        background:
            "radial-gradient(ellipse at 20% 50%, rgba(254,240,138,.82) 0 18%, transparent 19%), radial-gradient(ellipse at 48% 45%, #fb7185 0 28%, transparent 29%), radial-gradient(ellipse at 78% 52%, #8b5cf6 0 30%, transparent 31%), linear-gradient(115deg, #f97316, #ec4899 48%, #4f46e5)"
    },
    {
        name: "Sonoma",
        background:
            "radial-gradient(ellipse at 50% 100%, #7c2d12 0 18%, transparent 19%), radial-gradient(ellipse at 25% 78%, #f97316 0 28%, transparent 29%), radial-gradient(ellipse at 78% 72%, #c026d3 0 30%, transparent 31%), linear-gradient(165deg, #1d4ed8, #7c3aed 42%, #f43f5e 72%, #f59e0b)"
    },
    {
        name: "Sequoia",
        background:
            "radial-gradient(ellipse at 20% 90%, #064e3b 0 30%, transparent 31%), radial-gradient(ellipse at 70% 95%, #14532d 0 38%, transparent 39%), linear-gradient(108deg, transparent 0 43%, rgba(255,255,255,.75) 44% 47%, #475569 48% 60%, transparent 61%), linear-gradient(165deg, #38bdf8, #fef3c7 52%, #166534)"
    },
    {
        name: "Tahoe",
        background:
            "radial-gradient(ellipse at 50% 92%, rgba(255,255,255,.82) 0 16%, transparent 17%), radial-gradient(ellipse at 22% 78%, #155e75 0 28%, transparent 29%), radial-gradient(ellipse at 78% 82%, #0f766e 0 30%, transparent 31%), linear-gradient(165deg, #7dd3fc, #bfdbfe 48%, #0e7490)"
    },
    {
        name: "Deep Space",
        background:
            "radial-gradient(circle at 20% 25%, #818cf8 0 2px, transparent 3px), radial-gradient(circle at 70% 35%, #fff 0 1px, transparent 2px), radial-gradient(circle at 80% 75%, #c4b5fd 0 2px, transparent 3px), linear-gradient(145deg, #020617, #172554)"
    }
];

function renderWallpaperChoices() {
    const wallpaperGrid =
        document.getElementById("wallpaper-grid");

    wallpaperGrid.replaceChildren();

    wallpapers.forEach((wallpaper, index) => {
        const button = document.createElement("button");
        const name = document.createElement("span");

        button.className = "wallpaper";
        button.type = "button";
        button.style.background = wallpaper.background;

        button.setAttribute(
            "aria-label",
            `Use ${wallpaper.name} wallpaper`
        );

        button.addEventListener("click", () => {
            changeWallpaper(index);
        });

        name.className = "wallpaper-name";
        name.textContent = wallpaper.name;

        button.append(name);
        wallpaperGrid.append(button);
    });
}

renderWallpaperChoices();

/* ===================================== */
/* BOOT AND LOGIN                        */
/* ===================================== */

window.addEventListener("load", () => {
    const delay = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches
        ? 250
        : 2500;

    window.setTimeout(() => {
        bootScreen.style.display = "none";
        loginScreen.style.display = "flex";

        document.getElementById("username").focus();
    }, delay);
});

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document
        .getElementById("username")
        .value.trim();

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

/* ===================================== */
/* WINDOWS                               */
/* ===================================== */

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
        .filter(
            (appWindow) =>
                appWindow.style.display === "block"
        )
        .sort(
            (a, b) =>
                Number(b.style.zIndex) -
                Number(a.style.zIndex)
        );
}

function closeActiveWindow() {
    const activeWindow = getOpenWindows()[0];

    if (activeWindow) {
        activeWindow.style.display = "none";
    }
}

function showNovaPrompt(title, message) {
    document.getElementById("prompt-title").textContent =
        title;

    document.getElementById("prompt-heading").textContent =
        title;

    document.getElementById("prompt-message").textContent =
        message;

    openApp("system-prompt");
}

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
        if (
            event.target.closest("button") ||
            window.innerWidth <= 650
        ) {
            return;
        }

        const bounds = appWindow.getBoundingClientRect();

        dragOffsetX = event.clientX - bounds.left;
        dragOffsetY = event.clientY - bounds.top;

        titlebar.setPointerCapture(event.pointerId);

        bringToFront(appWindow);
    });

    titlebar.addEventListener("pointermove", (event) => {
        if (
            !titlebar.hasPointerCapture(event.pointerId)
        ) {
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

        appWindow.style.left = `${nextLeft}px`;
        appWindow.style.top = `${nextTop}px`;
    });
});

/* ===================================== */
/* BROWSER                               */
/* ===================================== */

browserForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = browserSearch.value.trim();

    if (!query) {
        browserSearch.focus();
        return;
    }

    const looksLikeUrl =
        query.includes(".") && !query.includes(" ");

    const target = looksLikeUrl
        ? /^https?:\/\//i.test(query)
            ? query
            : `https://${query}`
        : `https://www.google.com/search?q=${encodeURIComponent(
              query
          )}`;

    window.open(
        target,
        "_blank",
        "noopener,noreferrer"
    );
});

/* ===================================== */
/* APP STORE AND START MENU              */
/* ===================================== */

function saveInstalledApps() {
    try {
        localStorage.setItem(
            "novaInstalledApps",
            JSON.stringify([...installedApps])
        );
    } catch {
        // NovaOS still works if browser storage is unavailable.
    }
}

function syncInstalledApps() {
    document
        .querySelectorAll("[data-install-app]")
        .forEach((button) => {
            const appId = button.dataset.installApp;
            const isInstalled = installedApps.has(appId);

            button.textContent = isInstalled
                ? "Open"
                : "Install";

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

function filterStartApps() {
    const query = startSearch.value
        .trim()
        .toLowerCase();

    let visibleApps = 0;

    document.querySelectorAll(".start-app").forEach((button) => {
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

    document.getElementById("start-empty").hidden =
        visibleApps !== 0;
}

startSearch.addEventListener("input", filterStartApps);

storeSearch.addEventListener("input", () => {
    const query = storeSearch.value
        .trim()
        .toLowerCase();

    let visibleApps = 0;
    let visibleAvailableApps = 0;
    let visibleSoonApps = 0;

    document
        .querySelectorAll(".store-card, .soon-card")
        .forEach((card) => {
            const matches =
                card.dataset.storeName.includes(query);

            card.hidden = !matches;

            if (matches) {
                visibleApps += 1;

                if (card.classList.contains("store-card")) {
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

    document.getElementById("store-empty").hidden =
        visibleApps !== 0;
});

try {
    const savedApps = JSON.parse(
        localStorage.getItem("novaInstalledApps") || "[]"
    );

    installedApps = new Set(
        Array.isArray(savedApps) ? savedApps : []
    );
} catch {
    installedApps = new Set();
}

syncInstalledApps();

/* ===================================== */
/* NOTES                                 */
/* ===================================== */

try {
    notesTextarea.value =
        localStorage.getItem("novaNotes") || "";
} catch {
    notesTextarea.value = "";
}

notesTextarea.addEventListener("input", () => {
    const status = document.getElementById("notes-status");

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

/* ===================================== */
/* PAINT                                 */
/* ===================================== */

const paintContext = paintCanvas.getContext("2d");
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
    const bounds = paintCanvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - bounds.left) *
            (paintCanvas.width / bounds.width),

        y:
            (event.clientY - bounds.top) *
            (paintCanvas.height / bounds.height)
    };
}

paintCanvas.addEventListener("pointerdown", (event) => {
    isPainting = true;

    paintCanvas.setPointerCapture(event.pointerId);

    const point = getPaintPoint(event);

    paintContext.fillStyle = paintColour.value;
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
    paintContext.moveTo(point.x, point.y);
});

paintCanvas.addEventListener("pointermove", (event) => {
    if (!isPainting) {
        return;
    }

    const point = getPaintPoint(event);

    paintContext.lineTo(point.x, point.y);
    paintContext.strokeStyle = paintColour.value;
    paintContext.lineWidth = Number(paintSize.value);
    paintContext.lineCap = "round";
    paintContext.lineJoin = "round";
    paintContext.stroke();
});

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

document
    .getElementById("paint-clear")
    .addEventListener("click", resetPaintCanvas);

document
    .getElementById("paint-save")
    .addEventListener("click", () => {
        const downloadLink =
            document.createElement("a");

        downloadLink.download = "nova-paint.png";

        downloadLink.href =
            paintCanvas.toDataURL("image/png");

        downloadLink.click();
    });

resetPaintCanvas();

/* ===================================== */
/* CALCULATOR                            */
/* ===================================== */

function updateCalculatorDisplay(value) {
    calculatorDisplay.value =
        value
            .replaceAll("*", "×")
            .replaceAll("/", "÷") || "0";
}

document
    .querySelectorAll("[data-calculator-value]")
    .forEach((button) => {
        button.addEventListener("click", () => {
            if (calculatorDisplay.value === "Error") {
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
    .querySelectorAll("[data-calculator-action]")
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
                    calculatorDisplay.value = "Error";
                    calculatorExpression = "";
                    return;
                }

                try {
                    const result = Function(
                        `"use strict"; return (${calculatorExpression})`
                    )();

                    if (!Number.isFinite(result)) {
                        throw new Error("Invalid result");
                    }

                    calculatorExpression = String(
                        Number(result.toFixed(10))
                    );

                    updateCalculatorDisplay(
                        calculatorExpression
                    );
                } catch {
                    calculatorDisplay.value = "Error";
                    calculatorExpression = "";
                }
            }
        });
    });

/* ===================================== */
/* CLOCK AND WALLPAPER                   */
/* ===================================== */

function updateClock() {
    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleString([], {
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
        // NovaOS still works when browser storage is unavailable.
    }
}

/* ===================================== */
/* TOP MENUS                             */
/* ===================================== */

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

            closeStartMenu();
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

document.addEventListener("focusin", (event) => {
    if (event.target instanceof HTMLInputElement) {
        lastFocusedInput = event.target;
    }
});

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

            if (action === "open-store") {
                openApp("store");
            }

            if (action === "close-active") {
                closeActiveWindow();
            }

            if (action === "next-wallpaper") {
                changeWallpaper(
                    (currentWallpaperIndex + 1) %
                        wallpapers.length
                );
            }

            if (action === "lock") {
                lockNovaOS();
            }

            if (action === "select-all") {
                const activeField = lastFocusedInput;

                if (
                    activeField instanceof HTMLInputElement
                ) {
                    activeField.focus();
                    activeField.select();
                } else {
                    showNovaPrompt(
                        "Edit",
                        "Click inside a text field first, then choose Select All."
                    );
                }
            }

            if (action === "clear-field") {
                const activeField = lastFocusedInput;

                if (
                    activeField instanceof HTMLInputElement
                ) {
                    activeField.value = "";
                    activeField.focus();
                } else {
                    showNovaPrompt(
                        "Edit",
                        "Click inside a text field first, then choose Clear Field."
                    );
                }
            }

            if (action === "fullscreen") {
                try {
                    if (document.fullscreenElement) {
                        await document.exitFullscreen();
                    } else {
                        await document.documentElement.requestFullscreen();
                    }
                } catch {
                    showNovaPrompt(
                        "Full Screen",
                        "Your browser did not allow NovaOS to enter full screen."
                    );
                }
            }

            if (action === "shortcuts") {
                showNovaPrompt(
                    "Keyboard Shortcuts",
                    "Esc — close the active window\nCtrl+A — select text\nEnter — submit login or browser search"
                );
            }

            if (action === "about") {
                showNovaPrompt(
                    "About NovaOS",
                    "NovaOS is a browser-based desktop experience built with HTML, CSS, and JavaScript."
                );
            }
        });
    });

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

/* ===================================== */
/* RESTORE SAVED WALLPAPER               */
/* ===================================== */

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

/* ===================================== */
/* KEYBOARD AND CLOCK                    */
/* ===================================== */

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const openMenu =
        document.querySelector(".top-menu.open");

    if (openMenu) {
        closeTopMenus();
    } else if (startMenu.classList.contains("open")) {
        closeStartMenu();
    } else {
        closeActiveWindow();
    }
});

window.setInterval(updateClock, 1000);
updateClock();