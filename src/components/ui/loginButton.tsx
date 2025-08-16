'use client';

import React from 'react';

type LoginButtonProps = {
  content: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
};

export default function LoginButton({ content, type = 'button', onClick }: LoginButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full py-2 rounded-md text-text font-semibold transition-all duration-300 bg-gradient-to-r from-pink-100 via-pink-200 to-purple-100 hover:from-purple-300 hover:via-purple-200 hover:to-purple-100"
    >
      {content}
    </button>
  );
}
