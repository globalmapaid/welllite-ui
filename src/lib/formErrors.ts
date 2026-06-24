import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './api/http'
import { messageForError, messageForFieldCode } from './errorCodes'

/**
 * Apply a thrown error to a react-hook-form. Field-level 422 errors are mapped
 * onto matching fields; anything else is returned as a top-level message for
 * the caller to surface (toast/alert).
 *
 * @returns a friendly top-level message, or null if every error was field-mapped.
 */
export function applyApiError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly Path<T>[],
): string | null {
  if (err instanceof ApiError && err.errors.length > 0) {
    let mappedAll = true
    for (const fe of err.errors) {
      if ((knownFields as readonly string[]).includes(fe.field)) {
        setError(fe.field as Path<T>, {
          type: 'server',
          message: messageForFieldCode(fe.code),
        })
      } else {
        mappedAll = false
      }
    }
    return mappedAll ? null : messageForError(err)
  }
  return messageForError(err)
}
