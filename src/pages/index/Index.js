import React, { useRef } from "react";
import { Link } from 'react-router-dom';

const Index = () => {
  // Refs for each section
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  // Scroll to section
  const handleScroll = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div>
      <title>VSDiamond Dental Clinic | Index</title>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: "70px",
          background: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: "40px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Logo and Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/logo192.png"
            alt="VS Diamond Logo"
            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
          />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
            <span style={{ fontWeight: "bold", fontSize: "20px", color: "#C29E38", letterSpacing: 1 }}>
              VSDiamond
            </span>
            <span style={{ fontWeight: "bold", fontSize: "15px", color: "#C29E38", letterSpacing: 1 }}>
              Dental Clinic
            </span>
          </span>
        </div>
        {/* Middle: Nav Links */}
        <div style={{ display: "flex", gap: "32px" }}>
          <button
            onClick={() => handleScroll(homeRef)}
            style={{ background: "none", border: "none", color: "#333", fontWeight: 500, fontSize: "16px", cursor: "pointer" }}
          >
            Home
          </button>
          <button
            onClick={() => handleScroll(servicesRef)}
            style={{ background: "none", border: "none", color: "#333", fontWeight: 500, fontSize: "16px", cursor: "pointer" }}
          >
            Services
          </button>
          <button
            onClick={() => handleScroll(aboutRef)}
            style={{ background: "none", border: "none", color: "#333", fontWeight: 500, fontSize: "16px", cursor: "pointer" }}
          >
            About
          </button>
          <button
            onClick={() => handleScroll(contactRef)}
            style={{ background: "none", border: "none", color: "#333", fontWeight: 500, fontSize: "16px", cursor: "pointer" }}
          >
            Contact
          </button>
        </div>
        {/* Right: Sign In */}
        <div>
          <Link to="/sign-in">
            <button
              style={{
                background: "#C29E38",
                color: "white",
                border: "none",
                padding: "8px 22px",
                borderRadius: "999px",
                fontWeight: "bold",
                fontSize: "15px",
                cursor: "pointer"
              }}
            >
              Sign In
            </button>
          </Link>
        </div>
      </nav>

       {/* Main Content */}
      <div
        ref={homeRef}
        style={{
          // Remove minHeight or set to "auto" so "Our Clinic" is not pushed to the bottom
          padding: "60px 0 80px 0",
          background: "#fdf9f3",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "150px",
          flexWrap: "wrap"
        }}
      >
        {/* Left side: Text and buttons */}
        <div style={{
          flex: 1,
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          marginLeft: "60px"
        }}>
          <h1 style={{ fontSize: "2.5rem", color: "#555", marginBottom: 16 }}>Smile Bright</h1>
          <h2 style={{ fontSize: "1.5rem", color: "#C29E38", marginBottom: 32 }}>
            Like a Diamond
          </h2>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link to="/patient-appointment-booking">
              <button
                style={{
                  background: "#C29E38",
                  color: "white",
                  border: "none",
                  padding: "12px 32px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                Schedule Appointment
              </button>
            </Link>
            <Link to="/dental-portfolio">
              <button
                style={{
                  background: "#fff",
                  color: "#C29E38",
                  border: "2px solid #C29E38",
                  padding: "12px 32px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                Dental Portfolio
              </button>
            </Link>
          </div>
        </div>
        {/* Right side: Dentist introduction card */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            minWidth: 340,
            maxWidth: 400,
            marginRight: "60px"
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 24px #0002",
              padding: "32px 24px 24px 24px",
              width: "100%",
              minHeight: 260,
              position: "relative",
              marginTop: 0,
            }}
          >
            {/* Star Ratings */}
            <div style={{ position: "absolute", top: 18, left: 24, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#FFD700", fontSize: 20 }}>★</span>
              <span style={{ color: "#FFD700", fontSize: 20 }}>★</span>
              <span style={{ color: "#FFD700", fontSize: 20 }}>★</span>
              <span style={{ color: "#FFD700", fontSize: 20 }}>★</span>
              <span style={{ color: "#FFD700", fontSize: 20 }}>★</span>
              <span style={{ color: "#888", fontSize: 14, marginLeft: 8 }}>(120 reviews)</span>
            </div>
            {/* Dentist Image */}
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="Dentist"
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid #fff",
                boxShadow: "0 2px 8px #0002",
                position: "absolute",
                top: -45,
                right: 24,
                background: "#eee"
              }}
            />
            {/* Dentist Intro */}
            <div style={{ marginTop: 60 }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#C29E38", fontWeight: "bold", fontSize: 22 }}>
                Dr. John Dela Cruz
              </h3>
              <p style={{ margin: 0, color: "#555", fontSize: 15 }}>
                Chief Dentist & Owner<br />
                <span style={{ color: "#888", fontSize: 14 }}>
                  "Passionate about creating beautiful smiles for over 15 years. Your comfort and dental health are my top priorities."
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
     {/* Our Clinic Section - left aligned title, bigger font */}
      <div style={{ width: "100%", margin: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 48, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
        <h3 style={{
          color: "#555",
          fontWeight: "bold",
          fontSize: 28,
          fontFamily: "Inter, sans-serif",
          marginBottom: 24,
          marginLeft: 0,
        }}>
          Our Clinic
        </h3>
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: "18px 16px", minWidth: 180, flex: 1 }}>
            <h4 style={{ color: "#C29E38", margin: "0 0 8px 0", fontSize: 17 }}>Expertise</h4>
            <p style={{ color: "#555", margin: 0, fontSize: 15 }}>
              Our dentists are highly trained and experienced in all areas of dental care.
            </p>
          </div>
          <div style={{ background: "#fff7", borderRadius: 8, padding: "18px 16px", minWidth: 180, flex: 1 }}>
            <h4 style={{ color: "#C29E38", margin: "0 0 8px 0", fontSize: 17 }}>Care</h4>
            <p style={{ color: "#555", margin: 0, fontSize: 15 }}>
              We treat every patient like family, focusing on your comfort and well-being.
            </p>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "18px 16px", minWidth: 180, flex: 1 }}>
            <h4 style={{ color: "#C29E38", margin: "0 0 8px 0", fontSize: 17 }}>Comfort</h4>
            <p style={{ color: "#555", margin: 0, fontSize: 15 }}>
              Our clinic is designed to provide a relaxing and welcoming environment.
            </p>
          </div>
        </div>
      </div>

      <div ref={servicesRef} style={{ minHeight: "100vh", padding: "60px 0 80px 0", background: "#f7f7f7" }}>
        <h2 style={{ textAlign: "center", color: "#C29E38", marginBottom: 24 }}>Our Services</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: 24, minWidth: 220 }}>
            <h3 style={{ color: "#C29E38" }}>Dental Cleaning</h3>
            <p style={{ color: "#555" }}>Professional cleaning for a healthy smile.</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: 24, minWidth: 220 }}>
            <h3 style={{ color: "#C29E38" }}>Tooth Extraction</h3>
            <p style={{ color: "#555" }}>Safe and gentle tooth removal procedures.</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: 24, minWidth: 220 }}>
            <h3 style={{ color: "#C29E38" }}>Dental Fillings</h3>
            <p style={{ color: "#555" }}>Restore your teeth with quality fillings.</p>
          </div>
        </div>
      </div>

      <div ref={aboutRef} style={{ minHeight: "100vh", padding: "60px 0 80px 0", background: "#fff" }}>
        <h2 style={{ textAlign: "center", color: "#C29E38", marginBottom: 24 }}>About Us</h2>
        <div style={{ maxWidth: 700, margin: "0 auto", color: "#555", fontSize: "1.1rem", textAlign: "center" }}>
          <p>
            VSDiamond Dental Clinic is committed to providing the best dental care in a comfortable and friendly environment.
            Our experienced dentists and staff use the latest technology to ensure your oral health and satisfaction.
          </p>
          <p>
            We believe everyone deserves a beautiful smile. Visit us and experience the VSDiamond difference!
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <div style={{ minHeight: "60vh", padding: "60px 0 80px 0", background: "#f7f7f7" }}>
        <h2 style={{ textAlign: "center", color: "#C29E38", marginBottom: 24 }}>FAQs</h2>
        <div style={{ maxWidth: 700, margin: "0 auto", color: "#555", fontSize: "1.1rem" }}>
          <div style={{ marginBottom: 24 }}>
            <strong>Q: How do I book an appointment?</strong>
            <p style={{ margin: 0 }}>You can book an appointment online through our website or call us directly at (0912) 345-6789.</p>
          </div>
          <div style={{ marginBottom: 24 }}>
            <strong>Q: What services do you offer?</strong>
            <p style={{ margin: 0 }}>We offer dental cleaning, tooth extraction, fillings, cosmetic dentistry, and more. See our Services section for details.</p>
          </div>
          <div style={{ marginBottom: 24 }}>
            <strong>Q: Do you accept walk-ins?</strong>
            <p style={{ margin: 0 }}>Yes, we accept walk-ins but recommend scheduling an appointment for your convenience.</p>
          </div>
        </div>
      </div>

      <div ref={contactRef} style={{ minHeight: "100vh", padding: "60px 0 80px 0", background: "#f7f7f7" }}>
        <h2 style={{ textAlign: "center", color: "#C29E38", marginBottom: 24 }}>Contact Us</h2>
        <div style={{ maxWidth: 500, margin: "0 auto", color: "#555", fontSize: "1.1rem", textAlign: "center" }}>
          <p>
            <strong>Address:</strong> 123 Smile Street, Happy City, PH<br />
            <strong>Email:</strong> info@vsdiamonddental.com<br />
            <strong>Phone:</strong> (0912) 345-6789
          </p>
          <p>
            For appointments and inquiries, please fill out our contact form or call us directly.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Index;