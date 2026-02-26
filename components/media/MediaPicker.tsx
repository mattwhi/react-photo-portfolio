// components/media/MediaPicker.tsx
"use client";

export type PickedPhoto = {
  id: string;
  url: string;
  key?: string;
  title?: string | null;
  alt?: string | null;
};

export type Variant = "modal" | "drawer" | "inline" | "panel"; // match your existing variants

type BaseProps = {
  open?: boolean;
  onClose?: () => void;
  onPick: (photo: PickedPhoto) => void;
  title?: string;
  endpoint?: string;
  variant?: Variant;
};

type UploadConfig =
  | {
      allowUpload?: false;
      presignEndpoint?: never;
      createEndpoint?: never;
    }
  | {
      allowUpload: true;
      presignEndpoint: string;
      createEndpoint: string;
    };

export type MediaPickerProps = BaseProps & UploadConfig;

export function MediaPicker(props: MediaPickerProps) {
  // now props.presignEndpoint / props.createEndpoint are valid when allowUpload === true
  // ...your existing component code...
  return null as any;
}
