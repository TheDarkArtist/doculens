// Demo documents with pre-computed extracted fields
// Spread across 30 days, realistic confidence distributions

const vendors = [
  'Atlas Industrial', 'NovaTech Solutions', 'Greenleaf Organics',
  'Pinnacle Logistics', 'ClearView Analytics', 'Horizon Healthcare',
  'DataForge Systems', 'Summit Engineering',
]

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

type DemoDoc = {
  filename: string
  mimeType: string
  fileSize: number
  status: 'complete' | 'needs_review' | 'failed' | 'queued'
  templateSlug: string
  createdAt: Date
  fields: { name: string; value: string; type: string; confidence: number }[]
}

export function generateDemoDocuments(): DemoDoc[] {
  const docs: DemoDoc[] = []

  // 12 invoices
  for (let i = 0; i < 12; i++) {
    const vendor = vendors[i % vendors.length]
    const subtotal = randomBetween(500, 50000)
    const tax = Math.round(subtotal * 0.08 * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100
    const invNum = `INV-2026-${String(i + 1).padStart(4, '0')}`
    const status = i < 8 ? 'complete' : i < 10 ? 'needs_review' : i === 11 ? 'failed' : 'queued'
    const baseConf = status === 'complete' ? 0.98 : status === 'needs_review' ? 0.85 : 0.6

    docs.push({
      filename: `${vendor.toLowerCase().replace(/\s/g, '-')}-${invNum}.pdf`,
      mimeType: 'application/pdf',
      fileSize: Math.floor(Math.random() * 500000) + 50000,
      status,
      templateSlug: 'invoice',
      createdAt: daysAgo(Math.floor(Math.random() * 28) + 1),
      fields: [
        { name: 'vendor_name', value: vendor, type: 'string', confidence: baseConf + randomBetween(-0.02, 0.02) },
        { name: 'invoice_number', value: invNum, type: 'string', confidence: baseConf + randomBetween(-0.01, 0.01) },
        { name: 'invoice_date', value: `2026-03-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`, type: 'date', confidence: baseConf + randomBetween(-0.03, 0.01) },
        { name: 'due_date', value: `2026-04-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`, type: 'date', confidence: baseConf + randomBetween(-0.02, 0.01) },
        { name: 'subtotal', value: String(subtotal), type: 'currency', confidence: baseConf + randomBetween(-0.05, 0.02) },
        { name: 'tax_amount', value: String(tax), type: 'currency', confidence: baseConf + randomBetween(-0.04, 0.01) },
        { name: 'total_amount', value: String(total), type: 'currency', confidence: baseConf + randomBetween(-0.03, 0.02) },
        { name: 'currency', value: 'USD', type: 'string', confidence: 0.99 },
        { name: 'payment_terms', value: 'Net 30', type: 'string', confidence: baseConf + randomBetween(-0.05, 0.02) },
      ],
    })
  }

  // 8 KYC documents
  const kycNames = [
    'Aisha Patel', 'Carlos Mendez', 'Elena Volkov', 'James Okonkwo',
    'Mei Lin Chen', 'Omar Hassan', 'Sofia Andersson', 'Yuki Tanaka',
  ]
  for (let i = 0; i < 8; i++) {
    const name = kycNames[i]
    const status = i < 5 ? 'complete' : i < 7 ? 'needs_review' : 'complete'
    const baseConf = status === 'complete' ? 0.97 : 0.82

    docs.push({
      filename: `kyc-${name.toLowerCase().replace(/\s/g, '-')}.pdf`,
      mimeType: 'application/pdf',
      fileSize: Math.floor(Math.random() * 200000) + 30000,
      status,
      templateSlug: 'kyc-identity',
      createdAt: daysAgo(Math.floor(Math.random() * 25) + 1),
      fields: [
        { name: 'document_type', value: i % 2 === 0 ? 'Passport' : 'Driver License', type: 'string', confidence: baseConf + randomBetween(-0.01, 0.02) },
        { name: 'document_number', value: `${String.fromCharCode(65 + i)}${Math.floor(Math.random() * 9000000) + 1000000}`, type: 'string', confidence: baseConf + randomBetween(-0.03, 0.01) },
        { name: 'full_name', value: name, type: 'string', confidence: baseConf + randomBetween(-0.02, 0.02) },
        { name: 'date_of_birth', value: `19${80 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`, type: 'date', confidence: baseConf + randomBetween(-0.04, 0.01) },
        { name: 'expiry_date', value: `20${27 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`, type: 'date', confidence: baseConf + randomBetween(-0.03, 0.02) },
        { name: 'issuing_country', value: ['US', 'GB', 'IN', 'DE', 'JP', 'NG', 'SE', 'BR'][i], type: 'string', confidence: 0.99 },
        { name: 'gender', value: i % 3 === 0 ? 'M' : 'F', type: 'string', confidence: baseConf + randomBetween(-0.01, 0.01) },
      ],
    })
  }

  // 5 medical records
  const patients = [
    'Robert Williams', 'Maria Garcia', 'David Kim', 'Sarah Thompson', 'Michael Brown',
  ]
  for (let i = 0; i < 5; i++) {
    const patient = patients[i]
    const status = i < 3 ? 'complete' : 'needs_review'
    const baseConf = status === 'complete' ? 0.96 : 0.78

    docs.push({
      filename: `prior-auth-${patient.toLowerCase().replace(/\s/g, '-')}.pdf`,
      mimeType: 'application/pdf',
      fileSize: Math.floor(Math.random() * 300000) + 80000,
      status,
      templateSlug: 'medical-record',
      createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
      fields: [
        { name: 'patient_name', value: patient, type: 'string', confidence: baseConf + randomBetween(-0.02, 0.02) },
        { name: 'patient_dob', value: `19${60 + Math.floor(Math.random() * 30)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`, type: 'date', confidence: baseConf + randomBetween(-0.05, 0.01) },
        { name: 'patient_id', value: `MRN-${Math.floor(Math.random() * 900000) + 100000}`, type: 'string', confidence: baseConf + randomBetween(-0.03, 0.02) },
        { name: 'provider_name', value: ['Dr. A. Singh', 'Dr. L. Chen', 'Dr. R. Patel', 'Dr. M. Johnson', 'Dr. K. Williams'][i], type: 'string', confidence: baseConf + randomBetween(-0.02, 0.01) },
        { name: 'diagnosis_codes', value: ['E11.9', 'I10', 'F41.1', 'M54.5', 'J06.9'][i], type: 'array', confidence: baseConf + randomBetween(-0.06, 0.01) },
        { name: 'procedure_codes', value: ['99214', '71046', '93000', '97110', '99213'][i], type: 'array', confidence: baseConf + randomBetween(-0.05, 0.02) },
        { name: 'date_of_service', value: `2026-03-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`, type: 'date', confidence: baseConf + randomBetween(-0.03, 0.01) },
      ],
    })
  }

  return docs
}
