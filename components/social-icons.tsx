import React from "react";

export function SocialIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "instagram":
      return (
        <svg {...common}>
          <path
            d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M17.5 6.6h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path
            d="M14 3v10.2a3.8 3.8 0 1 1-3-3.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 6c1.1 1.6 2.6 2.6 4.5 2.8V6.4C16.9 6.1 15.4 5.2 14.4 3.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path
            d="M14 8h2V5h-2a4 4 0 0 0-4 4v3H8v3h2v6h3v-6h2.2l.8-3H13V9a1 1 0 0 1 1-1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path
            d="M21 12s0-3.2-.4-4.6a2.6 2.6 0 0 0-1.8-1.8C17.4 5 12 5 12 5s-5.4 0-6.8.6A2.6 2.6 0 0 0 3.4 7.4C3 8.8 3 12 3 12s0 3.2.4 4.6a2.6 2.6 0 0 0 1.8 1.8C6.6 19 12 19 12 19s5.4 0 6.8-.6a2.6 2.6 0 0 0 1.8-1.8C21 15.2 21 12 21 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M10 9.7v4.6L14.2 12 10 9.7Z" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path
            d="M18.5 3H21l-6.7 7.7L22 21h-6.2l-4.8-6.1L5.7 21H3l7.2-8.3L2.7 3H9l4.4 5.6L18.5 3Z"
            fill="currentColor"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M6.5 9.2H3.8V21h2.7V9.2Z" fill="currentColor" />
          <path
            d="M5.1 3.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z"
            fill="currentColor"
          />
          <path
            d="M10.2 9.2H7.6V21h2.6v-6.2c0-1.7.3-3.3 2.4-3.3 2 0 2 1.9 2 3.4V21h2.6v-6.7c0-3.3-.7-5.8-4.5-5.8-1.8 0-3 .9-3.5 1.7h-.1V9.2Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}
