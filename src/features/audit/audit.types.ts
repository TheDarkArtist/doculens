export type AuditAction =
  | 'document.uploaded'
  | 'document.processing_started'
  | 'document.classified'
  | 'document.validated'
  | 'document.auto_approved'
  | 'document.processed'
  | 'document.approved'
  | 'document.rejected'
  | 'document.deleted'
  | 'field.extracted'
  | 'field.corrected'

export type AuditDetails = {
  field_name?: string
  before_value?: string
  after_value?: string
  reason?: string
  [key: string]: unknown
}
