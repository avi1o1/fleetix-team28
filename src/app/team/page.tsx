"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TeamPage() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    // Mark that the component has mounted
    setHasMounted(true);
    
    // Check for saved theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else {
      // If no preference is set, check for system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
      localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
    }
  }, []);

  // Only render once the component has mounted on the client
  if (!hasMounted) {
    return null;
  }

  const toggleTheme = () => {
    const newDarkModeValue = !isDarkMode;
    setIsDarkMode(newDarkModeValue);
    localStorage.setItem('theme', newDarkModeValue ? 'dark' : 'light');

    // Apply theme to document if needed for global theming
    if (newDarkModeValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Faculty: Clients and Professors combined in one section
  const facultyMembers = [
    {
      name: "Mr. Akhil Reddy Anthamgari",
      role: "Project Client",
      description: "Associate Client and a Software Engineer guiding us through the project.",
      imageUrl: "/akhil.jpeg"
    },
    {
      name: "Dr. Raghu Reddy",
      role: "Professor",
      description: "Professor specializing in Virtual Lab systems and Software Development Life cycle at IIIT Hyderabad.",
      imageUrl: "/raghureddy.jpeg"
    }
  ];

  // Teaching Assistants section remains separate
  const taMembers = [
    {
      name: "Ashna Dua",
      role: "Teaching Assistant",
      description: "Teaching Assistant and course instructor for the Design and software analysis course.",
      imageUrl: "ashna.jpeg"
    }
  ];

  // Developer Team: Me and My Team
  const developerMembers = [
    {
      name: "Akshita",
      role: "Routing & Optimisation",
      description: "Implemented many-to-one and many-to-many routing and optimisation using OSRM",
      imageUrl: "akshita.jpeg"
    },
    {
      name: "Aryanil Panja",
      role: "Research & VROOM",
      description: "Researched on VROOM and layed foundational codes for VROOM implementation.",
      imageUrl: "aryanil.jpeg"
    },
    {
      name: "Aviral Gupta",
      role: "Coordination & Frontend",
      description: "Managed team coordination and key role in developing the frontend of the project.",
      imageUrl: "aviral.jpeg"
    },
    {
      name: "Satvik Rao",
      role: "Documentation & Backend",
      description: "Managed key documentation like Status trackers and contributed to backend initialisation.",
      imageUrl: "satvik.jpeg"
    },
    {
      name: "Sherley",
      role: "Market Reseach & Documentation",
      description: "Researched on current market solutions and technologies. Also, helped in creating visual diagrams for documentation.",
      imageUrl: "sherley.jpeg"
    }
  ];

  // Function to render team section
  const renderTeamSection = (title: string, description: string, members: { name: string; role: string; description: string; imageUrl: string; }[]) => {
    return (
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-20 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl text-green-500 font-semibold tracking-wide uppercase">{title}</h2>
            <p className={`mt-2 text-3xl leading-8 font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl transition-colors duration-300`}>
              {description}
            </p>
          </div>

          <div className={`mt-12 grid gap-8 ${members.length <= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {members.map((member, index) => (
              <div 
                key={index} 
                className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300`}
              >
                <div className={`h-48 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                  <img 
                    src={member.imageUrl} 
                    alt={member.name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="p-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    {member.name}
                  </h3>
                  <p className="text-green-500 font-medium mt-1">{member.role}</p>
                  <p className={`mt-3 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Hero section */}
      <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} py-16 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`mt-20 text-6xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-5xl lg:text-7xl transition-colors duration-300`}>
              Meet Our <span className="text-green-500">Team</span>
            </h1>
            <p className={`mt-6 text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
              Fleetix is brought to you by a dedicated team of faculty, teaching assistants, and a passionate developer team.
            </p>
          </div>
        </div>
      </div>

      {/* Render each team section */}
      {renderTeamSection("Project Clients & Professors", "Faculty member and Client guiding the project", facultyMembers)}
      {renderTeamSection("Teaching Assistants", "Students providing expertise and guidance", taMembers)}
      {renderTeamSection("Our Team", "The core development team bringing the project to life", developerMembers)}

      <Footer />
    </div>
  );
}
