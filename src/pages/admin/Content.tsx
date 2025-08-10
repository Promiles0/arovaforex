import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";

export default function AdminContent() {
  return (
    <>
      <SEO title="Admin Content | Arova" description="Manage Arova forecasts and Academy content." />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-semibold mb-4">Content</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Arova Forecasts</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Create, edit, delete forecasts.</p>
              <Button size="sm">New Forecast</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Academy</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Manage lessons & articles.</p>
              <Button size="sm" variant="secondary">New Article</Button>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </>
  );
}
