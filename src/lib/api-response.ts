import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse('UNAUTHORIZED', message, 401)
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse('FORBIDDEN', message, 403)
}

export function notFoundResponse(message = 'Not found') {
  return errorResponse('NOT_FOUND', message, 404)
}
