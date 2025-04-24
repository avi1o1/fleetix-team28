import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  const [year, setYear] = useState<number>(2025);

  // Set current year
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="border-gray-700 flex justify-between transition-colors duration-300">
          <p className="text-base text-gray-400 transition-colors duration-300">
            © {year} Fleetix, a College Project - Team 28.
          </p>
          <div className="flex space-x-6">
            <Link href="https://github.com/DASS-Spring-2025/dass-spring-2025-project-team-28" className="text-gray-400 hover:text-white hover:text-green-500 transition-colors duration-300">
              <span className="sr-only">GitHub</span>
              <Github size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;