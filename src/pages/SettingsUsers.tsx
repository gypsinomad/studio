import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  User, 
  Mail, 
  Shield, 
  Settings, 
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const userFormSchema = z.object({
  email: z.string().email("Invalid email"),
  displayName: z.string().min(1, "Display name is required"),
  role: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  permissions: z.array(z.string()).optional()
});

type UserFormData = z.infer<typeof userFormSchema>;

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  lastLogin?: any;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrator', icon: <Crown className="h-4 w-4" /> },
  { value: 'manager', label: 'Manager', icon: <UserCheck className="h-4 w-4" /> },
  { value: 'sales', label: 'Sales', icon: <Users className="h-4 w-4" /> },
  { value: 'support', label: 'Support', icon: <UserCheck className="h-4 w-4" /> },
  { value: 'viewer', label: 'Viewer', icon: <User className="h-4 w-4" /> }
];

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Support', 'Finance', 'Operations', 'Management', 'IT', 'HR'
];

const PERMISSIONS = [
  'dashboard_view', 'leads_read', 'leads_write', 'leads_delete',
  'orders_read', 'orders_write', 'orders_delete', 'customers_read', 'customers_write',
  'contacts_read', 'contacts_write', 'tasks_read', 'tasks_write', 'documents_read', 'documents_write',
  'reports_view', 'reports_export', 'users_read', 'users_write', 'settings_read', 'settings_write'
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS,
  manager: ['dashboard_view', 'leads_read', 'leads_write', 'orders_read', 'orders_write', 'customers_read', 'customers_write', 'contacts_read', 'contacts_write', 'tasks_read', 'tasks_write', 'documents_read', 'documents_write', 'reports_view', 'reports_export', 'users_read'],
  sales: ['dashboard_view', 'leads_read', 'leads_write', 'orders_read', 'orders_write', 'customers_read', 'customers_write', 'contacts_read', 'contacts_write', 'tasks_read', 'tasks_write', 'documents_read', 'documents_write', 'reports_view'],
  support: ['dashboard_view', 'customers_read', 'customers_write', 'contacts_read', 'contacts_write', 'tasks_read', 'tasks_write', 'documents_read', 'documents_write'],
  viewer: ['dashboard_view', 'leads_read', 'orders_read', 'customers_read', 'contacts_read', 'tasks_read', 'documents_read', 'reports_view']
};

const SettingsUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      displayName: '',
      role: 'viewer',
      department: '',
      phone: '',
      status: 'pending',
      permissions: []
    }
  });

  // Fetch users
  useEffect(() => {
    if (!user?.orgId) return;

    const fetchUsers = () => {
      setRefreshing(true);
      const q = query(
        collection(db, 'users'),
        where('orgId', '==', user.orgId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AppUser));
        setUsers(usersData);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchUsers();
    return () => unsubscribe();
  }, [user?.orgId]);

  // Form submission
  const onSubmit = async (data: UserFormData) => {
    if (!user?.orgId) return;

    try {
      const userData = {
        ...data,
        permissions: ROLE_PERMISSIONS[data.role] || [],
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        orgId: user.orgId
      };

      // In a real implementation, you would create a Firebase Auth user first
      // For now, we'll just add to Firestore
      await addDoc(collection(db, 'users'), userData);
      toast.success('User invited successfully');
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  // Update user
  const updateUser = async (data: UserFormData) => {
    if (!user?.orgId || !selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        ...data,
        permissions: ROLE_PERMISSIONS[data.role] || [],
        updatedAt: new Date()
      });
      toast.success('User updated successfully');
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj?.icon || <User className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const UserCard: React.FC<{ user: AppUser }> = ({ user }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg truncate">{user.displayName}</h3>
              <Badge className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-blue-600">{user.email}</span>
              </div>
              
              {user.department && (
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{user.department}</span>
                </div>
              )}
              
              {user.phone && (
                <div className="flex items-center space-x-2">
                  <Settings className="h-3 w-3 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                {getRoleIcon(user.role)}
                <Badge variant="outline" className="text-xs">
                  {ROLES.find(r => r.value === user.role)?.label}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.lastLogin && (
                  <span className="text-xs text-muted-foreground">
                    Last login: {format(user.lastLogin.toDate(), 'MMM dd, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                form.reset({
                  email: user.email,
                  displayName: user.displayName,
                  role: user.role,
                  department: user.department || '',
                  phone: user.phone || '',
                  status: user.status,
                  permissions: user.permissions
                });
                setShowEditDialog(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setShowPermissionsDialog(true);
              }}
            >
              <Key className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleUserStatus(user.id, user.status)}
            >
              {user.status === 'active' ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteUser(user.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users and permissions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setRefreshing(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ROLES.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-center space-x-2">
                                    {role.icon}
                                    <span>{role.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DEPARTMENTS.map(dept => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                          <FormMessage />
                        </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {ROLES.map(role => (
              <SelectItem key={role.value} value={role.value}>
                <div className="flex items-center space-x-2">
                  {role.icon}
                  <span>{role.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(updateUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center space-x-2">
                                {role.icon}
                                <span>{role.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Permissions</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {getInitials(selectedUser.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.displayName}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant="outline">
                    {ROLES.find(r => r.value === selectedUser.role)?.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Current Permissions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedUser.permissions.map(permission => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsUsers;
