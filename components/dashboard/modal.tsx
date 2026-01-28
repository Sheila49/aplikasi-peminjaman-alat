"use client"
import { X } from "lucide-react"
import type React from "react"
import { useEffect } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  preventClose?: boolean // Untuk prevent close saat loading
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, preventClose = false, size = "lg" }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, preventClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl"
  }

  const handleBackdropClick = () => {
    if (!preventClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div 
        className={`relative z-50 w-full ${sizeClasses[size]} rounded-3xl glass-strong p-6 shadow-2xl animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
          <button
            onClick={onClose}
            disabled={preventClose}
            className={`rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive ${
              preventClose ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}