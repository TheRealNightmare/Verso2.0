import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="#terms">Terms & Conditions</a>
      </div>
      <div className="footer-copyright">
        © {currentYear} Verso. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;