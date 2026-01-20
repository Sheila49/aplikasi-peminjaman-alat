"use client"

import { Toaster } from "react-hot-toast"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(18, 18, 24, 0.9)",
          color: "#f0f0f5",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        },
        success: {
          iconTheme: {
            primary: "#a855f7",
            secondary: "#f0f0f5",
          },
          style: {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(168, 85, 247, 0.2)",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#f0f0f5",
          },
          style: {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(239, 68, 68, 0.2)",
          },
        },
      }}
    />
  )
}
