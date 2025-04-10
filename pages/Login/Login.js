document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userEmail", data.user.email); // Store email for dashboard
            
            // ✅ Directly redirect to Dashboard **without alert**
            window.location.replace("../Dashboard/Dashboard.html");
        } else {
            alert(data.message || "Login failed!");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred while logging in.");
    }
});
