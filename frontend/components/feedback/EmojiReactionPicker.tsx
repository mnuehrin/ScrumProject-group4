"use client";

import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiReactionPickerProps {
  onPick: (emoji: string) => void;
}

export function EmojiReactionPicker({ onPick }: EmojiReactionPickerProps) {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div className="absolute left-0 top-9 z-30 rounded-xl border border-border bg-popover p-1 shadow-xl">
      <EmojiPicker
        onEmojiClick={(data: EmojiClickData) => onPick(data.emoji)}
        reactionsDefaultOpen
        searchDisabled
        skinTonesDisabled
        lazyLoadEmojis
        previewConfig={{ showPreview: false }}
        theme={isDark ? "dark" : "light"}
        width={280}
        height={320}
      />
    </div>
  );
}
