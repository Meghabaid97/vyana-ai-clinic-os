import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, FileImage, CheckCircle2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { readSharedFile } from "@/lib/shareIntent";
import {
  saveToHealthRecords,
  summarizeHealthRecord,
} from "@/lib/healthRecordsPipeline";
import BackHeader from "@/components/BackHeader";

interface PendingShare {
  url: string;
  type: string;
  title: string;
  receivedAt: number;
}

const ALLOWED = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

const ShareReceive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingShare | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  // Load the shared payload, ensure user is authenticated, fetch the file
  useEffect(() => {
    (async () => {
      const raw = sessionStorage.getItem("vyana_pending_shared_file");
      if (!raw) {
        toast({ title: "Nothing to import", description: "No shared file found.", variant: "destructive" });
        navigate("/app");
        return;
      }
      const parsed: PendingShare = JSON.parse(raw);
      setPending(parsed);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Keep the payload and bounce to auth; we'll come back after login
        toast({ title: "Sign in to save", description: "Sign in to add this file to your records." });
        navigate("/auth?redirect=/app/share-receive");
        return;
      }

      try {
        const fileName = parsed.title?.includes(".") ? parsed.title : `${parsed.title || "shared"}.${guessExt(parsed.type)}`;
        const f = await readSharedFile(parsed.url, parsed.type, fileName);
        if (!ALLOWED.includes(f.type)) {
          toast({
            title: "Unsupported file",
            description: "Only PDF and image files can be added.",
            variant: "destructive",
          });
          sessionStorage.removeItem("vyana_pending_shared_file");
          navigate("/app");
          return;
        }
        if (f.size > 10 * 1024 * 1024) {
          toast({ title: "That file's too large", description: "Files need to be under 10 MB", variant: "destructive" });
          sessionStorage.removeItem("vyana_pending_shared_file");
          navigate("/app");
          return;
        }
        setFile(f);
      } catch (e: any) {
        console.error("Failed to read shared file", e);
        toast({ title: "Couldn't open that file", description: e.message || "Try sharing it again", variant: "destructive" });
        sessionStorage.removeItem("vyana_pending_shared_file");
        navigate("/app");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, toast]);

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: patient, error: pErr } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!patient) throw new Error("Patient profile not found");

      const result = await saveToHealthRecords(file, patient.id, user.id);
      if (!result) throw new Error("Save failed");

      setSavedRecordId(result.recordId);
      sessionStorage.removeItem("vyana_pending_shared_file");

      toast({ title: "Added to your records", description: "Analyzing in the background…" });

      // Fire summarization in background; navigate immediately
      summarizeHealthRecord(result.recordId, result.filePath, file.name, file.type).catch((e) =>
        console.error("Background summarize failed", e),
      );
    } catch (e: any) {
      console.error("Share-receive save failed", e);
      toast({ title: "Couldn't save to your records", description: e.message || "Give it another try", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    sessionStorage.removeItem("vyana_pending_shared_file");
    navigate("/app");
  };

  const isImage = file?.type.startsWith("image/");
  const Icon = isImage ? FileImage : FileText;

  return (
    <div className="min-h-svh bg-background">
      <BackHeader title="Add to Vyana" />
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : savedRecordId ? (
          <Card className="p-6 rounded-2xl text-center space-y-4">
            <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Saved to your records</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We're reading it in the background. New vitals or insights will appear shortly.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/app/records")}>
                View records
              </Button>
              <Button className="flex-1 rounded-xl" onClick={() => navigate("/app")}>
                Done
              </Button>
            </div>
          </Card>
        ) : file ? (
          <>
            <Card className="p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB · {file.type.replace("application/", "").toUpperCase()}
                  </p>
                </div>
              </div>
            </Card>

            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vyana will read this document, extract any vitals, and summarize it for you automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleDiscard} disabled={saving}>
                <X className="h-4 w-4 mr-1.5" />
                Discard
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Save to Vyana
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

function guessExt(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export default ShareReceive;
