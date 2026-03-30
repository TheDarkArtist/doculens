import { db } from './index'
import { tenants } from './schema/tenants'
import { users } from './schema/users'
import { documents } from './schema/documents'
import { extractedFields } from './schema/extracted-fields'
import { extractionTemplates } from './schema/extraction-templates'
import { auditLogs } from './schema/audit-logs'
import { hashSync } from 'bcryptjs'
import type { TemplateSchema } from './schema/extraction-templates'
import { generateDemoDocuments } from './seed-data'

const DEMO_PASSWORD = hashSync('demo1234', 10)
const KUSHAGRA_PASSWORD = hashSync('kushagra28', 10)

const invoiceSchema: TemplateSchema = {
  fields: [
    { name: 'vendor_name', type: 'string', required: true, description: 'Company name on invoice' },
    { name: 'vendor_address', type: 'string', required: true, description: 'Full vendor address' },
    { name: 'invoice_number', type: 'string', required: true, description: 'Invoice ID', validation_rules: { pattern: '^[A-Z0-9\\-]+$' } },
    { name: 'invoice_date', type: 'date', required: true, description: 'Date invoice issued' },
    { name: 'due_date', type: 'date', required: true, description: 'Payment due date' },
    { name: 'line_items', type: 'array', required: true, description: 'Itemized charges', items: { description: 'string', quantity: 'number', unit_price: 'currency', total: 'currency' } },
    { name: 'subtotal', type: 'currency', required: true, description: 'Before tax' },
    { name: 'tax_amount', type: 'currency', required: true, description: 'Tax charged' },
    { name: 'tax_rate', type: 'number', required: false, description: 'Tax percentage' },
    { name: 'total_amount', type: 'currency', required: true, description: 'Final amount due' },
    { name: 'payment_terms', type: 'string', required: false, description: 'E.g. Net 30' },
    { name: 'purchase_order_number', type: 'string', required: false, description: 'PO reference' },
    { name: 'currency', type: 'string', required: false, description: 'ISO 4217' },
  ],
  validation_rules: {
    arithmetic: [{ rule: 'total_amount = subtotal + tax_amount', description: 'Total = subtotal + tax' }],
    date_logic: [{ rule: 'due_date >= invoice_date', description: 'Due date after invoice date' }],
  },
}

const kycSchema: TemplateSchema = {
  fields: [
    { name: 'document_type', type: 'string', required: true, description: 'Passport, Driver License, or National ID' },
    { name: 'document_number', type: 'string', required: true, description: 'Document ID', sensitive: true },
    { name: 'full_name', type: 'string', required: true, description: 'Name on document' },
    { name: 'date_of_birth', type: 'date', required: true, description: 'DOB' },
    { name: 'expiry_date', type: 'date', required: true, description: 'Document expiry' },
    { name: 'issuing_country', type: 'string', required: true, description: 'ISO 3166-1 alpha-2' },
    { name: 'gender', type: 'string', required: false, description: 'M or F' },
  ],
  validation_rules: { expiry: [{ rule: 'expiry_date > today', description: 'Not expired' }] },
}

const medicalSchema: TemplateSchema = {
  fields: [
    { name: 'patient_name', type: 'string', required: true, description: 'Patient name', sensitive: true },
    { name: 'patient_dob', type: 'date', required: true, description: 'Date of birth', sensitive: true },
    { name: 'patient_id', type: 'string', required: true, description: 'MRN or patient ID', sensitive: true },
    { name: 'provider_name', type: 'string', required: true, description: 'Healthcare provider' },
    { name: 'diagnosis_codes', type: 'array', required: true, description: 'ICD-10 codes' },
    { name: 'procedure_codes', type: 'array', required: true, description: 'CPT codes' },
    { name: 'date_of_service', type: 'date', required: true, description: 'Date of service' },
  ],
  validation_rules: { date_logic: [{ rule: 'date_of_service <= today', description: 'Not in future' }] },
}

const resumeSchema: TemplateSchema = {
  fields: [
    { name: 'full_name', type: 'string', required: true, description: 'Candidate full name' },
    { name: 'email', type: 'string', required: true, description: 'Email address', sensitive: true },
    { name: 'phone', type: 'string', required: false, description: 'Phone number', sensitive: true },
    { name: 'location', type: 'string', required: false, description: 'City, state, country' },
    { name: 'summary', type: 'string', required: false, description: 'Professional summary or objective' },
    { name: 'skills', type: 'array', required: true, description: 'Technical and soft skills' },
    { name: 'experience', type: 'array', required: true, description: 'Work experience entries (company, role, dates)' },
    { name: 'education', type: 'array', required: true, description: 'Education entries (institution, degree, dates)' },
    { name: 'certifications', type: 'array', required: false, description: 'Professional certifications' },
    { name: 'languages', type: 'array', required: false, description: 'Languages spoken' },
    { name: 'linkedin_url', type: 'string', required: false, description: 'LinkedIn profile URL' },
    { name: 'github_url', type: 'string', required: false, description: 'GitHub profile URL' },
    { name: 'years_of_experience', type: 'number', required: false, description: 'Total years of professional experience' },
  ],
}

