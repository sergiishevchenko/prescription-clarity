"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FormValues } from "@/lib/medicationTypes";

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

  return (
    <div className="mt-4">
      <label className="block text-base font-medium text-gray-900">
        Medication Photo <span className="text-gray-500">(Optional)</span>
      </label>

      {/* СХОВАНЕ поле file (не відображається взагалі) */}
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

      {/* Клікабельна зона (вся область у штриховій рамці) */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload medication photo"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          validateAndSet(f);
        }}
        className={[
          "mt-2 block w-full cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
          dragOver
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none",
        ].join(" ")}
      >
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
          📷
        </div>
        <p className="text-sm text-gray-700">Click to upload photo</p>
        <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>

        {previewUrl && (
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 rounded-md border"
            />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
