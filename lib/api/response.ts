import { NextResponse } from "next/server"
import type { ApiResponse } from "@/types"

export function success<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  )
}

export function error(message: string, status = 400) {
  return NextResponse.json<ApiResponse>(
    { success: false, error: message },
    { status }
  )
}

export function unauthorized() {
  return error("Niet ingelogd", 401)
}

export function forbidden() {
  return error("Geen toegang", 403)
}

export function notFound(entity = "Item") {
  return error(`${entity} niet gevonden`, 404)
}
