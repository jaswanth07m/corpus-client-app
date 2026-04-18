import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface CopyUrlButtonProps {
  url: string;
  recordId: string;
  className?: string;
}

const CopyUrlButton: React.FC<CopyUrlButtonProps> = ({
  url,
  recordId,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback for insecure contexts (HTTP)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      toast.success(t('ui.url.copied.to.clipboard'), {
        description: `Record ID: ${recordId}`,
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('common.failed.to.copy.url'));
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors p-2 ${className}`}
      title={t('media.copyRecordUrl')}
    >
      {copied ? (
        <Check size={18} className="text-emerald-500" />
      ) : (
        <Copy size={18} />
      )}
    </Button>
  );
};

export default CopyUrlButton;
