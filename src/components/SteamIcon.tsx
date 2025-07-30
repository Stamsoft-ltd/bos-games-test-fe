import React from "react";

interface SteamIconProps {
  className?: string;
}

export default function SteamIcon({ className = "w-6 h-6" }: SteamIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.63 3.87 10.35 9.08 11.82l.92-3.5-2.5-.92C5.37 19.5 2 16.13 2 12s3.37-7.5 7.5-7.5S17 7.87 17 12c0 1.5-.37 2.92-1.03 4.18l.92 2.5L24 20.92C25.47 15.71 20.75 12 15.12 12c-1.5 0-2.92.37-4.18 1.03L8.44 10.6c.92-.37 1.92-.6 2.96-.6 3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6c0-1.04.23-2.04.6-2.96l2.43 2.43C9.63 12.08 9 13.5 9 15c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5z" />
    </svg>
  );
}
