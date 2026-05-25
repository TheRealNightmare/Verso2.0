import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#3f5d6b] text-white text-xs sm:text-sm py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-8 text-center">
      <a href="#terms" className="hover:underline">Terms &amp; Conditions</a>
      <span>© {currentYear} Verso. All rights reserved.</span>
    </footer>
  );
};

export default Footer;
