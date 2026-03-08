import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Search, Filter, RefreshCw, Clock, User, FileText, Bell, Ban, Pencil, Trash2, Plus, Radio, ChevronLeft, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any> | null;
  created_at: string;
  admin_name?: string;
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  suspend: { icon: <Ban className="w-3.5 h-3.5" />, color: "destructive", label: "Suspended" },
  reactivate: { icon: <User className="w-3.5 h-3.5" />, color: "default", label: "Reactivated" },
  create: { icon: <Plus className="w-3.5 h-3.5" />, color: "default", label: "Created" },
  update: { icon: <Pencil className="w-3.5 h-3.5" />, color: "secondary", label: "Updated" },
  delete: { icon: <Trash2 className="w-3.5 h-3.5" />, color: "destructive", label: "Deleted" },
  send: { icon: <Bell className="w-3.5 h-3.5" />, color: "default", label: "Sent" },
  broadcast: { icon: <Radio className="w-3.5 h-3.5" />, color: "default", label: "Broadcast" },
  respond: { icon: <FileText className="w-3.5 h-3.5" />, color: "secondary", label: "Responded" },
};

const TARGET_LABELS: Record<string, string> = {
  user: "User",
  profile: "Profile",
  forecast: "Forecast",
  notification: "Notification",
  contact: "Contact",
  calendar_event: "Calendar Event",
  content: "Content",
  stream: "Live Stream",
  assistant: "AI Assistant",
};

const PAGE_SIZE = 25;

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, string>>({});

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (targetFilter !== "all") query = query.eq("target_type", targetFilter);

    const { data, count, error } = await query;
    if (!error && data) {
      setEntries(data as AuditEntry[]);
      setTotalCount(count || 0);

      // Fetch admin names
      const adminIds = [...new Set(data.map((e: any) => e.admin_id))];
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", adminIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || "Admin"; });
          setAdminProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, targetFilter]);

  const filtered = search
    ? entries.filter(e =>
        (adminProfiles[e.admin_id] || "").toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.target_type.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(e.details || {}).toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const actionCfg = (action: string) => ACTION_CONFIG[action] || { icon: <FileText className="w-3.5 h-3.5" />, color: "outline", label: action };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track all admin actions across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Actions", value: totalCount, icon: <FileText className="w-4 h-4" /> },
          { label: "Today", value: entries.filter(e => new Date(e.created_at).toDateString() === new Date().toDateString()).length, icon: <Clock className="w-4 h-4" /> },
          { label: "Unique Admins", value: new Set(entries.map(e => e.admin_id)).size, icon: <User className="w-4 h-4" /> },
          { label: "Action Types", value: new Set(entries.map(e => e.action)).size, icon: <Shield className="w-4 h-4" /> },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.keys(ACTION_CONFIG).map(a => <SelectItem key={a} value={a}>{ACTION_CONFIG[a].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={targetFilter} onValueChange={v => { setTargetFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Target" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {Object.keys(TARGET_LABELS).map(t => <SelectItem key={t} value={t}>{TARGET_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No audit log entries found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry, i) => {
                  const cfg = actionCfg(entry.action);
                  const name = adminProfiles[entry.admin_id] || "Unknown";
                  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.color as any} className="gap-1 text-xs">
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {TARGET_LABELS[entry.target_type] || entry.target_type}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[250px]">
                        {entry.details ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground truncate block cursor-help">
                                {Object.entries(entry.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(entry.details, null, 2)}</pre>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{format(new Date(entry.created_at), "PPpp")}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({totalCount} entries)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
