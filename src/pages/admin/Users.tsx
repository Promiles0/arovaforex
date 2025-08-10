import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";

export default function AdminUsers() {
  return (
    <>
      <SEO title="Admin Users | Arova" description="Manage users: search, filter, paginate, and edit profiles." />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Users</h1>
        </header>
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">User Management</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Search users…" className="max-w-xs" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableCaption>Pagination & actions coming soon.</TableCaption>
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
                  {[1,2,3].map((i) => (
                    <TableRow key={i}>
                      <TableCell>—</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell><Badge variant="secondary">user</Badge></TableCell>
                      <TableCell>—</TableCell>
                      <TableCell><Badge>Active</Badge></TableCell>
                      <TableCell className="text-right">—</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </>
  );
}
