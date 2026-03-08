import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Shield, ShieldOff, Search, Download, User, Calendar, FileText, ChevronRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format, formatDistanceToNow } from "date-fns";

type AppRole = Database['public']['Enums']['app_role'];

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
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
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [drawerUser, setDrawerUser] = useState<UserData | null>(null);
  const { toast } = useToast();
  
  const USERS_PER_PAGE = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let profileQuery = supabase
        .from('profiles')
        .select('id, user_id, full_name, email, avatar_url, is_suspended, created_at', { count: 'exact' })
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
        setLoading(false);
        return;
      }

      const userIds = profiles.map(p => p.user_id);
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);

      let transformedData = profiles.map(user => ({
        ...user,
        roles: roles?.filter(r => r.user_id === user.user_id).map(r => r.role) || []
      }));

      if (roleFilter !== "all") {
        transformedData = transformedData.filter(user => user.roles.includes(roleFilter as AppRole));
      }

      setUsers(transformedData);
      setTotalUsers(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [searchQuery, roleFilter, statusFilter, currentPage]);

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });
      if (error) throw error;
      toast({ title: "Password reset sent", description: `Reset link sent to ${email}` });
    } catch {
      toast({ title: "Error", description: "Failed to send password reset", variant: "destructive" });
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_suspended: suspend }).eq('user_id', userId);
      if (error) throw error;
      toast({ title: suspend ? "User suspended" : "User reactivated", description: `User has been ${suspend ? 'suspended' : 'reactivated'} successfully` });
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    }
  };

  const handleBulkSuspend = async (suspend: boolean) => {
    const ids = Array.from(selectedUsers);
    if (ids.length === 0) return;
    try {
      for (const uid of ids) {
        await supabase.from('profiles').update({ is_suspended: suspend }).eq('user_id', uid);
      }
      toast({ title: "Success", description: `${ids.length} users ${suspend ? 'suspended' : 'reactivated'}` });
      setSelectedUsers(new Set());
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Bulk action failed", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Roles", "Status", "Registered"];
    const rows = users.map(u => [
      u.full_name || "",
      u.email || "",
      u.roles.join(", "),
      u.is_suspended ? "Suspended" : "Active",
      new Date(u.created_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const toggleSelect = (uid: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };
  const toggleAll = () => {
    if (selectedUsers.size === users.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(users.map(u => u.user_id)));
  };

  const initials = (name: string | null) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U";
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  return (
    <>
      <SEO title="Admin Users | Arova" description="Manage users" />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-muted-foreground text-sm">Manage user accounts, roles, and permissions</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </header>
        
        <Card>
          <CardHeader className="gap-4">
            <CardTitle className="text-base">User Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{selectedUsers.size} selected</span>
                <Button size="sm" variant="destructive" onClick={() => handleBulkSuspend(true)}>Suspend</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkSuspend(false)}>Reactivate</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(new Set())}>Clear</Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={users.length > 0 && selectedUsers.size === users.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>User</TableHead>
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
                        <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="flex items-center gap-3"><div className="w-8 h-8 bg-muted animate-pulse rounded-full" /><div className="space-y-1"><div className="h-4 w-24 bg-muted animate-pulse rounded" /><div className="h-3 w-32 bg-muted animate-pulse rounded" /></div></div></TableCell>
                        <TableCell><div className="h-6 bg-muted animate-pulse rounded w-16" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded w-20" /></TableCell>
                        <TableCell><div className="h-6 bg-muted animate-pulse rounded w-16" /></TableCell>
                        <TableCell className="text-right"><div className="h-8 bg-muted animate-pulse rounded w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDrawerUser(user)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selectedUsers.has(user.user_id)} onCheckedChange={() => toggleSelect(user.user_id)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{user.full_name || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.roles.map(role => (
                              <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_suspended ? 'destructive' : 'default'}>
                            {user.is_suspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {user.email && (
                              <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.email!)} className="h-8 w-8 p-0">
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  {user.is_suspended ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{user.is_suspended ? 'Reactivate' : 'Suspend'} User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to {user.is_suspended ? 'reactivate' : 'suspend'} {user.full_name || user.email}?
                                    {!user.is_suspended && " This will prevent them from accessing the application."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSuspendUser(user.user_id, !user.is_suspended)}>
                                    {user.is_suspended ? 'Reactivate' : 'Suspend'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * USERS_PER_PAGE + 1} to {Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* User Detail Drawer */}
      <Sheet open={!!drawerUser} onOpenChange={(open) => !open && setDrawerUser(null)}>
        <SheetContent className="overflow-y-auto">
          {drawerUser && (
            <>
              <SheetHeader>
                <SheetTitle>User Details</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={drawerUser.avatar_url || ""} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials(drawerUser.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{drawerUser.full_name || "Unknown"}</h3>
                    <p className="text-sm text-muted-foreground">{drawerUser.email}</p>
                    <div className="flex gap-1 mt-1">
                      {drawerUser.roles.map(r => <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'} className="text-xs">{r}</Badge>)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Info</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={drawerUser.is_suspended ? 'destructive' : 'default'} className="mt-1">
                        {drawerUser.is_suspended ? 'Suspended' : 'Active'}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Registered</p>
                      <p className="text-sm font-medium mt-1">{format(new Date(drawerUser.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                      <p className="text-xs text-muted-foreground">Member for</p>
                      <p className="text-sm font-medium mt-1">{formatDistanceToNow(new Date(drawerUser.created_at))}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Actions</h4>
                  {drawerUser.email && (
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleResetPassword(drawerUser.email!)}>
                      <Mail className="w-4 h-4" /> Send Password Reset
                    </Button>
                  )}
                  <Button
                    variant={drawerUser.is_suspended ? "default" : "destructive"}
                    className="w-full justify-start gap-2"
                    onClick={() => { handleSuspendUser(drawerUser.user_id, !drawerUser.is_suspended); setDrawerUser(null); }}
                  >
                    {drawerUser.is_suspended ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                    {drawerUser.is_suspended ? 'Reactivate User' : 'Suspend User'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
