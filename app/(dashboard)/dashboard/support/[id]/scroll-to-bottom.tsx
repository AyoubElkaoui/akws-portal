"use client"

import { useEffect } from "react"

export function ScrollToBottom() {
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }, [])

  return null
}
