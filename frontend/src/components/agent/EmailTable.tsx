import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { Check, Pencil, Eye, X, MessageSquare } from 'lucide-react';

interface OutboundEmail {
  id: string;
  lead_id: string;
  subject: string;
  body: string;
  status: 'draft' | 'approved' | 'queued' | 'sent' | 'failed' | 'bounced' | 'blocked';
  sent_at?: string;
  error?: string;
  created_at: string;
  lead_company_name?: string;
  lead_contact_name?: string;
  lead_contact_email?: string;
  reply_count?: number;
  last_reply_at?: string;
}

interface EmailTableProps {
  emails: OutboundEmail[];
  onApprove: (emailId: string) => void;
  onEdit: (email: OutboundEmail) => void;
  onViewReplies?: (email: OutboundEmail) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  queued: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  sent: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  bounced: 'bg-red-500/20 text-red-400 border-red-500/30',
  blocked: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const COUNTDOWN_SECONDS = 10;

export type { OutboundEmail };

export function EmailTable({ emails, onApprove, onEdit, onViewReplies }: EmailTableProps) {
  const { t } = useT();
  // Track which email IDs are in countdown mode and their remaining seconds
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const clearCountdown = useCallback((emailId: string) => {
    if (intervalsRef.current[emailId]) {
      clearInterval(intervalsRef.current[emailId]);
      delete intervalsRef.current[emailId];
    }
    setCountdowns((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  function startCountdown(emailId: string) {
    setCountdowns((prev) => ({ ...prev, [emailId]: COUNTDOWN_SECONDS }));

    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const remaining = (prev[emailId] || 0) - 1;
        if (remaining <= 0) {
          // Countdown complete — approve
          clearInterval(interval);
          delete intervalsRef.current[emailId];
          onApprove(emailId);
          const next = { ...prev };
          delete next[emailId];
          return next;
        }
        return { ...prev, [emailId]: remaining };
      });
    }, 1000);

    intervalsRef.current[emailId] = interval;
  }

  function cancelCountdown(emailId: string) {
    clearCountdown(emailId);
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('agent.emails.empty' as any)}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">{t('agent.emails.col.to' as any)}</th>
            <th className="pb-3 pr-4 font-medium">{t('agent.emails.col.subject' as any)}</th>
            <th className="pb-3 pr-4 font-medium">{t('agent.emails.col.status' as any)}</th>
            <th className="pb-3 pr-4 font-medium">{t('agent.emails.col.date' as any)}</th>
            <th className="pb-3 font-medium">{t('agent.emails.col.actions' as any)}</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => {
            const isCountingDown = email.id in countdowns;
            const remaining = countdowns[email.id] || 0;
            const progress = isCountingDown ? ((COUNTDOWN_SECONDS - remaining) / COUNTDOWN_SECONDS) * 100 : 0;

            return (
              <tr key={email.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors relative">
                {/* Countdown progress bar overlay */}
                {isCountingDown && (
                  <td colSpan={5} className="absolute inset-0 pointer-events-none">
                    <div
                      className="h-full bg-green-500/10 transition-all duration-1000 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </td>
                )}
                <td className="py-3 pr-4 relative">
                  <div>
                    <span className="text-foreground">{email.lead_contact_name || email.lead_company_name || '-'}</span>
                    {email.lead_contact_email && (
                      <span className="block text-xs text-muted-foreground">{email.lead_contact_email}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 max-w-[200px] relative">
                  <span className="text-foreground truncate block">{email.subject}</span>
                </td>
                <td className="py-3 pr-4 relative">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[email.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                      title={email.error || undefined}
                    >
                      {email.status === 'bounced' ? 'bounced' : email.status === 'blocked' ? 'blocked' : t(`agent.emails.status.${email.status}` as any)}
                    </span>
                    {(email.reply_count || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 text-xs font-medium">
                        <MessageSquare className="w-3 h-3" />
                        {email.reply_count}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground relative">
                  {email.sent_at
                    ? new Date(email.sent_at).toLocaleDateString()
                    : new Date(email.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 relative">
                  <div className="flex items-center gap-1">
                    {isCountingDown ? (
                      <>
                        <span className="text-xs text-green-400 font-mono mr-1">{remaining}s</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelCountdown(email.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Pause"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {email.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startCountdown(email.id)}
                              title={t('agent.emails.approve' as any)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(email)}
                              title={t('agent.emails.edit' as any)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {email.status === 'sent' && (email.reply_count || 0) > 0 && onViewReplies && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewReplies(email)}
                            title="View replies"
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(email)}
                          title={t('agent.emails.preview' as any)}
                          className="text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
