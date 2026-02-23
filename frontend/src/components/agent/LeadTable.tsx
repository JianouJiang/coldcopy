import { useT } from '@/lib/i18n';

interface Lead {
  id: string;
  company_name: string;
  company_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_title?: string;
  status: 'new' | 'researched' | 'email_found' | 'email_generated' | 'sent' | 'failed';
  source: string;
  created_at: string;
}

interface LeadTableProps {
  leads: Lead[];
}

const statusColors: Record<Lead['status'], string> = {
  new: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  researched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  email_found: 'bg-green-500/20 text-green-400 border-green-500/30',
  email_generated: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  sent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function LeadTable({ leads }: LeadTableProps) {
  const { t } = useT();

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('agent.leads.empty' as any)}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">{t('agent.leads.col.company' as any)}</th>
            <th className="pb-3 pr-4 font-medium">{t('agent.leads.col.contact' as any)}</th>
            <th className="pb-3 pr-4 font-medium">{t('agent.leads.col.email' as any)}</th>
            <th className="pb-3 pr-4 font-medium">{t('agent.leads.col.status' as any)}</th>
            <th className="pb-3 font-medium">{t('agent.leads.col.date' as any)}</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="py-3 pr-4">
                {lead.company_url ? (
                  <a
                    href={lead.company_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {lead.company_name}
                  </a>
                ) : (
                  <span className="text-foreground">{lead.company_name}</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <div>
                  <span className="text-foreground">{lead.contact_name || '-'}</span>
                  {lead.contact_title && (
                    <span className="block text-xs text-muted-foreground">{lead.contact_title}</span>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {lead.contact_email || '-'}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[lead.status]}`}
                >
                  {t(`agent.leads.status.${lead.status}` as any)}
                </span>
              </td>
              <td className="py-3 text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
