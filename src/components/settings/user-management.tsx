'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Plus, UserPlus, Loader2 } from 'lucide-react'

type User = {
  id: string
  email: string
  name: string
  role: 'admin' | 'reviewer' | 'viewer'
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/v1/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        name: form.get('name'),
        password: form.get('password'),
        role: form.get('role'),
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setUsers([...users, data])
      setShowForm(false)
    }
    setSaving(false)
  }

  async function updateRole(userId: string, role: string) {
    const res = await fetch(`/api/v1/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: role as User['role'] } : u)))
    }
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    reviewer: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Users</CardTitle>
          <CardDescription>{users.length} members</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={handleCreate} className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input name="name" required placeholder="Jane Doe" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" required placeholder="jane@company.com" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <Input name="password" type="password" required placeholder="Temporary password" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <select name="role" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="viewer">Viewer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create
              </Button>
            </div>
          </form>
        )}

        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <select
              value={user.role}
              onChange={(e) => updateRole(user.id, e.target.value)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 cursor-pointer ${roleColors[user.role]}`}
            >
              <option value="admin">Admin</option>
              <option value="reviewer">Reviewer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