const bankStatementSchema: TemplateSchema = {
  fields: [
    { name: 'account_holder', type: 'string', required: true, description: 'Account holder name', sensitive: true },
    { name: 'account_number', type: 'string', required: true, description: 'Bank account number', sensitive: true },
    { name: 'bank_name', type: 'string', required: true, description: 'Financial institution name' },
    { name: 'statement_period_start', type: 'date', required: true, description: 'Statement period start date' },
    { name: 'statement_period_end', type: 'date', required: true, description: 'Statement period end date' },
    { name: 'opening_balance', type: 'currency', required: true, description: 'Balance at start of period' },
    { name: 'closing_balance', type: 'currency', required: true, description: 'Balance at end of period' },
    { name: 'total_deposits', type: 'currency', required: true, description: 'Sum of all deposits/credits' },
    { name: 'total_withdrawals', type: 'currency', required: true, description: 'Sum of all withdrawals/debits' },
    { name: 'transaction_count', type: 'number', required: false, description: 'Total number of transactions' },
    { name: 'currency', type: 'string', required: true, description: 'Account currency (ISO 4217)' },
    { name: 'branch', type: 'string', required: false, description: 'Branch name or code' },
    { name: 'ifsc_code', type: 'string', required: false, description: 'IFSC or routing number' },
  ],
  validation_rules: {
    arithmetic: [
      { rule: 'closing_balance = opening_balance + total_deposits - total_withdrawals', description: 'Closing balance must reconcile' },
    ],
    date_logic: [
      { rule: 'statement_period_end > statement_period_start', description: 'End date must be after start' },
    ],
  },
}

async function seed() {
  console.log('Seeding database...')

  const [tenant] = await db.insert(tenants).values({ name: 'TDACorp', slug: 'tdacorp' }).returning()

  const userRows = await db.insert(users).values([
    { tenantId: tenant.id, email: 'sparrow.kushagra@gmail.com', name: 'Kushagra Sharma', role: 'admin' as const, passwordHash: KUSHAGRA_PASSWORD },
    { tenantId: tenant.id, email: 'admin@tdacorp.demo', name: 'Admin User', role: 'admin' as const, passwordHash: DEMO_PASSWORD },
    { tenantId: tenant.id, email: 'reviewer@tdacorp.demo', name: 'Reviewer User', role: 'reviewer' as const, passwordHash: DEMO_PASSWORD },
    { tenantId: tenant.id, email: 'viewer@tdacorp.demo', name: 'Viewer User', role: 'viewer' as const, passwordHash: DEMO_PASSWORD },
  ]).returning()

  const templateRows = await db.insert(extractionTemplates).values([
    { name: 'Invoice', slug: 'invoice', description: 'Standard business invoice', schema: invoiceSchema, isSystem: true },
    { name: 'KYC Identity Document', slug: 'kyc-identity', description: 'Passport, driver license, or national ID', schema: kycSchema, isSystem: true },
    { name: 'Medical Record', slug: 'medical-record', description: 'Clinical forms and prior authorization', schema: medicalSchema, isSystem: true },
    { name: 'Resume / CV', slug: 'resume', description: 'Professional resume or curriculum vitae', schema: resumeSchema, isSystem: true },
    { name: 'Bank Statement', slug: 'bank-statement', description: 'Monthly or quarterly bank account statement', schema: bankStatementSchema, isSystem: true },
  ]).returning()

  const templateMap = Object.fromEntries(templateRows.map((t) => [t.slug, t.id]))
  const adminUser = userRows[0]
  const demoDocs = generateDemoDocuments()

  for (const doc of demoDocs) {
    const isComplete = doc.status === 'complete'
    const [docRow] = await db.insert(documents).values({
      tenantId: tenant.id,
      templateId: templateMap[doc.templateSlug],
      uploadedBy: adminUser.id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      storageKey: `demo/${doc.filename}`,
      status: doc.status,
      classificationConfidence: 0.95,
      pageCount: Math.floor(Math.random() * 3) + 1,
      processingStartedAt: doc.createdAt,
      processingCompletedAt: isComplete ? new Date(doc.createdAt.getTime() + 3000) : null,
      errorMessage: doc.status === 'failed' ? 'OCR extraction timeout' : null,
      createdAt: doc.createdAt,
    }).returning()

    if (doc.fields.length > 0 && doc.status !== 'failed') {
      await db.insert(extractedFields).values(
        doc.fields.map((f) => ({
          documentId: docRow.id,
          fieldName: f.name,
          fieldValue: f.value,
          fieldType: f.type,
          confidence: Math.min(Math.max(f.confidence, 0), 1),
          isAutoApproved: f.confidence >= 0.975,
        }))
      )
    }

    await db.insert(auditLogs).values({
      tenantId: tenant.id, userId: adminUser.id, documentId: docRow.id,
      action: 'document.uploaded', details: { filename: doc.filename }, createdAt: doc.createdAt,
    })

    if (isComplete) {
      await db.insert(auditLogs).values({
        tenantId: tenant.id, documentId: docRow.id,
        action: 'document.auto_approved', details: { fieldCount: doc.fields.length },
        createdAt: new Date(doc.createdAt.getTime() + 3000),
      })
    }
  }

  console.log(`Seeded: ${userRows.length} users, ${templateRows.length} templates, ${demoDocs.length} documents`)
  process.exit(0)
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1) })
