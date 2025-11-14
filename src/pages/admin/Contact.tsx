"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Clock,
  CheckCircle,
  X,
  Send,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ContactMessage {
  id: string;
  user_id: string;
  name?: string;
  email: string;
  subject: string;
  category?: string;
  message: string;
  status: string;
  admin_response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * AdminContact page
 * - Drawer message view with next/prev
 * - Pagination & sorting
 * - Bulk select + bulk actions (mark resolved, delete)
 * - WhatsApp quick contact (uses NEXT_PUBLIC_WHATSAPP_NUMBER if provided)
 */

export default function AdminContact() {
  // Data and UI state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Pagination & sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortMode, setSortMode] = useState<
    "newest" | "oldest" | "unresolved_first"
  >("newest");

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Keep loading/updating when filters change
  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel("contact-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => loadMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      // We'll filter client-side for search and sorting; server-side status filter reduces data fetch size
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        // normalize created_at to strings (they already are) and set
        setMessages(data);
        // reset pagination & selection when data changes
        setPage(1);
        setSelectedIds({});
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      toast.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  // ----- Filtering, Sorting, Pagination -----
  const filteredSorted = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    let arr = messages.filter((m) => {
      const matchesSearch =
        m.email?.toLowerCase().includes(search) ||
        m.subject?.toLowerCase().includes(search) ||
        m.message.toLowerCase().includes(search) ||
        m.name?.toLowerCase().includes(search);
      return matchesSearch;
    });

    if (sortMode === "newest") {
      arr = arr.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortMode === "oldest") {
      arr = arr.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortMode === "unresolved_first") {
      arr = arr.sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.status === "open" ? -1 : 1;
      });
    }

    return arr;
  }, [messages, searchTerm, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const paged = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  // Update page if page exceeds range (e.g., after filtering)
  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  // ----- Bulk actions -----
  const toggleSelect = (id: string) => {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectAllOnPage = () => {
    const newMap = { ...selectedIds };
    paged.forEach((m) => (newMap[m.id] = true));
    setSelectedIds(newMap);
  };

  const clearSelection = () => setSelectedIds({});

  const getSelectedArray = () => Object.keys(selectedIds).filter((k) => selectedIds[k]);

  const bulkMarkResolved = async () => {
    const ids = getSelectedArray();
    if (ids.length === 0) return toast.error("No messages selected.");
    if (!window.confirm(`Mark ${ids.length} message(s) as resolved?`)) return;

    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "resolved", responded_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} message(s) marked resolved.`);
      clearSelection();
      loadMessages();
    } catch (err) {
      console.error("Bulk mark error:", err);
      toast.error("Failed to mark messages resolved.");
    }
  };

  const bulkDelete = async () => {
    const ids = getSelectedArray();
    if (ids.length === 0) return toast.error("No messages selected.");
    if (!window.confirm(`Delete ${ids.length} message(s)? This cannot be undone.`))
      return;

    try {
      const { error } = await supabase.from("contact_messages").delete().in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} message(s) deleted.`);
      clearSelection();
      loadMessages();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete messages.");
    }
  };

  // ----- Single reply flow -----
  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSending(true);

    try {
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          admin_response: replyText,
          status: "resolved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedMessage.id);

      if (updateError) throw updateError;

      if (selectedMessage.user_id) {
        await supabase.from("notifications").insert({
          user_id: selectedMessage.user_id,
          type: "system",
          content: `Admin responded to your message: "${selectedMessage.subject}"`,
          link: "/support",
        });
      }

      try {
     const res = await fetch(
  `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/send-contact-reply-email`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userEmail: selectedMessage.email,
      userName: selectedMessage.name,
      subject: selectedMessage.subject,
      adminResponse: replyText,
    }),
  }
);

        const data = await res.json();
        if (!res.ok) {
          console.error("Email send error:", data);
          toast.error("Reply saved but email failed.");
        } else {
          toast.success("Reply sent and email delivered!");
        }
      } catch (emailError) {
        console.error("Email failed:", emailError);
        toast.error("Reply saved, email failed.");
      }

      // refresh and close
      setSelectedMessage(null);
      setReplyText("");
      loadMessages();
    } catch (error) {
      console.error("Error replying:", error);
      toast.error("Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  };

  // ----- Drawer navigation (next / prev) -----
  const currentIndex = useMemo(() => {
    if (!selectedMessage) return -1;
    return filteredSorted.findIndex((m) => m.id === selectedMessage.id);
  }, [selectedMessage, filteredSorted]);

  const openByIndex = (idx: number) => {
    if (idx < 0 || idx >= filteredSorted.length) return;
    setSelectedMessage(filteredSorted[idx]);
    // ensure the page shows that index
    const idxPage = Math.floor(idx / pageSize) + 1;
    setPage(idxPage);
  };

  const gotoPrev = () => openByIndex(currentIndex - 1);
  const gotoNext = () => openByIndex(currentIndex + 1);

  // ----- WhatsApp quick contact -----
  // If a WhatsApp number is provided via env, use it. (Vite requires VITE_ prefix)
  // Set VITE_WHATSAPP_NUMBER in your .env (E.164 without +), e.g. VITE_WHATSAPP_NUMBER=1234567890
  const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "") as string;
   const openWhatsApp = (msg?: ContactMessage) => {
     let text = `Hello${msg?.name ? ` ${msg.name}` : ""}, regarding your message "${msg?.subject ?? ""}" - `;
     text += `Reply from admin: `;
     const encoded = encodeURIComponent(text);
     if (WHATSAPP_NUMBER) {
    } else {
      // opens WhatsApp Web composer
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  };

  // ----- Utilities -----
  const toggleSort = () => {
    setSortMode((s) =>
      s === "newest" ? "oldest" : s === "oldest" ? "unresolved_first" : "newest"
    );
  };

  const markSingleResolved = async (id: string) => {
    if (!window.confirm("Mark this message as resolved?")) return;
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "resolved", responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Message marked resolved.");
      loadMessages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark resolved.");
    }
  };

  const deleteSingle = async (id: string) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
      toast.success("Message deleted.");
      loadMessages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete.");
    }
  };

  // Derived stats
  const stats = {
    total: messages.length,
    open: messages.filter((m) => m.status === "open").length,
    resolved: messages.filter((m) => m.status === "resolved").length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Contact Messages</h1>
          <p className="text-muted-foreground">Manage user inquiries and support requests</p>
        </div>

        {/* Controls: search, sort, bulk actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={toggleSort} title="Toggle sort">
              Sort: {sortMode === "newest" ? "Newest" : sortMode === "oldest" ? "Oldest" : "Unresolved first"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // quick page reset & reload
                setSearchTerm("");
                setStatusFilter("all");
                setSortMode("newest");
                loadMessages();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          className="bg-card/50 border border-border rounded-xl p-5 border-l-4 border-l-blue-500"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-card/50 border border-border rounded-xl p-5 border-l-4 border-l-orange-500"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-orange-500">{stats.open}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-card/50 border border-border rounded-xl p-5 border-l-4 border-l-green-500"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
            <Button size="sm" variant={statusFilter === "all" ? "default" : "ghost"} onClick={() => setStatusFilter("all")}>All</Button>
            <Button size="sm" variant={statusFilter === "open" ? "default" : "ghost"} onClick={() => setStatusFilter("open")}>Open</Button>
            <Button size="sm" variant={statusFilter === "resolved" ? "default" : "ghost"} onClick={() => setStatusFilter("resolved")}>Resolved</Button>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2 ml-2">
            <Button size="sm" variant="ghost" onClick={selectAllOnPage}>Select page</Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>Clear</Button>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="default" onClick={bulkMarkResolved} className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Mark Resolved
              </Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete} className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Page size:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>
            <div className="px-3 py-1 bg-muted/30 rounded">{page} / {totalPages}</div>
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <div className="grid grid-cols-[50px,1fr,1fr,2fr,150px,120px] gap-4 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase hidden md:grid">
            <div className="pl-2">Select</div>
            <div>From</div>
            <div>Email</div>
            <div>Subject</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Mail className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y">
              {paged.map((message, i) => (
                <motion.div
                  key={message.id}
                  className="grid grid-cols-[50px,1fr,1fr,2fr,150px,120px] gap-4 px-4 py-4 hover:bg-muted/50 cursor-pointer items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={!!selectedIds[message.id]}
                      onChange={() => toggleSelect(message.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="font-medium truncate" onClick={() => setSelectedMessage(message)}>{message.name || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground truncate" onClick={() => setSelectedMessage(message)}>{message.email}</div>
                  <div className="truncate" onClick={() => setSelectedMessage(message)}>{message.subject}</div>

                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedMessage(message); }}>
                      View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => markSingleResolved(message.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteSingle(message.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DRAWER – MESSAGE VIEW WITH NEXT/PREV & WHATSAPP */}
      <Drawer open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DrawerContent className="ml-auto w-full max-w-xl border-l shadow-xl">
          <DrawerHeader className="border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DrawerTitle className="text-lg font-semibold">Message Details</DrawerTitle>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={gotoPrev} disabled={currentIndex <= 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button size="sm" variant="ghost" onClick={gotoNext} disabled={currentIndex === -1 || currentIndex >= filteredSorted.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => { if (selectedMessage) openWhatsApp(selectedMessage); }}>
                <Phone className="w-4 h-4" /> WhatsApp
              </Button>

              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {selectedMessage && (
            <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-lg">
                  {selectedMessage.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{selectedMessage.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedMessage.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase">Category</p>
                  {selectedMessage.category ? <Badge variant="outline">{selectedMessage.category}</Badge> : <p className="text-sm text-muted-foreground">—</p>}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase">Date</p>
                  <p className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase">Status</p>
                  <Badge variant={selectedMessage.status === "open" ? "destructive" : "default"} className={selectedMessage.status === "resolved" ? "bg-green-500" : ""}>
                    {selectedMessage.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Subject</p>
                <h3 className="font-semibold">{selectedMessage.subject}</h3>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Message</p>
                <div className="bg-muted/40 p-4 rounded-lg whitespace-pre-wrap text-sm">{selectedMessage.message}</div>
              </div>

              {selectedMessage.admin_response && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Previous Response</p>
                  <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded-lg text-sm">{selectedMessage.admin_response}</div>
                </div>
              )}

              {selectedMessage.status !== "resolved" && (
                <div className="pt-4 border-t">
                  <p className="font-semibold mb-2">Write a reply:</p>

                  <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={6} placeholder="Type your response..." className="text-base" />

                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1" size="lg" onClick={handleReply} disabled={!replyText.trim() || isSending}>
                      {isSending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" /> Send Reply
                        </>
                      )}
                    </Button>

                    <Button size="lg" variant="outline" onClick={() => { setReplyText(""); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Small action row */}
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => selectedMessage && markSingleResolved(selectedMessage.id)}>Mark Resolved</Button>
                <Button size="sm" variant="destructive" onClick={() => selectedMessage && deleteSingle(selectedMessage.id)}>Delete</Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
