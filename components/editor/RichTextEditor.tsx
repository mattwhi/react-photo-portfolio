"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";

// ✅ TinyMCE Editor must be client-only in App Router
const TinyEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((m) => m.Editor),
  { ssr: false }
);

export function RichTextEditor({
  value,
  onChange,
  height = 360,
}: {
  value: string;
  onChange: (html: string) => void;
  height?: number;
}) {
  const lastValueRef = useRef(value);

  // Keep init stable (prevents re-init jitter)
  const init = useMemo(
    () => ({
      height,
      menubar: false,
      branding: false,
      skin: "oxide-dark",
      content_css: "dark",
      body_class: "prose prose-invert max-w-none",
      content_style: `
        body { background: black; }
        p, li, h1, h2, h3, h4, h5, h6 { color: rgba(255,255,255,0.88); }
        a { color: rgba(255,255,255,0.9); text-decoration: underline; }
      `,
      plugins: [
        "lists",
        "link",
        "autolink",
        "code",
        "table",
        "charmap",
        "fullscreen",
        "searchreplace",
        "visualblocks",
        "wordcount",
      ],
      toolbar:
        "undo redo | blocks | bold italic underline | bullist numlist | link table | removeformat | code fullscreen",
      block_formats:
        "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Quote=blockquote",
    }),
    [height]
  );

  // Track external changes (when switching sections etc.)
  useEffect(() => {
    lastValueRef.current = value;
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-black">
      <TinyEditor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        value={value}
        init={init}
        onEditorChange={(content) => {
          // Avoid noisy loops
          if (content === lastValueRef.current) return;
          lastValueRef.current = content;
          onChange(content);
        }}
      />
    </div>
  );
}
