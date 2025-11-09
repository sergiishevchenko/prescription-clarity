"use client";

import Link from "next/link";
import DeleteMedicationButton from "./DeleteMedicationButton";
import { useState } from "react";

type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: number;
  startDate: string;
  endDate: string;
};

export default function MedicationsTable({
  initial,
}: {
  initial: Medication[];
}) {
  const [items, setItems] = useState(initial);

  return (
    <div className="overflow-x-auto">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600">
          No medications yet.
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Dose
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Freq/day
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Dates
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{m.dose}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {m.frequency}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(m.startDate).toLocaleDateString()} -{" "}
                  {new Date(m.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/medications/${m.id}/edit`}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteMedicationButton
                      id={m.id}
                      onDeleted={() =>
                        setItems((prev) => prev.filter((x) => x.id !== m.id))
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
