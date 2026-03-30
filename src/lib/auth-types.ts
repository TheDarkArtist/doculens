import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    tenantId: string
    role: 'admin' | 'reviewer' | 'viewer'
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      tenantId: string
      role: 'admin' | 'reviewer' | 'viewer'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenantId: string
    role: 'admin' | 'reviewer' | 'viewer'
  }
}
