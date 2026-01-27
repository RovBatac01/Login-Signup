import React, { useState, useEffect, useContext, useRef } from 'react';
import '../styles/Pages Css/landing-improved.css';
import { ThemeContext } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

// Import the AquaSense logo
import aquasenseLogo from '../assets/aquasense-logo.png';
import sensors from '../assets/sensors.png';

// Social media icons
import facebookIcon from '../assets/facebook.png';
import instagramIcon from '../assets/instagram.png';
import linkedinIcon from '../assets/linkedin.png';
import xIcon from '../assets/x.png';
import gmailIcon from '../assets/gmail.png';
import locationIcon from '../assets/location.png';
import telephoneIcon from '../assets/telephone.png';

const LandingImproved = () => {
  const { theme } = useContext(ThemeContext);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Handle clicks outside the mobile menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target) && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Show back to top button after scrolling down 300px
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }

      // Update active section based on scroll position
      const sections = ['home', 'about', 'services', 'contact'];
      const sectionElements = sections.map(id => 
        document.getElementById(id)
      );
      
      const currentSectionIndex = sectionElements.findIndex(section => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });
      
      if (currentSectionIndex !== -1) {
        setActiveSection(sections[currentSectionIndex]);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 70, // Offset for navbar height
        behavior: 'smooth'
      });
      // Close mobile menu after clicking
      setMobileMenuOpen(false);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Back to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission with timeout
    setTimeout(() => {
      setFormStatus({
        message: 'Your message has been sent successfully! We\'ll get back to you soon.',
        type: 'success'
      });
      setIsSubmitting(false);
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setFormStatus({ message: '', type: '' });
      }, 5000);
    }, 1500);
  };

  return (
    <div className={`aquasense-main-container ${theme}`}>
      {/* Navbar */}
      <nav className="aquasense-navbar" ref={navRef}>
        <div className="aquasense-brand-container">
          <img 
            src={aquasenseLogo} 
            alt="AquaSense Logo" 
            className="aquasense-logo" 
          />
          <div className="aquasense-brand">AQUASENSE</div>
        </div>
        
        {/* Mobile menu button */}
        <div className="mobile-menu-button" onClick={toggleMobileMenu}>
          <div className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        {/* Navigation links */}
        <ul className={`aquasense-navigation ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <li>
            <a 
              href="#home" 
              className={activeSection === 'home' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('home');
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a 
              href="#about" 
              className={activeSection === 'about' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
            >
              About
            </a>
          </li>
          <li>
            <a 
              href="#services" 
              className={activeSection === 'services' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('services');
              }}
            >
              Services
            </a>
          </li>
          <li>
            <a 
              href="#contact" 
              className={activeSection === 'contact' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}
            >
              Contact
            </a>
          </li>
          <li>
            <Link to="/login" className="nav-login-link">Login</Link>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section id="home" className="aquasense-hero-section">
        <div className="hero-content">
          <div className="hero-welcome-text">Welcome to AquaSense</div>
          <h1 className="hero-main-title">Water Quality Monitoring System</h1>
          <p className="hero-description">
            Real-time monitoring, advanced analytics, and data-driven insights for water quality management.
            Our innovative solutions help ensure safe and clean water for all your needs.
          </p>
          <div className="hero-buttons">
            <button 
              className="hero-btn-contact"
              onClick={() => scrollToSection('contact')}
            >
              Contact Us
            </button>
            <button 
              className="hero-btn-learn"
              onClick={() => scrollToSection('about')}
            >
              Learn More
            </button>
          </div>
        </div>
        <div 
          className="scroll-down"
          onClick={() => scrollToSection('about')}
        >
          <i className="fas fa-chevron-down"></i>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="aquasense-about-section">
        <div className="section-header">
          <div className="section-subtitle">About Us</div>
          <h2 className="section-title">Who We Are</h2>
        </div>
        <div className="about-container">
          {/* About image with logo */}
          <div className="about-image">
            <img 
              src={sensors} 
              alt="AquaSense Logo" 
              className="about-logo"
            />
          </div>
          
          <div className="about-content">
            <div className="about-subtitle">Our Story</div>
            <h3 className="about-heading">Leading Water Quality Monitoring Solutions</h3>
            <p className="about-description">
              AquaSense is a pioneering water quality monitoring system designed to provide real-time data and analytics 
              for various water environments. Our mission is to make water quality monitoring accessible, accurate, and 
              actionable for businesses, municipalities, and environmental agencies.
            </p>
            
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-icon">
                  <i className="fas fa-tachometer-alt"></i>
                </div>
                <div className="feature-text">
                  <h4>Real-time Monitoring</h4>
                  <p>24/7 continuous monitoring with instant alerts and notifications</p>
                </div>
              </div>
              
              <div className="about-feature">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="feature-text">
                  <h4>Data Analytics</h4>
                  <p>Advanced analytics to identify trends and potential issues</p>
                </div>
              </div>
              
              <div className="about-feature">
                <div className="feature-icon">
                  <i className="fas fa-cloud"></i>
                </div>
                <div className="feature-text">
                  <h4>Cloud Integration</h4>
                  <p>Secure cloud storage with seamless access from anywhere</p>
                </div>
              </div>
              
              <div className="about-feature">
                <div className="feature-icon">
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <div className="feature-text">
                  <h4>Mobile Access</h4>
                  <p>Monitor your water quality systems on any device</p>
                </div>
              </div>
            </div>
            
            <button 
              className="about-btn-learn-more"
              onClick={() => scrollToSection('services')}
            >
              Our Services
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="aquasense-services-section">
        <div className="services-bg-pattern"></div>
        <div className="services-container">
          <div className="services-info">
            <div className="services-header">What We Offer</div>
            <h2 className="services-main-title">Our <span className="highlight-text">Services</span></h2>
            <p className="services-description">
              We provide comprehensive water quality monitoring solutions tailored to meet the specific needs of various industries and applications.
            </p>
          </div>
          
          <div className="services-list">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-flask"></i>
              </div>
              <h3 className="service-title">Water Quality Testing</h3>
              <p className="service-description">
                Comprehensive testing of all essential parameters including pH, turbidity, conductivity, temperature, TDS, and more with precision and reliability.
              </p>
              <a href="#contact" className="service-link" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-desktop"></i>
              </div>
              <h3 className="service-title">Monitoring Dashboard</h3>
              <p className="service-description">
                User-friendly dashboard providing real-time data visualization, historical trends, and customizable alerts to keep you informed at all times.
              </p>
              <a href="#contact" className="service-link" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-bell"></i>
              </div>
              <h3 className="service-title">Alert Systems</h3>
              <p className="service-description">
                Immediate notifications when water quality parameters exceed predefined thresholds, enabling prompt corrective actions.
              </p>
              <a href="#contact" className="service-link" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3 className="service-title">System Integration</h3>
              <p className="service-description">
                Seamless integration with existing water management systems, SCADA, and other industrial control systems.
              </p>
              <a href="#contact" className="service-link" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-chart-pie"></i>
              </div>
              <h3 className="service-title">Data Analytics</h3>
              <p className="service-description">
                Advanced analytics and reporting capabilities to help you understand trends and make data-driven decisions.
              </p>
              <a href="#contact" className="service-link" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="service-title">Consultation</h3>
              <p className="service-description">
                Expert advice on water quality management, regulatory compliance, and system optimization for your specific needs.
              </p>
              <a href="#contact" className="service-link" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>
          
          <button 
            className="services-btn-view-all"
            onClick={() => scrollToSection('contact')}
          >
            Get In Touch
          </button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="aquasense-contact-section">
        <div className="section-header">
          <div className="section-subtitle">Get In Touch</div>
          <h2 className="section-title">Contact Us</h2>
        </div>
        
        <div className="contact-container">
          <div className="contact-info">
            <div className="contact-info-content">
              <h3 className="contact-title">Let's <span className="highlight-text">Connect</span></h3>
              <div className="contact-divider"></div>
              <p className="contact-description">
                Have questions about our water quality monitoring solutions? 
                We're here to help. Reach out to us using the information below or fill out the form.
              </p>
              
              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon-wrapper">
                    <img src={locationIcon} alt="Location" className="contact-icon" />
                  </div>
                  <div className="contact-item-content">
                    <h4>Our Location</h4>
                    <p>123 Water Avenue, Aqua City, AC 12345</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon-wrapper">
                    <img src={telephoneIcon} alt="Phone" className="contact-icon" />
                  </div>
                  <div className="contact-item-content">
                    <h4>Call Us</h4>
                    <p>+1 (123) 456-7890</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon-wrapper">
                    <img src={gmailIcon} alt="Email" className="contact-icon" />
                  </div>
                  <div className="contact-item-content">
                    <h4>Email Us</h4>
                    <p>info@aquasense.com</p>
                  </div>
                </div>
              </div>
              
              <div className="contact-social">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <img src={facebookIcon} alt="Facebook" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <img src={instagramIcon} alt="Instagram" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <img src={linkedinIcon} alt="LinkedIn" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <img src={xIcon} alt="Twitter/X" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="contact-form">
            <h3 className="form-title">Send Us a Message</h3>
            <p className="form-description">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter subject"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              
              {formStatus.message && (
                <div className={`form-status ${formStatus.type}`}>
                  {formStatus.message}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-brand-container">
              <img 
                src={aquasenseLogo} 
                alt="AquaSense Logo" 
                className="footer-logo" 
              />
              <h3 className="footer-title">AQUASENSE</h3>
            </div>
            <p className="footer-text">
              Providing innovative water quality monitoring solutions for a safer and sustainable future.
            </p>
          </div>
          
          <div className="footer-links">
            <h3>Quick Links</h3>
            <ul>
              <li>
                <a href="#home" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('home');
                }}>Home</a>
              </li>
              <li>
                <a href="#about" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('about');
                }}>About Us</a>
              </li>
              <li>
                <a href="#services" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('services');
                }}>Services</a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('contact');
                }}>Contact</a>
              </li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h3>Services</h3>
            <ul>
              <li><a href="#services">Water Quality Testing</a></li>
              <li><a href="#services">Monitoring Dashboard</a></li>
              <li><a href="#services">Alert Systems</a></li>
              <li><a href="#services">System Integration</a></li>
            </ul>
          </div>
          
          <div className="footer-newsletter">
            <h3>Newsletter</h3>
            <p className="footer-text">
              Subscribe to our newsletter to receive updates on our services, news, and industry insights.
            </p>
            <div className="newsletter-form">
              <input
                type="email"
                className="newsletter-input"
                placeholder="Enter your email"
              />
              <button className="newsletter-button">Subscribe</button>
            </div>
          </div>
        </div>
        
        <div className="footer-divider"></div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AquaSense. All Rights Reserved.
          </div>
          
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src={facebookIcon} alt="Facebook" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src={instagramIcon} alt="Instagram" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <img src={linkedinIcon} alt="LinkedIn" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <img src={xIcon} alt="Twitter/X" />
            </a>
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      {showBackToTop && (
        <div 
          className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
          onClick={scrollToTop}
        >
          <i className="fas fa-arrow-up"></i>
        </div>
      )}
    </div>
  );
};

export default LandingImproved;