"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FormValues } from "@/lib/medicationTypes";

export default function PhotoUploader() {
  const { register } = useFormContext<FormValues>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onSelectFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (!/\.(png|jpg|jpeg)$/i.test(file.name)) {
      // Light UX: just reset without blocking alerts
      e.target.value = "";
      setPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = "";
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  return (
    <div className="mt-4">
      <label className="block text-base font-medium text-gray-900">
        Medication Photo <span className="text-gray-500">(Optional)</span>
      </label>
      <div className="mt-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-xl text-indigo-600">📷</div>
        <p className="text-sm text-gray-600">Click to upload photo</p>
        <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="mt-4 block w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
          {...register("photo")}
          onChange={onSelectFile}
        />
        {previewUrl && (
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="max-h-48 rounded-md border" />
          </div>
        )}
      </div>
    </div>
  );
}
