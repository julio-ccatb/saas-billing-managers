"use client";

import { useState } from "react";
import { Copy, Check, ShieldAlert, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface CreatedKeyModalProps {
  data: { key: string; name: string } | null;
  onClose: () => void;
}

export function CreatedKeyModal({ data, onClose }: CreatedKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    void navigator.clipboard.writeText(data.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <span>New License Key Generated</span>
          </DialogTitle>
        </DialogHeader>

        {data && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                Save this key securely. For security reasons, the full key secret will not be displayed again.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">{data.name}</p>
              <div className="p-3 bg-muted/40 border border-border rounded-xl font-mono text-xs text-foreground break-all select-all flex items-center justify-between gap-2">
                <span>{data.key}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2 text-xs gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={onClose} size="sm" className="w-full">
                I have securely saved this key
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
