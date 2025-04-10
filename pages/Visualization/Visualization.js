document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in!");
        window.location.href = "../Login/Login.html";
        return;
    }

    // Fetch and display session history
    async function viewSessions() {
        const res = await fetch("http://localhost:5000/api/vehicles/my-vehicles", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const vehicles = await res.json();
        const sessionList = document.getElementById("session-list");
        sessionList.innerHTML = "";

        for (let vehicle of vehicles) {
            const resSessions = await fetch(`http://localhost:5000/api/sessions/vehicle/${vehicle._id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const sessions = await resSessions.json();
            sessions.forEach(session => {
                const li = document.createElement("li");
                li.textContent = `${vehicle.vehicleModel} - Session: ${session.startSoC}% to ${session.endSoC}%`;
                sessionList.appendChild(li);
            });
        }
    }

    viewSessions();
});

// Function to navigate between pages
function navigateTo(page) {
    window.location.href = page;
}
