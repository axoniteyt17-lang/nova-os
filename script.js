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

function login(event) {

    // Stops the form refreshing the page
    if (event) {
        event.preventDefault();
    }


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

let windowLayer = 10;


function openApp(app) {

    let window = document.getElementById(app);

    window.style.display = "block";

    windowLayer++;

    window.style.zIndex = windowLayer;

}


// =====================
// CLOSE APPS
// =====================

function closeApp(app) {

    document.getElementById(app).style.display = "none";

}


// =====================
// BRING WINDOWS TO FRONT
// =====================

document.addEventListener("click", function(event){

    let appWindow = event.target.closest(".window");

    if(appWindow){

        windowLayer++;

        appWindow.style.zIndex = windowLayer;

    }

});


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