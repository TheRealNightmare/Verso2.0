import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 px-6 py-4 flex items-center justify-between text-sm text-slate-500 bg-white">
      <div>
        <a href="#terms" className="hover:text-[#5b7c99]">Terms & Conditions</a>
      </div>
      <div>© {currentYear} Verso. All rights reserved.</div>
    </footer>
  );
};

export default Footer;
