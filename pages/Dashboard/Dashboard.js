document.addEventListener("DOMContentLoaded", () => {
    // Display User Email from localStorage
    const userEmail = localStorage.getItem("userEmail");

    if (userEmail) {
        document.getElementById("user-email").textContent = `Logged in as: ${userEmail}`;
    } else {
        // Redirect to login if not authenticated
        window.location.href = "../Login/Login.html";
    }

    // Logout Functionality
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            window.location.href = "../Login/Login.html";
        });
    }
});

// Navigation for local static pages
function navigateTo(page) {
    window.location.href = `../${page}`;
}

// Navigation to Flask-powered prediction page
function navigateToFlaskPrediction() {
    window.location.href = "http://127.0.0.1:5000/";
}
