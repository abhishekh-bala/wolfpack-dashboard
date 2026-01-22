import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Key, 
  Copy, 
  Check,
  UserPlus,
  Shield
} from 'lucide-react';

interface UserAccount {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  login_name: string | null;
  role: 'admin' | 'supervisor' | 'lead' | 'guide' | 'user';
  password_hint: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  supervisor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  lead: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  guide: 'bg-green-500/20 text-green-400 border-green-500/30',
  user: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function UserManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    loginName: '',
    role: 'guide' as 'admin' | 'supervisor' | 'lead' | 'guide',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('manage-users', {
        body: { action: 'list_users' },
      });

      if (response.error) throw response.error;
      setUsers(response.data.users || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.displayName) {
      toast({
        title: 'Validation Error',
        description: 'Email and display name are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create_user',
          email: newUser.email,
          displayName: newUser.displayName,
          loginName: newUser.loginName || null,
          role: newUser.role,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      toast({
        title: 'User Created',
        description: `Password: ${response.data.user.password}`,
      });

      setNewUser({ email: '', displayName: '', loginName: '', role: 'guide' });
      setShowAddForm(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: { action: 'bulk_create_from_guides' },
      });

      if (response.error) throw response.error;

      const { success, failed } = response.data;
      
      toast({
        title: 'Bulk Creation Complete',
        description: `Created ${success.length} users. ${failed.length} failed.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to bulk create users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: { action: 'reset_password', userId },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      toast({
        title: 'Password Reset',
        description: `New password: ${response.data.password}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (user: UserAccount) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update_user',
          userId: user.user_id,
          email: user.email,
          displayName: user.display_name,
          loginName: user.login_name,
          role: user.role,
          isActive: user.is_active,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      toast({
        title: 'User Updated',
        description: 'User details have been updated',
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete_user', userId },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      toast({
        title: 'User Deleted',
        description: 'User has been removed',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="w-4 h-4" />
          User Management
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5" />
            User Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkCreate}
              disabled={isLoading}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Bulk Create from Guides
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Add User Form */}
          {showAddForm && (
            <div className="p-4 rounded-lg bg-card/50 border border-white/10 space-y-4">
              <h3 className="font-semibold">Add New User</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    placeholder="John Doe"
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label>Login Name (for CSV mapping)</Label>
                  <Input
                    value={newUser.loginName}
                    onChange={(e) => setNewUser({ ...newUser, loginName: e.target.value })}
                    placeholder="jdoe"
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateUser} disabled={isLoading}>
                  Create User
                </Button>
                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-card/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Login Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found. Click "Bulk Create from Guides" to create accounts from your guide list.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Input
                            value={editingUser.display_name}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, display_name: e.target.value })
                            }
                            className="input-dark h-8"
                          />
                        ) : (
                          user.display_name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Input
                            value={editingUser.email}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, email: e.target.value })
                            }
                            className="input-dark h-8"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Input
                            value={editingUser.login_name || ''}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, login_name: e.target.value })
                            }
                            className="input-dark h-8"
                          />
                        ) : (
                          <code className="text-xs bg-card/50 px-1 py-0.5 rounded">
                            {user.login_name || '-'}
                          </code>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Select
                            value={editingUser.role}
                            onValueChange={(value: any) =>
                              setEditingUser({ ...editingUser, role: value })
                            }
                          >
                            <SelectTrigger className="input-dark h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="guide">Guide</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                            {user.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.password_hint && (
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-card/50 px-1 py-0.5 rounded">
                              {user.password_hint}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyPassword(user.password_hint!)}
                            >
                              {copiedPassword === user.password_hint ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Switch
                            checked={editingUser.is_active}
                            onCheckedChange={(checked) =>
                              setEditingUser({ ...editingUser, is_active: checked })
                            }
                          />
                        ) : (
                          <Badge
                            variant="outline"
                            className={
                              user.is_active
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingUser?.id === user.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateUser(editingUser)}
                                disabled={isLoading}
                              >
                                <Check className="w-4 h-4 text-green-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingUser(null)}
                              >
                                ✕
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleResetPassword(user.user_id)}
                                disabled={isLoading}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteUser(user.user_id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Roles:</strong></p>
            <p>• <span className="text-red-400">Admin</span> - Full access to all features</p>
            <p>• <span className="text-purple-400">Supervisor</span> - View all data + export</p>
            <p>• <span className="text-blue-400">Lead</span> - View team data + export</p>
            <p>• <span className="text-green-400">Guide</span> - View own data only (read-only)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}