"use client";

import { useEffect, useMemo, useState } from "react";
import { MediaPicker, type PickedPhoto } from "@/components/media/MediaPicker";

type LibraryAsset = {
  id: string;
  key: string;
  url: string;
  title?: string | null;
  alt?: string | null;
};

export function MediaLibraryPicker(props: {
  open: boolean;
  onClose: () => void;
  onPick: (p: PickedPhoto) => void;
  title?: string;
  presignEndpoint: string; // your existing presign route
}) {
  const [q, setQ] = useState("");
  const [assets, setAssets] = useState<LibraryAsset[]>([]);

  async function load() {
    const res = await fetch(`/api/media/assets?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setAssets(json.items || []);
  }

  useEffect(() => {
    if (!props.open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, q]);

  // Fake “single gallery” so your existing picker UI works
  const endpoint = useMemo(() => {
    // We’ll serve a tiny inline endpoint by using a data URL is not possible,
    // so we just rely on your existing MediaPicker for UI and do upload + refresh ourselves elsewhere.
    return "/api/media/library-proxy";
  }, []);

  // You’ll create this proxy route below
  return (
    <MediaPicker
      open={props.open}
      onClose={props.onClose}
      onPick={props.onPick}
      title={props.title || "Media Library"}
      endpoint={endpoint}
      allowUpload
      presignEndpoint={props.presignEndpoint}
      createEndpoint="/api/media/assets"
    />
  );
}
