import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Shield, Settings2, Trash2, ShieldCheck, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { Role, Permission } from '@/types'

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
})

type RoleForm = z.infer<typeof roleSchema>

export default function RolesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const qc = useQueryClient()

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  })

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/roles/permissions').then((r) => r.data),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: { permissionIds: [] }
  })

  const selectedPermissions = watch('permissionIds')

  const createMutation = useMutation({
    mutationFn: (data: RoleForm) => api.post('/roles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setIsAddOpen(false)
      reset()
      toast.success('Role created successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create role'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: RoleForm }) => api.put(`/roles/${data.id}`, data.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setEditingRole(null)
      reset()
      toast.success('Role updated successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update role'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role deleted successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete role'),
  })

  const onSubmit = (data: RoleForm) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, payload: data })
    } else {
      createMutation.mutate(data)
    }
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    // @ts-ignore
    reset({ name: role.name, description: role.description || '', permissionIds: role.permissions?.map((p: any) => p.permissionId) || [] })
  }

  const togglePermission = (id: string) => {
    const current = new Set(selectedPermissions)
    if (current.has(id)) current.delete(id)
    else current.add(id)
    setValue('permissionIds', Array.from(current))
  }

  // Group permissions by resource
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    acc[p.resource] = [...(acc[p.resource] || []), p]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage access control and define custom roles for staff and administrators."
        actions={
          <Button onClick={() => { reset(); setIsAddOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-none shadow-soft bg-surface-container-lowest">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-4 flex items-center text-muted-foreground uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 mr-2" /> Summary
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-mono font-black text-primary">{roles.length}</p>
                <p className="text-xs text-muted-foreground">Total Roles</p>
              </div>
              <div>
                <p className="text-2xl font-mono font-black text-secondary">{permissions.length}</p>
                <p className="text-xs text-muted-foreground">Available Permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-soft">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low border-b">
                  <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Role Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Permissions</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading roles...</td></tr>
                  ) : roles.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No roles configured.</td></tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="group hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {role.name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{role.description || '-'}</td>
                        <td className="px-6 py-4">
                          {/* @ts-ignore */}
                          <Badge variant="secondary" className="bg-secondary-container/30 text-secondary">{role.permissions?.length || 0} rules</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {role.isSystem ? <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">System</Badge> : <Badge variant="outline">Custom</Badge>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!role.isSystem && (
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  if (confirm(`Delete the role '${role.name}'?`)) {
                                    deleteMutation.mutate(role.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={isAddOpen || !!editingRole} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingRole(null)
            reset({ permissionIds: [] })
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 pb-2 border-b">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
              <p className="text-sm text-muted-foreground">Define access rules and capabilities for this role.</p>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <form id="role-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Role Name</Label>
                  <Input {...register('name')} placeholder="e.g. Content Editor" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Description</Label>
                  <Input {...register('description')} placeholder="What can this role do?" />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-4 block">Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="rounded-xl border p-4 bg-surface-container-lowest">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">{resource}</h4>
                      <div className="flex flex-wrap gap-2">
                        {perms.map(p => {
                          const isSelected = selectedPermissions.includes(p.id)
                          return (
                            <div 
                              key={p.id}
                              onClick={() => togglePermission(p.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-background text-muted-foreground hover:bg-surface-container-low border-outline-variant/30'
                              }`}
                            >
                              {p.action}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
          
          <div className="p-4 border-t bg-surface-container-lowest flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setEditingRole(null); reset() }}>Cancel</Button>
            <Button type="submit" form="role-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
