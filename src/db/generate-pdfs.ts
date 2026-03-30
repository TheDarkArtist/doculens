import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUTPUT_DIR = join(process.cwd(), 'demo-pdfs')

const vendors = [
  { name: 'Atlas Industrial Ltd', address: '123 Manufacturing Ave, Detroit, MI 48201' },
  { name: 'NovaTech Solutions Inc', address: '456 Innovation Blvd, Austin, TX 78701' },
  { name: 'Greenleaf Organics Co', address: '789 Harvest Rd, Portland, OR 97201' },
  { name: 'Pinnacle Logistics LLC', address: '321 Freight Way, Memphis, TN 38103' },
  { name: 'ClearView Analytics Corp', address: '555 Data Dr, San Francisco, CA 94105' },
  { name: 'DataForge Systems', address: '888 Silicon Ct, San Jose, CA 95112' },
]

async function generateInvoice(index: number) {
  const vendor = vendors[index % vendors.length]
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const gray = rgb(0.4, 0.4, 0.4)
  const black = rgb(0, 0, 0)

  const invNum = `INV-2026-${String(index + 1).padStart(4, '0')}`
  const invDate = `2026-03-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  const dueDate = `2026-04-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  const items = [
    { desc: 'Consulting Services', qty: 40, price: 150 },
    { desc: 'Software License', qty: 1, price: 2500 },
    { desc: 'Support Package', qty: 1, price: 800 },
  ]
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const tax = Math.round(subtotal * 0.08)
  const total = subtotal + tax

  let y = 740
  page.drawText('INVOICE', { x: 50, y, font: bold, size: 28, color: black })
  page.drawText(invNum, { x: 400, y, font: bold, size: 14, color: gray })

  y -= 40
  page.drawText(vendor.name, { x: 50, y, font: bold, size: 12 })
  y -= 16
  page.drawText(vendor.address, { x: 50, y, font, size: 10, color: gray })

  y -= 30
  page.drawText(`Invoice Date: ${invDate}`, { x: 50, y, font, size: 10 })
  page.drawText(`Due Date: ${dueDate}`, { x: 300, y, font, size: 10 })
  page.drawText('Payment Terms: Net 30', { x: 50, y: y - 16, font, size: 10 })

  y -= 50
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: gray })
  y -= 20
  page.drawText('Description', { x: 50, y, font: bold, size: 10 })
  page.drawText('Qty', { x: 320, y, font: bold, size: 10 })
  page.drawText('Unit Price', { x: 390, y, font: bold, size: 10 })
  page.drawText('Total', { x: 490, y, font: bold, size: 10 })

  for (const item of items) {
    y -= 22
    page.drawText(item.desc, { x: 50, y, font, size: 10 })
    page.drawText(String(item.qty), { x: 325, y, font, size: 10 })
    page.drawText(`$${item.price.toLocaleString()}`, { x: 390, y, font, size: 10 })
    page.drawText(`$${(item.qty * item.price).toLocaleString()}`, { x: 490, y, font, size: 10 })
  }

  y -= 30
  page.drawLine({ start: { x: 350, y }, end: { x: 562, y }, thickness: 1, color: gray })
  y -= 20
  page.drawText('Subtotal:', { x: 390, y, font, size: 10 })
  page.drawText(`$${subtotal.toLocaleString()}`, { x: 490, y, font, size: 10 })
  y -= 18
  page.drawText('Tax (8%):', { x: 390, y, font, size: 10 })
  page.drawText(`$${tax.toLocaleString()}`, { x: 490, y, font, size: 10 })
  y -= 22
  page.drawText('TOTAL:', { x: 390, y, font: bold, size: 12 })
  page.drawText(`$${total.toLocaleString()}`, { x: 490, y, font: bold, size: 12 })

  y -= 60
  page.drawText('Currency: USD', { x: 50, y, font, size: 9, color: gray })

  const bytes = await doc.save()
  const filename = `${vendor.name.toLowerCase().replace(/[\s.]+/g, '-')}-${invNum}.pdf`
  writeFileSync(join(OUTPUT_DIR, filename), bytes)
  return filename
}

