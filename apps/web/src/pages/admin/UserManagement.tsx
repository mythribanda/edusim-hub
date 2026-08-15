import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { PageWrapper } from '@/components/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Mail, User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<User[]>('/api/admin/users');
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error loading users',
        description: err.message || 'Failed to fetch user list from backend.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      await api.patch(`/api/users/${userId}/role`, { role: newRole });
      
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      
      toast({
        title: 'Role updated successfully',
        description: `User role has been updated to ${newRole}.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to update role',
        description: err.message || 'An error occurred during the update.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(query) || false;
    const emailMatch = u.email.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  return (
    <PageWrapper>
      <div className="glass-strong rounded-3xl p-8 mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              View and manage system users and adjust their roles (Admin, Educator, Student).
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card/50 p-3 pl-12 focus-ring text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-mono">Loading user directory...</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground">Role</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span>{u.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : u.role === 'educator'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-block text-left">
                          <Select
                            disabled={updatingUserId === u.id}
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.id, val)}
                          >
                            <SelectTrigger className="w-[130px] rounded-xl border-border bg-card/60">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="student" className="cursor-pointer">Student</SelectItem>
                              <SelectItem value="educator" className="cursor-pointer">Educator</SelectItem>
                              <SelectItem value="admin" className="cursor-pointer">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
