import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";

export default function AdminHome() {
  const greeting = new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: true }).format(new Date());
  const title = "Admin Home | Arova";
  return (
    <>
      <SEO title={title} description="Admin dashboard overview with quick stats and shortcuts." />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">Good {greeting}, Admin 👋</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {["Total Users", "Active Forecasts", "Likes Today", "Inbox Messages"].map((label, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">animated counter</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              <Button size="sm">Send Notification</Button>
              <Button size="sm" variant="secondary">View Reports</Button>
              <Button size="sm" variant="outline">Manage Content</Button>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </>
  );
}