async function generateKYC(index: number) {
  const people = [
    { name: 'Aisha Patel', dob: '1990-05-14', country: 'US', docNum: 'P12345678', type: 'Passport' },
    { name: 'Carlos Mendez', dob: '1985-11-22', country: 'GB', docNum: 'DL87654321', type: 'Driver License' },
    { name: 'Elena Volkov', dob: '1992-03-08', country: 'DE', docNum: 'P98765432', type: 'Passport' },
    { name: 'Yuki Tanaka', dob: '1988-07-30', country: 'JP', docNum: 'DL11223344', type: 'Driver License' },
  ]
  const person = people[index % people.length]
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 400])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = 360
  page.drawText(person.type.toUpperCase(), { x: 50, y, font: bold, size: 20 })
  y -= 40
  page.drawText(`Full Name: ${person.name}`, { x: 50, y, font, size: 12 })
  y -= 22
  page.drawText(`Document Number: ${person.docNum}`, { x: 50, y, font, size: 12 })
  y -= 22
  page.drawText(`Date of Birth: ${person.dob}`, { x: 50, y, font, size: 12 })
  y -= 22
  page.drawText(`Expiry Date: 2029-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`, { x: 50, y, font, size: 12 })
  y -= 22
  page.drawText(`Issuing Country: ${person.country}`, { x: 50, y, font, size: 12 })
  y -= 22
  page.drawText(`Gender: ${index % 2 === 0 ? 'F' : 'M'}`, { x: 50, y, font, size: 12 })

  const bytes = await doc.save()
  const filename = `kyc-${person.name.toLowerCase().replace(/\s/g, '-')}.pdf`
  writeFileSync(join(OUTPUT_DIR, filename), bytes)
  return filename
}

async function generateMedical(index: number) {
  const records = [
    { patient: 'Robert Williams', dob: '1965-02-14', mrn: 'MRN-100234', provider: 'Dr. A. Singh', icd: 'E11.9', cpt: '99214', dos: '2026-03-15' },
    { patient: 'Maria Garcia', dob: '1978-09-03', mrn: 'MRN-200567', provider: 'Dr. L. Chen', icd: 'I10', cpt: '71046', dos: '2026-03-18' },
    { patient: 'David Kim', dob: '1982-12-25', mrn: 'MRN-300891', provider: 'Dr. R. Patel', icd: 'F41.1', cpt: '93000', dos: '2026-03-20' },
  ]
  const rec = records[index % records.length]
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const gray = rgb(0.4, 0.4, 0.4)

  let y = 740
  page.drawText('PRIOR AUTHORIZATION REQUEST', { x: 50, y, font: bold, size: 18 })
  y -= 40
  page.drawText('Patient Information', { x: 50, y, font: bold, size: 12 })
  y -= 20
  page.drawText(`Patient Name: ${rec.patient}`, { x: 50, y, font, size: 11 })
  y -= 18
  page.drawText(`Date of Birth: ${rec.dob}`, { x: 50, y, font, size: 11 })
  y -= 18
  page.drawText(`Patient ID: ${rec.mrn}`, { x: 50, y, font, size: 11 })

  y -= 30
  page.drawText('Provider Information', { x: 50, y, font: bold, size: 12 })
  y -= 20
  page.drawText(`Provider: ${rec.provider}`, { x: 50, y, font, size: 11 })
  y -= 18
  page.drawText(`NPI: ${String(Math.floor(Math.random() * 9000000000) + 1000000000)}`, { x: 50, y, font, size: 11 })

  y -= 30
  page.drawText('Clinical Information', { x: 50, y, font: bold, size: 12 })
  y -= 20
  page.drawText(`Diagnosis Code (ICD-10): ${rec.icd}`, { x: 50, y, font, size: 11 })
  y -= 18
  page.drawText(`Procedure Code (CPT): ${rec.cpt}`, { x: 50, y, font, size: 11 })
  y -= 18
  page.drawText(`Date of Service: ${rec.dos}`, { x: 50, y, font, size: 11 })

  y -= 30
  page.drawText('Clinical Notes:', { x: 50, y, font: bold, size: 11 })
  y -= 18
  page.drawText('Patient presents with symptoms consistent with the above diagnosis.', { x: 50, y, font, size: 10, color: gray })
  y -= 14
  page.drawText('Prior authorization requested for the indicated procedure.', { x: 50, y, font, size: 10, color: gray })

  const bytes = await doc.save()
  const filename = `prior-auth-${rec.patient.toLowerCase().replace(/\s/g, '-')}.pdf`
  writeFileSync(join(OUTPUT_DIR, filename), bytes)
  return filename
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`Generating PDFs in ${OUTPUT_DIR}...`)

  const files: string[] = []
  for (let i = 0; i < 6; i++) files.push(await generateInvoice(i))
  for (let i = 0; i < 4; i++) files.push(await generateKYC(i))
  for (let i = 0; i < 3; i++) files.push(await generateMedical(i))

  console.log(`Generated ${files.length} PDFs:`)
  files.forEach((f) => console.log(`  ${f}`))
}

main().catch((err) => { console.error(err); process.exit(1) })
