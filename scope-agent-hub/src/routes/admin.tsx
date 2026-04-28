import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession, useAgents, createAgent, type Agent } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Users, UserPlus, Phone, Target } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Scope Media Solution" }] }),
  component: AdminPage,
});

function AdminPage() {
  const session = useSession();
  const navigate = useNavigate();
  const { agents, loading, refresh } = useAgents();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (session === null) navigate({ to: "/" });
    else if (session && session.role !== "admin") navigate({ to: "/agent" });
  }, [session, navigate]);

  if (!session || session.role !== "admin") return null;

  const totalLeads = agents.reduce((s, a) => s + (a.totalLeads || 0), 0);
  const totalTricked = agents.reduce((s, a) => s + (a.totalTricked || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email || !form.password) return toast.error("All fields required");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsCreating(true);
    const res = await createAgent(name, email, form.password);
    setIsCreating(false);

    if (!res.ok) return toast.error(res.error || "Failed to create agent");
    
    toast.success(`Agent "${name}" created`);
    setForm({ name: "", email: "", password: "" });
    setOpen(false);
    refresh();
  };

  return (
    <DashboardShell session={session}>
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage agents and monitor performance.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Create Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new agent</DialogTitle>
              <DialogDescription>Agent will use these credentials to sign in.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aemail">Email</Label>
                <Input id="aemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apass">Password</Label>
                <Input id="apass" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="min 6 characters" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create agent</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Agents" value={agents.length} />
        <StatCard icon={<Target className="w-5 h-5" />} label="Total Leads" value={totalLeads} />
        <StatCard icon={<Phone className="w-5 h-5" />} label="Total Tricked" value={totalTricked} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>All registered agents and their activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No agents yet. Click "Create Agent" to add your first one.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total Leads</TableHead>
                    <TableHead className="text-right">Total Tricked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {agents.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.email}</TableCell>
                      <TableCell className="text-right">{a.totalLeads}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/40 text-success-foreground text-xs font-medium">
                          {a.totalTricked}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}