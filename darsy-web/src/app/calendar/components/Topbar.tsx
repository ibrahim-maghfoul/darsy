"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useCalendar } from "../context/CalendarContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus } from "lucide-react";
import Image from "next/image";


export default function Topbar() {
  const { setDrawerOpen } = useCalendar();


  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: "16px",
      marginTop: "12px",
    }}>
      {/* Add Event button */}
      <button
        onClick={() => setDrawerOpen(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          padding: "16px 40px", borderRadius: "16px", minWidth: "200px", maxWidth: "400px", width: "100%",
          background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 6px, transparent 6px, transparent 12px), linear-gradient(135deg,var(--green),#15803d)",
          border: "none", color: "#fff",
          fontFamily: "'Cairo',sans-serif", fontSize: "16px", fontWeight: 800,
          cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,.32)",
          transition: "all .22s cubic-bezier(.34,1.56,.64,1)",
          whiteSpace: "nowrap"
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
      >
        <Plus size={24} />
        Add Event
      </button>
    </div>
  );
}
