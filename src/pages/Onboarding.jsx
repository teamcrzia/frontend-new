import React, { useState } from "react";
import "../styles/Onboarding.css";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getDaysInMonth = (month, year) => {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const Onboarding = () => {
  const navigate = useNavigate();

  // 🎨 Sync theme preference on page load/refresh
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // 🔄 Initialize state from localStorage if it exists, otherwise use defaults
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("onboarding_step");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("onboarding_form");
    return savedForm ? JSON.parse(savedForm) : {
      name: "",
      dobDay: "",
      dobMonth: "",
      dobYear: "",
      role: "",
    };
  });

  const [error, setError] = useState("");

  // 💾 Automatically save form changes and step progress to localStorage
  React.useEffect(() => {
    localStorage.setItem("onboarding_form", JSON.stringify(form));
  }, [form]);

  React.useEffect(() => {
    localStorage.setItem("onboarding_step", step.toString());
  }, [step]);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    setError("");
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.name.trim()) return "Please enter your name";
        break;
      case 2:
        if (!form.dobDay || !form.dobMonth || !form.dobYear)
          return "Please select your complete date of birth";
        break;
      case 3:
        if (!form.role) return "Please choose your role";
        break;
      default:
        return "";
    }
    return "";
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setStep(step + 1);
  };

  // 🔥 FINAL SUBMIT TO MONGO BACKEND
  const handleSubmit = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("User not logged in");
        return;
      }

      const token = await user.getIdToken();

      // Pad month and day to ensure two digits (e.g. '05')
      const paddedMonth = form.dobMonth.toString().padStart(2, "0");
      const paddedDay = form.dobDay.toString().padStart(2, "0");
      const formattedDob = `${form.dobYear}-${paddedMonth}-${paddedDay}`;

      const res = await fetch("http://127.0.0.1:8000/save-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          dob: formattedDob,
          role: form.role
        })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // ✨ Clear onboarding session storage since registration is fully complete
        localStorage.removeItem("onboarding_form");
        localStorage.removeItem("onboarding_step");

        // 🔥 Skip the success modal — go straight into chat
        navigate("/chat");
      }

    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  const progress = (step / 4) * 100;

  const maxDays = getDaysInMonth(
    parseInt(form.dobMonth),
    parseInt(form.dobYear)
  );

  return (
    <div className="onboard-container">
      <div className="onboard-card">
        
        {step > 1 ? (
          <button 
            className="minimal-back-arrow" 
            onClick={() => {
              setError("");
              setStep((prev) => prev - 1);
            }}
          >
            ←
          </button>
        ) : (
          <button 
            className="minimal-back-arrow" 
            onClick={async () => {
              try {
                const authInstance = getAuth();
                await authInstance.signOut();
                localStorage.removeItem("onboarding_form");
                localStorage.removeItem("onboarding_step");
                navigate("/login");
              } catch (err) {
                console.error("Error signing out:", err);
              }
            }}
          >
            ←
          </button>
        )}

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">Step {step} of 4</span>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2>What's your name?</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <button onClick={next}>Next →</button>
          </>
        )}

        {/* STEP 2 — Enhanced DOB */}
        {step === 2 && (
          <>
            <h2>Date of Birth</h2>
            <p className="dob-subtitle">This helps us personalize your experience</p>
            <div className="dob-picker">
              <div className="dob-select-group">
                <label className="dob-label">Day</label>
                <select
                  className="dob-select"
                  value={form.dobDay}
                  onChange={(e) => handleChange("dobDay", e.target.value)}
                >
                  <option value="">—</option>
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="dob-select-group">
                <label className="dob-label">Month</label>
                <select
                  className="dob-select"
                  value={form.dobMonth}
                  onChange={(e) => handleChange("dobMonth", e.target.value)}
                >
                  <option value="">—</option>
                  {months.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="dob-select-group">
                <label className="dob-label">Year</label>
                <select
                  className="dob-select"
                  value={form.dobYear}
                  onChange={(e) => handleChange("dobYear", e.target.value)}
                >
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {form.dobDay && form.dobMonth && form.dobYear && (
              <div className="dob-preview">
                📅 {form.dobDay} {months[parseInt(form.dobMonth) - 1]}, {form.dobYear}
              </div>
            )}
            {error && <p className="error">{error}</p>}
            <button onClick={next}>Next →</button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h2>Your Role</h2>
            <div className="options">
              {["Student", "Creator", "Developer", "Job Seeker", "General"].map((role) => (
                <button
                  key={role}
                  className={form.role === role ? "option active" : "option"}
                  onClick={() => handleChange("role", role)}
                >
                  {role}
                </button>
              ))}
            </div>
            {error && <p className="error">{error}</p>}
            <button onClick={next}>Next →</button>
          </>
        )}

        {/* STEP 4 (final) */}
        {step === 4 && (
          <>
            <h2>You're all set!</h2>
            <p style={{ color: "#94a3b8", marginBottom: "32px", fontSize: "0.95rem" }}>
              Your profile has been configured securely with your preferences.
            </p>
            {error && <p className="error" style={{ marginBottom: "16px" }}>{error}</p>}
            <button className="done-btn" onClick={handleSubmit}>
              Finish & Launch Chat →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;