import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Pages Css/landing.css";
import { ThemeContext } from "../context/ThemeContext";

const AquaSense = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");
  const { theme } = useContext(ThemeContext);

  // State for contact form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  // State for form submission status
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', 'submitting'

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleNavLinkClick = (e, sectionId) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".aquasense-navigation a");

    const handleScroll = () => {
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 80; // Adjust offset for fixed navbar
        if (window.scrollY >= sectionTop) {
          current = section.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href").includes(current)) {
          link.classList.add("active");
        }
      });

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Handle input changes for the contact form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle contact form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus("submitting");

    try {
      // Replace with your actual backend API URL
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" }); // Clear form
        alert("Message sent successfully!");
      } else {
        const errorData = await response.json();
        setSubmitStatus("error");
        alert(`Failed to send message: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      setSubmitStatus("error");
      alert("An error occurred while sending the message. Please try again later.");
      console.error("Error submitting contact form:", error);
    }
  };

  return (
    <div className={`aquasense-main-container ${theme}`}>
      {/* Navbar */}
      <nav className="aquasense-navbar">
        <h1 className="aquasense-brand">AQUASENSE</h1>
        <ul className="aquasense-navigation">
          <li>
            <a
              href="#home"
              className={`nav-link-home ${activeSection === "home" ? "active" : ""}`}
              onClick={(e) => handleNavLinkClick(e, "home")}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#about"
              className={`nav-link-about ${activeSection === "about" ? "active" : ""}`}
              onClick={(e) => handleNavLinkClick(e, "about")}
            >
              About
            </a>
          </li>
          <li>
            <a
              href="#services"
              className={`nav-link-services ${activeSection === "services" ? "active" : ""}`}
              onClick={(e) => handleNavLinkClick(e, "services")}
            >
              Services
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className={`nav-link-contact ${activeSection === "contact" ? "active" : ""}`}
              onClick={(e) => handleNavLinkClick(e, "contact")}
            >
              Contact
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header id="home" className="aquasense-hero-section">
        <h2 className="hero-welcome-text">Welcome to Aquasense Solution</h2>
        <h1 className="hero-main-title">Water Quality Monitoring System</h1>
        <p className="hero-description">Aquasense Solution is a real-time water quality monitoring solution designed to ensure the safety, cleanliness, and sustainability of water sources. With smart sensors and an intuitive dashboard, we help communities and organizations detect water quality issues early because clean water is a right, not a privilege.</p>
        <button className="hero-btn-contact" onClick={handleLoginClick}>
          Get in Touch
        </button>
      </header>

      <section id="about" className="aquasense-about-section">
        <div className="about-container">
          {/* Left Side - Image */}
          <div className="about-image">
            {/* <img src="your-image-path/image.png" /> */}
          </div>

          {/* Right Side - Content */}
          <div className="about-content">
            <p className="about-subtitle">ABOUT US</p>
            <h3 className="about-heading">When It Comes To H2O, We Don’t Go With The Flow</h3>
            <p className="about-description">
              AquaSense is developed to support sustainable water monitoring and public health protection. We empower the Environment and Sanitary Office of the City Health Office of General Trias Cavite by providing real-time data, alerts, and visual insights that help their staff detect fluctuations in water quality, enabling timely and informed decisions. Our goal is to strengthen local efforts in ensuring clean and safe water for every community.
            </p>
            <button className="about-btn-learn-more">Read More</button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="aquasense-services-section">
        <div className="services-info">
          <h3 className="services-header">Our Services</h3>
          <h2 className="services-main-title">
            Experience The Power Of <span className="highlight-text">Innovation.</span>
          </h2>
          <p className="services-description">
            We harness the potential of emerging technologies to redefine how water quality is monitored. AquaSense integrates smart sensors, microcontrollers, and cloud-based platforms to provide real-time data collection, intuitive dashboards, and automated alert systems. Our goal is to help local health units and environmental offices make faster, evidence-based decisions, all in one seamless system.
          </p>
          <button className="services-btn-view-all">View All</button>
        </div>

        <div className="services-list">
          <div className="service-card sanitation">
            <h4 className="service-title">Water Sanitation</h4>
            <p className="service-description">Track vital indicators to support water safety and sanitation efforts.<br></br>
              → Real-time detection of contaminants<br></br>
              → Data logging for traceability<br></br>
              → Support for regulatory compliance</p>
          </div>
          <div className="service-card monitoring">
            <h4 className="service-title">Real-Time Monitoring</h4>
            <p className="service-description">Stay informed with instant updates on water quality metrics such as pH, turbidity, total dissolved solids, conductivity, temperature, and more, helping decision-makers respond before it’s too late.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="aquasense-contact-section">
        <div className="contact-container">
          <div className="contact-info">
            <h2 className="contact-title">
              GET IN <span className="highlight-text">TOUCH</span>
            </h2>
            <hr className="contact-divider" />
            <p className="contact-description">
              City Health Office - General Trias City: <br></br>The main mover & excellent provider of quality health services with 41 Health Stations under 33 brgys
            </p>

            <div className="contact-details">
              <div className="contact-item">
                <img src="/src/assets/location.png" alt="Location" className="contact-icon" />
                <div>
                  <h4>Office Address</h4>
                  <p>Hospital Area, Brgy. Pinagtipunan, General Trias, Philippines</p>
                </div>
              </div>

              <div className="contact-item">
                <img src="/src/assets/telephone.png" alt="Phone" className="contact-icon" />
                <div>
                  <h4>Call Us</h4>
                  <p>(046) 509 5289</p>
                </div>
              </div>

              <div className="contact-item">
                <img src="/src/assets/gmail.png" alt="Mail" className="contact-icon" />
                <div>
                  <h4>Mail Us</h4>
                  <p>chogentri@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />

              <label htmlFor="email">Your Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Enter your message"
                value={formData.message}
                onChange={handleInputChange}
                required
              ></textarea>

              <button className="btn-submit" type="submit" disabled={submitStatus === "submitting"}>
                {submitStatus === "submitting" ? "Sending..." : "Send Message"}
              </button>
              {submitStatus === "error" && <p className="error-message">Failed to send message. Please try again.</p>}
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <h2 className="footer-title">AQUASENSE</h2>
        <p className="footer-text">
          {/* Add any footer text here if needed */}
        </p>
        <div className="footer-socials">
          <a href="#"><img src="/src/assets/facebook.png" alt="Facebook" /></a>
          <a href="#"><img src="/src/assets/instagram.png" alt="Instagram" /></a>
          <a href="#"><img src="/src/assets/whatsapp.png" alt="WhatsApp" /></a>
          <a href="#"><img src="/src/assets/linkedin.png" alt="LinkedIn" /></a>
          <a href="#"><img src="/src/assets/pinterest.png" alt="Pinterest" /></a>
          <a href="#"><img src="/src/assets/x.png" alt="Twitter" /></a>
        </div>
        <p className="footer-copyright">
          Copyright © 2003-2023 Creatic Agency. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default AquaSense;