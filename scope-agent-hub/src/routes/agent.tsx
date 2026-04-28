import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useSession, fetchLeads, uploadLeads, markLeadAsTricked, sendWhatsApp } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Upload, CheckCircle2, MessageCircle, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/agent")({
  head: () => ({ meta: [{ title: "Agent Dashboard — Scope Media Solution" }] }),
  component: AgentPage,
});

type Lead = {
  _id: string;
  name: string;
  mobile: string;
  pincode: string;
  type: string;
  status: string;
};

function AgentPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [trickingId, setTrickingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadLeads = async () => {
    const data = await fetchLeads();
    setLeads(data);
  };

  useEffect(() => {
    if (session === null) navigate({ to: "/" });
    else if (session && session.role !== "agent") navigate({ to: "/admin" });
    else if (session) loadLeads();
  }, [session, navigate]);

  if (!session || session.role !== "agent") return null;

  const handleUpload = async (file: File) => {
    setLoading(true);
    const res = await uploadLeads(file);
    setLoading(false);
    if (!res.ok) return toast.error(res.error || "Failed to upload leads");
    
    // Trigger "Goal" animation
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b']
    });

    toast.success(res.message);
    loadLeads();
  };

  const handleTrick = async (id: string) => {
    setTrickingId(id);
    try {
      const res = await markLeadAsTricked(id);
      if (res.ok) {
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#22c55e', '#ffffff']
        });
        toast.success("Lead marked as tricked");
        // Update local state immediately for fast feedback
        setLeads(prev => prev.map(l => l._id === id ? { ...l, status: 'tricked' } : l));
      } else {
        toast.error("Failed to mark lead as tricked");
      }
    } finally {
      setTrickingId(null);
    }
  };

  const handleWhatsApp = async (mobile: string, id: string, name: string) => {
    setSendingId(id);
    try {
      const res = await sendWhatsApp(mobile);
      if (res.ok) {
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#25D366', '#ffffff']
        });
        toast.success("WhatsApp message sent via API");
      } else {
        // Fallback to wa.me if API fails
        const text = encodeURIComponent(`⚡EcoPlug Charging Station ⚡\n\nHello ${name} 👋\n\nAs we discussed on the call, we are contacting you from EcoPlug Charging Station.\n\n🚗🔌 EV demand is growing fast, and starting a charging station is a good business opportunity.\n\n📍 If you are interested, please reply or continue chat on WhatsApp.\n\nThank you 🙏\nTeam EcoPlug ⚡`);
        window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${text}`, "_blank");
        toast.info("Opening WhatsApp Web (API connection failed)");
      }
    } finally {
      setSendingId(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleUpload(f);
  };

  return (
    <DashboardShell session={session}>
      <Toaster richColors position="top-right" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {session.name}</h1>
        <p className="text-muted-foreground text-sm">Upload your leads and start working through them.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Upload leads</CardTitle>
          <CardDescription>Supported: CSV, XLSX. Columns: Name, Mobile, Pincode, Type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors relative",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50",
              loading && "opacity-50 cursor-wait pointer-events-none"
            )}
          >
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <div className="font-medium">Saving {leads.length > 1000 ? 'large dataset' : 'leads'} to database...</div>
                <div className="text-xs text-muted-foreground mt-1">Please wait, this might take a moment.</div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
                <div className="font-medium">Drop file here or click to browse</div>
                <div className="text-xs text-muted-foreground mt-1">CSV or XLSX up to 50MB</div>
              </>
            )}
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
          </div>
        </CardContent>
      </Card>

      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leads ({leads.length})</CardTitle>
            <CardDescription>{leads.filter(l => l.status === "tricked").length} tricked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l._id} className={cn(l.status === "tricked" && "bg-success/30 hover:bg-success/40")}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="font-mono text-sm">{l.mobile}</TableCell>
                      <TableCell>{l.pincode}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs font-medium uppercase">
                          {l.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button 
                            size="sm" 
                            variant={l.status === "tricked" ? "secondary" : "default"} 
                            onClick={() => handleTrick(l._id)} 
                            disabled={l.status === "tricked" || trickingId === l._id}
                          >
                            {trickingId === l._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            {l.status === "tricked" ? "Tricked" : trickingId === l._id ? "Processing..." : "Trick"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleWhatsApp(l.mobile, l._id, l.name)}
                            disabled={sendingId === l._id}
                          >
                            {sendingId === l._id ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <MessageCircle className="w-4 h-4 mr-1" />
                            )}
                            {sendingId === l._id ? "Sending..." : "WhatsApp"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}