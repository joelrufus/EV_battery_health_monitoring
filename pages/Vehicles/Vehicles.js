document.getElementById("vehicle-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in!");
        return;
    }

    const vehicleData = {
        vehicleName: document.getElementById("vehicleName").value,
        vehicleModel: document.getElementById("vehicleModel").value,
        batteryCapacity: document.getElementById("batteryCapacity").value,
        vehicleAge: document.getElementById("vehicleAge").value,
        userType: document.getElementById("userType").value // <-- Add this
    };

    const res = await fetch("http://localhost:5000/api/vehicles/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(vehicleData)
    });

    const data = await res.json();
    if (res.ok) {
        // Show success popup
        showPopup("Vehicle created successfully!");
        fetchVehicles();
    } else {
        alert(data.message);
    }
});

// Function to show success notification
function showPopup(message) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.textContent = message;

    document.body.appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 3000); // Remove popup after 3 seconds
}

// Fetch Vehicles
async function fetchVehicles() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("http://localhost:5000/api/vehicles/my-vehicles", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const vehicles = await res.json();
    const list = document.getElementById("vehicle-list");
    list.innerHTML = "";
    vehicles.forEach(vehicle => {
        const li = document.createElement("li");
        li.textContent = `${vehicle.vehicleName || "Unnamed Vehicle"} - ${vehicle.vehicleModel}`;
        list.appendChild(li);
    });
}

fetchVehicles();
