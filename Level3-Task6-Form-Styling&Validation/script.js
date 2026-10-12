
"use strict";

// Get form elements
const admissionForm = document.getElementById("admissionForm");
const formMessage = document.getElementById("formMessage");
const resultSection = document.getElementById("resultSection");
const studentSummary = document.getElementById("studentSummary");
const applicationId = document.getElementById("applicationId");
const successText = document.getElementById("successText");
const editButton = document.getElementById("editButton");

const fields = [
    "fullName",
    "dob",
    "email",
    "phone",
    "gender",
    "qualification",
    "course",
    "studyMode",
    "address"
];

// Set current year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Prevent selecting a future date of birth
const dobInput = document.getElementById("dob");
const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

dobInput.max = localToday;

// Validation rules
function validateField(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + "Error");
    const value = input.value.trim();

    let errorMessage = "";

    switch (fieldId) {
        case "fullName": {
            if (!value) {
                errorMessage = "Please enter your full name.";
            } else if (value.length < 3) {
                errorMessage = "Name must contain at least 3 characters.";
            } else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(value)) {
                errorMessage = "Enter a valid name using letters only.";
            } else if (value.length > 80) {
                errorMessage = "Name cannot exceed 80 characters.";
            }
            break;
        }

        case "dob": {
            if (!value) {
                errorMessage = "Please select your date of birth.";
            } else {
                const selectedDate = new Date(value + "T00:00:00");
                const currentDate = new Date(localToday + "T00:00:00");

                if (Number.isNaN(selectedDate.getTime())) {
                    errorMessage = "Please enter a valid date.";
                } else if (selectedDate > currentDate) {
                    errorMessage = "Date of birth cannot be in the future.";
                }
            }
            break;
        }

        case "email": {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

            if (!value) {
                errorMessage = "Please enter your email address.";
            } else if (value.length > 254 || !emailPattern.test(value)) {
                errorMessage = "Please enter a valid email address.";
            }
            break;
        }

        case "phone": {
            if (!value) {
                errorMessage = "Please enter your mobile number.";
            } else if (!/^[6-9]\d{9}$/.test(value)) {
                errorMessage = "Enter a valid 10-digit Indian mobile number.";
            }
            break;
        }

        case "gender": {
            if (!value) {
                errorMessage = "Please select your gender.";
            }
            break;
        }

        case "qualification": {
            if (!value) {
                errorMessage = "Please select your qualification.";
            }
            break;
        }

        case "course": {
            if (!value) {
                errorMessage = "Please select your preferred course.";
            }
            break;
        }

        case "studyMode": {
            if (!value) {
                errorMessage = "Please select your study mode.";
            }
            break;
        }

        case "address": {
            if (!value) {
                errorMessage = "Please enter your residential address.";
            } else if (value.length < 10) {
                errorMessage = "Address must contain at least 10 characters.";
            } else if (value.length > 500) {
                errorMessage = "Address cannot exceed 500 characters.";
            }
            break;
        }

        default:
            break;
    }

    showFieldResult(input, error, errorMessage);
    return errorMessage === "";
}

// Display validation result
function showFieldResult(input, error, message) {
    error.textContent = message;

    input.classList.toggle("invalid", Boolean(message));
    input.classList.toggle(
        "valid",
        !message && input.value.trim() !== ""
    );

    input.setAttribute("aria-invalid", message ? "true" : "false");
}

// Show general form message
function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = "form-message show " + type;
}

// Clear general form message
function clearFormMessage() {
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

// Real-time validation when users type or change a selection
fields.forEach(function (fieldId) {
    const input = document.getElementById(fieldId);

    input.addEventListener("input", function () {
        if (input.classList.contains("invalid") || admissionForm.dataset.submitted === "true") {
            validateField(fieldId);
        }

        clearFormMessage();
    });

    input.addEventListener("change", function () {
        if (input.classList.contains("invalid") || admissionForm.dataset.submitted === "true") {
            validateField(fieldId);
        }

        clearFormMessage();
    });
});

// Allow only digits in the mobile number field
document.getElementById("phone").addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

// Validate consent checkbox
function validateConsent() {
    const consent = document.getElementById("consent");
    const error = document.getElementById("consentError");

    if (!consent.checked) {
        error.textContent = "Please confirm the information before submitting.";
        return false;
    }

    error.textContent = "";
    return true;
}

document.getElementById("consent").addEventListener("change", function () {
    if (this.checked) {
        document.getElementById("consentError").textContent = "";
    }

    clearFormMessage();
});

// Build a safe application summary
function displayStudentSummary() {
    const labels = {
        fullName: "Full Name",
        dob: "Date of Birth",
        email: "Email Address",
        phone: "Mobile Number",
        gender: "Gender",
        qualification: "Qualification",
        course: "Selected Course",
        studyMode: "Study Mode",
        address: "Residential Address"
    };

    studentSummary.replaceChildren();

    fields.forEach(function (fieldId) {
        const input = document.getElementById(fieldId);
        const item = document.createElement("div");
        const label = document.createElement("span");
        const value = document.createElement("strong");

        item.className = "summary-item";
        label.textContent = labels[fieldId];

        // Use textContent to avoid inserting user input as HTML
        value.textContent = input.value.trim();

        item.append(label, value);
        studentSummary.appendChild(item);
    });
}

// Generate a demo application reference
function generateApplicationId() {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    const datePart = localToday.replace(/-/g, "");

    return "EDU-" + datePart + "-" + randomPart;
}

// Submit the application
admissionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    admissionForm.dataset.submitted = "true";
    clearFormMessage();

    let formIsValid = true;
    let firstInvalidField = null;

    fields.forEach(function (fieldId) {
        const isValid = validateField(fieldId);

        if (!isValid) {
            formIsValid = false;

            if (!firstInvalidField) {
                firstInvalidField = document.getElementById(fieldId);
            }
        }
    });

    const consentIsValid = validateConsent();

    if (!consentIsValid) {
        formIsValid = false;

        if (!firstInvalidField) {
            firstInvalidField = document.getElementById("consent");
        }
    }

    if (!formIsValid) {
        showFormMessage(
            "Please correct the highlighted errors before submitting your application.",
            "error-message"
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

    // This is a front-end demo, not a real college submission.
    displayStudentSummary();

    applicationId.textContent = generateApplicationId();
    successText.textContent =
        "All required fields passed validation. Your demo application is ready.";

    resultSection.hidden = false;

    showFormMessage(
        "Validation successful! Your demo application summary is displayed below.",
        "success-message"
    );

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// Return to the form for editing
editButton.addEventListener("click", function () {
    resultSection.hidden = true;

    document.getElementById("admission").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("fullName").focus({
        preventScroll: true
    });
});

