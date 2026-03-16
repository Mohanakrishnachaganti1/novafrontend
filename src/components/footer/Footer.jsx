import React from "react";
import "./footer.css";


const Footer = () => {
  return (
    <div className="footer">
      <p>© Nova International Designs Corporation. All rights reserved.</p>

      <div className="social-icons">
        <a href="https://www.facebook.com/profile.php?id=61584196192112" target="_blank" rel="noopener noreferrer"><img src="/images/facebook-logo.png" alt="Facebook" /></a>
        <a href="https://www.instagram.com/novainternationaldesigns/" target="_blank" rel="noopener noreferrer"><img src="/images/instagram-logo.png" alt="Instagram" /></a>
        <a href="https://www.linkedin.com/in/nova-international-designs-corporation-9188333a0/" target="_blank" rel="noopener noreferrer"><img src="/images/linkedIn-logo.png" alt="LinkedIn" /></a>
        <a href="#" target="_blank" rel="noopener noreferrer"><img src="/images/x_logo.png" alt="X" /></a>
      </div>
    </div>
  );
};

export default Footer;