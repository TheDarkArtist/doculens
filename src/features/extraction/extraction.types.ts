export type NormalizedPage = {
  pageNumber: number
  text: string | null
  hasTextLayer: boolean
}

export type NormalizedDocument = {
  pages: NormalizedPage[]
  format: 'pdf' | 'image'
  pageCount: number
}

export type TextSegment = {
  str: string
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
}
