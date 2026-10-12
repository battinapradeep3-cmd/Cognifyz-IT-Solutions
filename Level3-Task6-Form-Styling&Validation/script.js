
/* ==========================================
   EDUNOVA | FORM VALIDATION & INTERACTIONS
   ========================================== */

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("admissionForm");
  const formMessage = document.getElementById("formMessage");
  const progressBar = document.getElementById("formProgress");
  const submitButton = document.getElementById("submitButton");

  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "dob",
    "qualification",
    "course",
    "address"
  ];

  // Footer year
  document.getElementById("currentYear").textContent =
    new Date().getFullYear();

  // Do not allow a future date of birth
  const dobInput = document.getElementById("dob");
  const today = new Date();
  const localToday =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

  dobInput.max = localToday;

  // Mobile navigation
  menuToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Validation rules
  function validateField(field) {
    const value = field.value.trim();
    let error = "";

    switch (field.id) {
      case "fullName":
        if (!value) {
          error = "Please enter your full name.";
        } else if (value.length < 3) {
          error = "Name must contain at least 3 characters.";
        } else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(value)) {
          error = "Please enter a valid name.";
        }
        break;

      case "email":
        if (!value) {
          error = "Please enter your email address.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          error = "Please enter a valid email address.";
        }
        break;

      case "phone":
        if (!value) {
          error = "Please enter your mobile number.";
        } else if (!/^[6-9]\d{9}$/.test(value)) {
          error = "Enter a valid 10-digit Indian mobile number.";
        }
        break;

      case "dob":
        if (!value) {
          error = "Please select your date of birth.";
        } else if (value > localToday) {
          error = "Date of birth cannot be in the future.";
        } else {
          const birthDate = new Date(value + "T00:00:00");
          const currentDate = new Date(localToday + "T00:00:00");
          let age = currentDate.getFullYear() - birthDate.getFullYear();

          const monthDifference =
            currentDate.getMonth() - birthDate.getMonth();

          if (
            monthDifference < 0 ||
            (monthDifference === 0 &&
              currentDate.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          if (age < 1) {
            error = "Please enter a valid date of birth.";
          }
        }
        break;

      case "qualification":
        if (!value) {
          error = "Please select your qualification.";
        }
        break;

      case "course":
        if (!value) {
          error = "Please select an interested course.";
        }
        break;

      case "address":
        if (!value) {
          error = "Please enter your address.";
        } else if (value.length < 10) {
          error = "Please enter a more complete address.";
        }
        break;
    }

    const errorElement = document.getElementById(field.id + "Error");

    if (errorElement) {
      errorElement.textContent = error;
    }

    field.classList.toggle("is-invalid", Boolean(error));
    field.classList.toggle(
      "is-valid",
      !error && value.length > 0
    );

    field.setAttribute("aria-invalid", String(Boolean(error)));

    return error === "";
  }

  // Consent checkbox validation
  function validateConsent() {
    const consent = document.getElementById("consent");
    const consentError = document.getElementById("consentError");

    if (!consent.checked) {
      consentError.textContent =
        "Please confirm the information before submitting.";
      return false;
    }

    consentError.textContent = "";
    return true;
  }

  // Update form progress indicator
  function updateProgress() {
    const completedFields = requiredFields.filter(function (id) {
      const field = document.getElementById(id);

      if (!field.value.trim()) {
        return false;
      }

      return validateField(field);
    }).length;

    const consent = document.getElementById("consent");
    const totalItems = requiredFields.length + 1;
    const completedItems = completedFields + (consent.checked ? 1 : 0);
    const percentage = Math.round(
      (completedItems / totalItems) * 100
    );

    progressBar.style.width = percentage + "%";
  }

  // Real-time validation
  requiredFields.forEach(function (id) {
    const field = document.getElementById(id);

    field.addEventListener("blur", function () {
      validateField(field);
      updateProgress();
    });

    field.addEventListener("input", function () {
      if (field.classList.contains("is-invalid")) {
        validateField(field);
      }

      formMessage.classList.remove("show", "error");
      updateProgress();
    });

    field.addEventListener("change", function () {
      if (field.classList.contains("is-invalid")) {
        validateField(field);
      }

      updateProgress();
    });
  });

  // Allow only digits in the mobile number field
  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", function () {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  document.getElementById("consent").addEventListener("change", function () {
    validateConsent();
    updateProgress();
    formMessage.classList.remove("show", "error");
  });

  // Form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    formMessage.classList.remove("show", "error");
    formMessage.textContent = "";

    let formIsValid = true;

    requiredFields.forEach(function (id) {
      const field = document.getElementById(id);
      const isValid = validateField(field);

      if (!isValid) {
        formIsValid = false;
      }
    });

    if (!validateConsent()) {
      formIsValid = false;
    }

    updateProgress();

    if (!formIsValid) {
      formMessage.classList.add("show", "error");
      formMessage.innerHTML =
        "<strong>Please check your details.</strong>" +
        "Correct the highlighted fields and try again.";

      const firstInvalidField = form.querySelector(
        ".is-invalid, #consent:not(:checked)"
      );

      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      return;
    }

    // Demo success only: no server request or data storage
    const studentName = document.getElementById("fullName").value.trim();
    const selectedCourse = document.getElementById("course").value;

    formMessage.classList.add("show");
    formMessage.innerHTML =
      "<strong>✓ Application validated successfully!</strong>" +
      "Thank you, " + escapeHTML(studentName) + ". " +
      "Your form passed the browser validation checks. " +
      "Selected course: " + escapeHTML(selectedCourse) + ". " +
      "This is a demo confirmation; your application has not been " +
      "sent to an institution or saved to a database.";

    formMessage.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });

  // Safely display user-entered text in the confirmation
  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, function (character) {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[character];
    });
  }

  // Active navigation link while scrolling
  const sections = document.querySelectorAll(
    "#home, #benefits, #admission, #footer"
  );

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const activeId = entry.target.id;

            navLinks.querySelectorAll(".nav-link").forEach(function (link) {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + activeId
              );
            });
          }
        });
      },
      {
        rootMargin: "-25% 0px -60% 0px"
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  updateProgress();
});
