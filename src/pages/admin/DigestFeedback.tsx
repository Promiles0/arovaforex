import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, MessageSquare, ThumbsUp, ThumbsDown, Filter, Eraser } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = {
  id: string;
  digest_id: string;
  user_id: string;
  rating: "up" | "down";
  comment: string | null;
  created_at: string;
  digest_date: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type FilterRating = "all" | "up" | "down";

export default function AdminDigestFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterRating>("all");
  const [withCommentOnly, setWithCommentOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("news_digest_ratings")
      .select(`
        id, digest_id, user_id, rating, comment, created_at,
        news_digests:digest_id (digest_date),
        profiles:user_id (full_name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      toast.error("Failed to load feedback");
      setLoading(false);
      return;
    }

    const mapped: Row[] = (data ?? []).map((r: any) => ({
      id: r.id,
      digest_id: r.digest_id,
      user_id: r.user_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      digest_date: r.news_digests?.digest_date ?? null,
      full_name: r.profiles?.full_name ?? null,
      avatar_url: r.profiles?.avatar_url ?? null,
    }));
    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== "all" && r.rating !== filter) return false;
      if (withCommentOnly && !r.comment?.trim()) return false;
      return true;
    });
  }, [rows, filter, withCommentOnly]);

  const deleteComment = async (id: string) => {
    const { error } = await supabase
      .from("news_digest_ratings")
      .update({ comment: null })
      .eq("id", id);
    if (error) { toast.error("Failed to clear comment"); return; }
    await supabase.rpc("log_admin_action", {
      p_action: "delete_digest_comment",
      p_target_type: "news_digest_ratings",
      p_target_id: id,
      p_details: null,
    });
    toast.success("Comment cleared");
    setRows(prev => prev.map(r => r.id === id ? { ...r, comment: null } : r));
  };

  const deleteRating = async (id: string) => {
    const { error } = await supabase
      .from("news_digest_ratings")
      .delete()
      .eq("id", id);
    if (error) { toast.error("Failed to delete rating"); return; }
    await supabase.rpc("log_admin_action", {
      p_action: "delete_digest_rating",
      p_target_type: "news_digest_ratings",
      p_target_id: id,
      p_details: null,
    });
    toast.success("Rating deleted");
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const upCount = rows.filter(r => r.rating === "up").length;
  const downCount = rows.filter(r => r.rating === "down").length;
  const commentCount = rows.filter(r => r.comment?.trim()).length;

  return (
    <>
      <SEO title="Digest Feedback Moderation | Admin" description="Moderate AI News Digest feedback and comments" />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Digest Feedback Moderation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and moderate user feedback on AI News Digests.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{upCount}</p>
                <p className="text-xs text-muted-foreground">Thumbs up</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-emerald-500/70" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{downCount}</p>
                <p className="text-xs text-muted-foreground">Thumbs down</p>
              </div>
              <ThumbsDown className="w-8 h-8 text-destructive/70" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{commentCount}</p>
                <p className="text-xs text-muted-foreground">With comments</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary/70" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Feedback ({filtered.length})</CardTitle>
            <div className="flex items-center gap-3">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterRating)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="up">👍 Up</TabsTrigger>
                  <TabsTrigger value="down">👎 Down</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant={withCommentOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setWithCommentOnly(v => !v)}
              >
                <Filter className="w-3.5 h-3.5 mr-2" />
                Comments only
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No feedback found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(r => (
                  <div key={r.id} className="p-4 rounded-lg border border-border bg-card/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarImage src={r.avatar_url ?? undefined} />
                          <AvatarFallback>{(r.full_name ?? "U")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{r.full_name ?? "Anonymous user"}</span>
                            <Badge variant={r.rating === "up" ? "default" : "destructive"} className="text-[10px]">
                              {r.rating === "up" ? <ThumbsUp className="w-3 h-3 mr-1" /> : <ThumbsDown className="w-3 h-3 mr-1" />}
                              {r.rating}
                            </Badge>
                            {r.digest_date && (
                              <Badge variant="outline" className="text-[10px]">
                                Digest: {r.digest_date}
                              </Badge>
                            )}
                          </div>
                          {r.comment ? (
                            <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap break-words">
                              "{r.comment}"
                            </p>
                          ) : (
                            <p className="text-xs italic text-muted-foreground mt-2">No comment</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {new Date(r.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.comment && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eraser className="w-3.5 h-3.5 mr-1" /> Clear comment
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Clear this comment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  The thumbs vote will remain, but the comment will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteComment(r.id)}>Clear</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this rating?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The full feedback (vote + comment) will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRating(r.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </>
  );
}
