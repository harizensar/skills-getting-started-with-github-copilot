document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const API_BASE = "/activities";

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Ensure we always get fresh data (avoid cached responses)
      const response = await fetch(API_BASE, { cache: "no-store" });
      const activities = await response.json();
      displayActivities(activities);
      populateActivityDropdown(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function displayActivities(activities) {
    activitiesList.innerHTML = "";

    Object.entries(activities).forEach(([name, activity]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const participantsList = activity.participants
        .map(
          (p) =>
            `<li class="participant-item">${p} <button class="unregister-btn" data-activity="${name}" data-email="${p}" title="Unregister">🗑️</button></li>`
        )
        .join("");

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p><strong>Description:</strong> ${activity.description}</p>
        <p><strong>Schedule:</strong> ${activity.schedule}</p>
        <p><strong>Capacity:</strong> ${activity.participants.length}/${activity.max_participants}</p>
        <div class="participants-section">
          <h5>Current Participants</h5>
          <ul class="participants-list">
            ${participantsList || "<li style='color: #999;'>No participants yet</li>"}
          </ul>
          <div class="participants-count">${activity.participants.length} of ${activity.max_participants} spots filled</div>
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });
  }

  // Handle unregister button clicks (event delegation)
  activitiesList.addEventListener("click", async (evt) => {
    const btn = evt.target.closest(".unregister-btn");
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const res = await fetch(
        `${API_BASE}/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await res.json();

      if (res.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  });

  function populateActivityDropdown(activities) {
    activitySelect.innerHTML = "";

    Object.keys(activities).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(`${API_BASE}/${activity}/signup?email=${email}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
