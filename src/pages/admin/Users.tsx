import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, doc, updateDoc, where, limit, Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Users, Search, Mail, Shield, Eye } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

type User = {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles?: string[];
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  plan?: string;
  status?: string;
};

const ROLES = ['user', 'admin', 'coach', 'sales', 'finance', 'owner'];
const PLANS = ['free', 'basic', 'pro', 'enterprise'];

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editPlan, setEditPlan] = useState<string>('free');

  useEffect(() => {
    trackEvent('admin_users_view');
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as User[];
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function openEditDialog(user: User) {
    setSelectedUser(user);
    setEditRoles(user.roles || ['user']);
    setEditPlan(user.plan || 'free');
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', selectedUser.id), {
        roles: editRoles,
        plan: editPlan,
        updatedAt: Timestamp.now(),
      });
      trackEvent('admin_user_role_change', { 
        userId: selectedUser.id, 
        roles: editRoles.join(','),
        plan: editPlan 
      });
      toast.success('User updated');
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(role: string) {
    if (editRoles.includes(role)) {
      setEditRoles(editRoles.filter(r => r !== role));
    } else {
      setEditRoles([...editRoles, role]);
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (user.roles || []).includes(roleFilter);
    
    return matchesSearch && matchesRole;
  });

  function formatDate(ts: Timestamp | undefined): string {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString();
  }

  // Stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => (u.roles || []).includes('admin')).length;
  const recentUsers = users.filter(u => {
    if (!u.createdAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return u.createdAt.toDate() > weekAgo;
  }).length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Users</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Admins</div>
            <div className="text-2xl font-bold">{adminCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">New (7 days)</div>
            <div className="text-2xl font-bold">{recentUsers}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} users
          </span>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Roles</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {(user.displayName || user.email || '?')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium">{user.displayName || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || ['user']).map(role => (
                            <span 
                              key={role} 
                              className={`px-2 py-0.5 text-xs rounded ${
                                role === 'admin' || role === 'owner' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{user.plan || 'free'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage User</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="h-12 w-12 rounded-full" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {(selectedUser.displayName || selectedUser.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{selectedUser.displayName || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Roles
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          editRoles.includes(role)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-muted'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <Select value={editPlan} onValueChange={setEditPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map(plan => (
                        <SelectItem key={plan} value={plan} className="capitalize">{plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-muted-foreground">
                  Joined: {formatDate(selectedUser.createdAt)}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
