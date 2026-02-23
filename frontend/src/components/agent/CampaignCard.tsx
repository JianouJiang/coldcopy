import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useT } from '@/lib/i18n';
import { Users, Mail } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  leads_found: number;
  emails_sent: number;
  created_at: string;
  icp_description: string;
}

interface CampaignCardProps {
  campaign: Campaign;
}

const statusColors: Record<Campaign['status'], string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { t } = useT();
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/agent/campaigns/${campaign.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {campaign.name}
          </CardTitle>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status]}`}
          >
            {t(`agent.campaign.status.${campaign.status}` as any)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {campaign.icp_description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {campaign.leads_found} {t('agent.campaign.leads' as any)}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            {campaign.emails_sent} {t('agent.campaign.emails' as any)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
