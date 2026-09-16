"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface SigningUrlModalProps {
  data: { signingUrl: string; contractNumber: string } | null;
  onClose: () => void;
}

export function SigningUrlModal({ data, onClose }: SigningUrlModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    void navigator.clipboard.writeText(data.signingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>DocuSeal Contract Dispatched!</span>
          </DialogTitle>
        </DialogHeader>

        {data && (
          <div className="space-y-4 py-2 text-xs">
            <p className="text-muted-foreground">
              The dynamic agreement for contract <strong className="font-mono text-foreground">{data.contractNumber}</strong> has been generated and pushed to DocuSeal.
            </p>

            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <span className="text-[10px] font-mono uppercase font-semibold text-muted-foreground">
                Client Direct Signing Link
              </span>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={data.signingUrl}
                  className="font-mono text-xs bg-background h-8"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 gap-1 shrink-0"
                  onClick={handleCopy}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={data.signingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
              >
                <span>Open Client Signing View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-center text-[11px] text-muted-foreground">
                Open this link in a new tab to test signing the document as the client.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
