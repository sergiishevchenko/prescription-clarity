"use client";

import clsx from "clsx";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useFormContext } from "react-hook-form";

import type { FormValues } from "@/lib/medicationTypes";
import styles from "./PhotoUploader.module.css";

export default function PhotoUploader() {
  const { register, setValue, clearErrors } = useFormContext<FormValues>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function setFileIntoForm(file: File | null) {
    if (!file) {
      setValue("photo", undefined as unknown as FileList, {
        shouldDirty: true,
      });
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    setValue("photo", dt.files as unknown as FileList, { shouldDirty: true });
    clearErrors("photo");
  }

  function validateAndSet(file?: File) {
    setError(null);
    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFileIntoForm(null);
      return;
    }
    const okType =
      /image\/(png|jpeg)/.test(file.type) || /\.(png|jpe?g)$/i.test(file.name);
    const okSize = file.size <= 5 * 1024 * 1024;

    if (!okType) {
      setError("Only PNG or JPG images are allowed.");
      setFileIntoForm(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    if (!okSize) {
      setError("Image too large. Max 5MB.");
      setFileIntoForm(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    setFileIntoForm(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  const reg = register("photo");

  const openFileDialog = () => inputRef.current?.click();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  };

  const handlePickClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openFileDialog();
  };

  return (
    <div className={styles.wrapper}>
      <input
        type="file"
        accept="image/png,image/jpeg"
        hidden
        tabIndex={-1}
        {...reg}
        ref={(el) => {
          reg.ref(el);
          inputRef.current = el;
        }}
        onChange={(e) => validateAndSet(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload medication photo"
        className={clsx(styles.dropZone, {
          [styles.dropZoneActive]: dragOver,
          [styles.dropZonePreview]: Boolean(previewUrl),
        })}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          validateAndSet(file);
        }}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Medication preview"
              className={styles.previewImage}
            />
            <button
              type="button"
              className={styles.uploadButton}
              onClick={handlePickClick}
              aria-label="Change photo"
            >
              <UploadIcon />
            </button>
          </>
        ) : (
          <>
            <div className={styles.cameraBadge}>
              <CameraIcon />
            </div>
            <button
              type="button"
              className={styles.uploadButton}
              onClick={handlePickClick}
              aria-label="Select photo"
            >
              <UploadIcon />
            </button>
          </>
        )}
      </div>

      <p className={styles.primaryText}>Click to upload a photo</p>
      <p className={styles.caption}>Maximum size: 5MB</p>

      {previewUrl && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => validateAndSet(undefined)}
        >
          Remove photo
        </button>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      className={styles.cameraIcon}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="6" />
      <path d="M6 10h3l2-3h10l2 3h3a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className={styles.uploadIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v11" />
      <path d="M8 9l4-4 4 4" />
      <path d="M5 19h14" />
    </svg>
  );
}
