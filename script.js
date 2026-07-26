function openApp(app){

    document.getElementById(app).style.display="block";

}


function closeApp(app){

    document.getElementById(app).style.display="none";

}


// Clock

function updateClock(){

    let time = new Date();

    document.getElementById("clock").textContent =
    time.toLocaleTimeString([], {
        hour:"2-digit",
        minute:"2-digit"
    });

}

setInterval(updateClock,1000);

updateClock();



// Wallpaper changer

function changeWallpaper(){

    let colours=[
        "linear-gradient(135deg,#2563eb,#7c3aed)",
        "linear-gradient(135deg,#10b981,#06b6d4)",
        "linear-gradient(135deg,#ef4444,#f59e0b)"
    ];

    document.getElementById("desktop").style.background =
    colours[Math.floor(Math.random()*colours.length)];

}
// Boot screen

window.onload = () => {

    setTimeout(() => {

        document.getElementById("boot").style.display = "none";

    }, 2500);

};