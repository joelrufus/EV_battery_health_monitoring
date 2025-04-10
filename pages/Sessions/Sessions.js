document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in!");
        return;
    }

    try {
        // Fetch vehicles for dropdown
        const res = await fetch("http://localhost:5000/api/vehicles/my-vehicles", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch vehicles");
        }

        const vehicles = await res.json();
        const dropdown = document.getElementById("vehicleId");

        vehicles.forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle._id;
            option.textContent = `${vehicle.vehicleName || "Unnamed Vehicle"} - ${vehicle.vehicleModel}`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        alert("Error fetching vehicle data. Please try again.");
    }

    // Submit session form
    document.getElementById("session-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const sessionData = {
            startSoC: document.getElementById("startSoC").value,
            endSoC: document.getElementById("endSoC").value,
            chargingDuration: document.getElementById("chargingDuration").value,
            chargingRate: document.getElementById("chargingRate").value,
            distanceDriven: document.getElementById("distanceDriven").value,
            temperature: document.getElementById("temperature").value,
            chargerType: document.getElementById("chargerType").value
        };

        const vehicleId = document.getElementById("vehicleId").value;

        try {
            const res = await fetch(`http://localhost:5000/api/sessions/create/${vehicleId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(sessionData)
            });

            const data = await res.json();
            if (res.ok) {
                // ✅ Show success notification
                showPopup("✅ Session updated successfully!");
            } else {
                alert(data.message || "❌ Failed to update session.");
            }
        } catch (error) {
            console.error("Error submitting session:", error);
            alert("Error creating session. Please try again.");
        }
    });
});

// ✅ Popup notification display function
function showPopup(message) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.textContent = message;

    // Optional styling via JS
    popup.style.position = "fixed";
    popup.style.bottom = "30px";
    popup.style.right = "30px";
    popup.style.backgroundColor = "#4CAF50";
    popup.style.color = "#fff";
    popup.style.padding = "12px 20px";
    popup.style.borderRadius = "8px";
    popup.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    popup.style.fontSize = "16px";
    popup.style.zIndex = "1000";

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 3000); // Remove popup after 3 seconds
}
