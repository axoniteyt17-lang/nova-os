// =====================
// NOVA OS JAVASCRIPT
// =====================


// Boot screen
window.onload = function () {

    setTimeout(() => {

        document.getElementById("boot").style.display = "none";
        document.getElementById("login").style.display = "flex";

    }, 2500);

};


// =====================
// LOGIN
// =====================

function login() {

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;


    if (username === "" || password === "") {

        alert("Please enter username and password");

    } else {

        document.getElementById("login").style.display = "none";
        document.getElementById("desktop").style.display = "block";

    }

}


// =====================
// OPEN APPS
// =====================

function openApp(app) {

    document.getElementById(app).style.display = "block";

}


// =====================
// CLOSE APPS
// =====================

function closeApp(app) {

    document.getElementById(app).style.display = "none";

}


// =====================
// CLOCK
// =====================

function updateClock() {

    let time = new Date();

    document.getElementById("clock").textContent =
        time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

}


setInterval(updateClock, 1000);

updateClock();


// =====================
// WALLPAPER
// =====================

function changeWallpaper(image) {

    document.body.style.backgroundImage = `url(${image})`;

}