"use client";
import React from "react";
import { useCalendar } from "../context/CalendarContext";
import { Trash2 } from "lucide-react";


export default function ConfirmModal() {
  const { confirmOpen, confirmMsg, closeConfirm, confirmOk } = useCalendar();
  if (!confirmOpen) return null;
  return (
    <div id="confirm-overlay" className="open">
      <div id="confirm-box">
        <div className="confirm-icon">
          <Trash2 size={24} color="#ef4444" />
        </div>

        <div className="confirm-title">Delete Event?</div>
        <div className="confirm-msg">{confirmMsg}</div>
        <div className="confirm-btns">
          <button className="confirm-cancel" onClick={closeConfirm}>Cancel</button>
          <button className="confirm-delete" onClick={confirmOk}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}
