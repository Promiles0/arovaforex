import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/seo/SEO";

export default function AdminNotifications() {
  return (
    <>
      <SEO title="Admin Notifications | Arova" description="Send push or in-app notifications and review history." />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-semibold mb-4">Notifications</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Title / Type" />
              <Textarea placeholder="Message" />
              <Button>Send</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>—</div>
              <div>—</div>
              <div>—</div>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </>
  );
}
