import { Inngest, EventSchemas } from 'inngest'

type Events = {
  'document/uploaded': {
    data: {
      documentId: string
      tenantId: string
    }
  }
}

export const inngest = new Inngest({
  id: 'doculens',
  schemas: new EventSchemas().fromRecord<Events>(),
})
