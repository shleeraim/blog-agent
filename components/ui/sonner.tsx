"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: '#161b22',
          border: '1px solid #30363d',
          color: '#e6edf3',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
