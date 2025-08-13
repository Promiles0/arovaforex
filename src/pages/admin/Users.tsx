import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Mail, Shield, ShieldOff, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_suspended: boolean;
  created_at: string;
  roles: AppRole[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const { toast } = useToast();
  
  const USERS_PER_PAGE = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // First get profiles
      let profileQuery = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          is_suspended,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE - 1);

      if (searchQuery) {
        profileQuery = profileQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        profileQuery = profileQuery.eq('is_suspended', statusFilter === "suspended");
      }

      const { data: profiles, error: profileError, count } = await profileQuery;
      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setTotalUsers(count || 0);
        return;
      }

      // Get roles for these users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine data
      const transformedData = profiles.map(user => ({
        ...user,
        roles: roles?.filter(r => r.user_id === user.user_id).map(r => r.role) || []
      }));

      // Filter by role if needed
      let filteredData = transformedData;
      if (roleFilter !== "all") {
        filteredData = transformedData.filter(user => 
          user.roles.includes(roleFilter as AppRole)
        );
      }

      setUsers(filteredData);
      setTotalUsers(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, currentPage]);

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset sent",
        description: `Reset link sent to ${email}`
      });
    } catch (error) {
      console.error('Error sending reset:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset",
        variant: "destructive"
      });
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast({
        title: suspend ? "User suspended" : "User reactivated",
        description: `User has been ${suspend ? 'suspended' : 'reactivated'} successfully`
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  return (
    <>
      <SEO title="Admin Users | Arova" description="Manage users: search, filter, paginate, and edit profiles." />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </header>
        
        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-base">User Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users…" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-6 bg-muted animate-pulse rounded w-16" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-6 bg-muted animate-pulse rounded w-16" /></TableCell>
                        <TableCell className="text-right"><div className="h-8 bg-muted animate-pulse rounded w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || "—"}
                        </TableCell>
                        <TableCell>
                          {user.email || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.roles.map(role => (
                              <Badge 
                                key={role}
                                variant={role === 'admin' ? 'default' : 'secondary'}
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.is_suspended ? 'destructive' : 'default'}
                          >
                            {user.is_suspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {user.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(user.email!)}
                                className="h-8 w-8 p-0"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  {user.is_suspended ? (
                                    <Shield className="h-4 w-4" />
                                  ) : (
                                    <ShieldOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {user.is_suspended ? 'Reactivate' : 'Suspend'} User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to {user.is_suspended ? 'reactivate' : 'suspend'} {user.full_name || user.email}?
                                    {!user.is_suspended && " This will prevent them from accessing the application."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleSuspendUser(user.user_id, !user.is_suspended)}
                                  >
                                    {user.is_suspended ? 'Reactivate' : 'Suspend'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * USERS_PER_PAGE + 1} to {Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </>
  );
}
