"use client";

import React, { useEffect, useState } from "react";
import { SiDiscord } from "react-icons/si";

const DiscordInviteWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {process.env.NEXT_PUBLIC_DISCORD_INVITE_URL && (
        <a
          href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
          fixed bottom-20 z-[1000]
          w-14 h-14 
          bg-[#5865F2] hover:bg-[#4752C4] 
          text-white 
          border-none rounded-full 
          cursor-pointer 
          flex items-center justify-center
          shadow-lg shadow-[#5865F2]/30 hover:shadow-xl hover:shadow-[#5865F2]/40
          transition-all duration-300 ease-out
          transform hover:scale-110 active:scale-95
          group
          no-underline
          ${isVisible || isHovered ? "right-0" : "-right-6"}
        `}
          aria-label="Join Discord Server"
        >
          <SiDiscord
            className="w-8 h-8 text-white transition-transform duration-300"
            style={{
              transform:
                isVisible || isHovered ? "rotate(0deg)" : "rotate(270deg)",
            }}
          />
        </a>
      )}
    </>
  );
};

export default DiscordInviteWidget;
