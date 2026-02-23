import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { X, Pencil, Eye } from 'lucide-react';

interface OutboundEmail {
  id: string;
  lead_id: string;
  subject: string;
  body: string;
  status: 'draft' | 'approved' | 'queued' | 'sent' | 'failed';
  sent_at?: string;
  error?: string;
  created_at: string;
  lead_company_name?: string;
  lead_contact_name?: string;
  lead_contact_email?: string;
}

interface EmailPreviewProps {
  email: OutboundEmail | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emailId: string, subject: string, body: string) => void;
}

export function EmailPreview({ email, isOpen, onClose, onSave }: EmailPreviewProps) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (email) {
      setSubject(email.subject);
      setBody(email.body);
      setEditing(false);
    }
  }, [email]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !email) return null;

  const canEdit = email.status === 'draft';

  function handleSave() {
    onSave(email!.id, subject, body);
    setEditing(false);
  }

  function handleCancel() {
    setSubject(email!.subject);
    setBody(email!.body);
    setEditing(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {editing
                ? t('agent.email.preview.editing' as any)
                : t('agent.email.preview.title' as any)}
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                  title={editing ? t('agent.email.preview.view' as any) : t('agent.email.preview.edit' as any)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  {editing ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {/* To field (read-only) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('agent.email.preview.to' as any)}
            </label>
            <p className="text-sm text-foreground mt-1">
              {email.lead_contact_name || email.lead_company_name || '-'}
              {email.lead_contact_email && (
                <span className="text-muted-foreground ml-2">&lt;{email.lead_contact_email}&gt;</span>
              )}
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('agent.email.preview.subject' as any)}
            </label>
            {editing ? (
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <p className="text-sm text-foreground mt-1">{subject}</p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('agent.email.preview.body' as any)}
            </label>
            {editing ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            ) : (
              <div
                className="mt-1 text-sm text-foreground whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
          </div>

          {/* Actions */}
          {editing && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="border-gray-500/50 text-gray-400 hover:text-gray-300">
                {t('agent.email.preview.cancel' as any)}
              </Button>
              <Button size="sm" onClick={handleSave}>
                {t('agent.email.preview.save' as any)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
