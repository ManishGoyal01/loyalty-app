import React from "react";
import StreakDots from "./StreakDots";

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function maskPhone(phone) {
  if (!phone) return "N/A";
  const str = String(phone);
  if (str.length <= 4) return str;
  return "*".repeat(str.length - 4) + str.slice(-4);
}

function getStatus(customer) {
  if (customer.complete) {
    return { label: "Complete", emoji: "🏆", color: "bg-green-100 text-green-700 border-green-300" };
  }
  if (customer.lastScan === todayIST()) {
    return { label: "Active", emoji: "🔥", color: "bg-orange-100 text-orange-700 border-orange-300" };
  }
  if (customer.lastScan) {
    return { label: "Broken", emoji: "💔", color: "bg-red-100 text-red-700 border-red-300" };
  }
  return { label: "New", emoji: "🌱", color: "bg-blue-100 text-blue-700 border-blue-300" };
}

export default function CustomerCard({ customer }) {
  const status = getStatus(customer);

  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white flex flex-col gap-3">
      {/* Top row: phone + status badge */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-800 font-mono">
          {maskPhone(customer.phone)}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full border ${status.color}`}
        >
          <span>{status.emoji}</span>
          {status.label}
        </span>
      </div>

      {/* Streak row */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
          Streak: {customer.streak ?? 0}/10
        </span>
        <StreakDots streak={customer.streak ?? 0} size="sm" />
      </div>

      {/* Last scan */}
      <div className="text-sm text-gray-400">
        Last scan:{" "}
        {customer.lastScan ? (
          <span className="text-gray-600">{customer.lastScan}</span>
        ) : (
          <span className="italic">Never</span>
        )}
      </div>
    </div>
  );
}
