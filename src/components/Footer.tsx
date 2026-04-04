import React from "react";

const Footer = () => {
  return (
    <footer className="w-full py-8 mt-auto relative z-10 border-t border-[#1e293b]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm font-medium text-[#c0c4d6]/60 tracking-tight">
            &copy; {new Date().getFullYear()} <span className="text-[#818cf8]">Examina</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#555a72]">
            <span>Developed with</span>
            <span className="text-[#f43f5e] animate-pulse">❤️</span>
            <span>by</span>
            <a
              href="https://github.com/meneon114"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b90a8] hover:text-[#818cf8] transition-all underline underline-offset-4 decoration-[#8b90a8]/30 hover:decoration-[#818cf8]"
            >
              Md. Rijun Islam Neon
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
