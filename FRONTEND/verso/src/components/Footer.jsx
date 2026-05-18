import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#3f5d6b] text-white text-sm py-4 px-6 flex items-center justify-center gap-8">
      <a href="#terms" className="hover:underline">Terms &amp; Conditions</a>
      <span>© {currentYear} Verso. All rights reserved.</span>
    </footer>
  );
};

export default Footer;
