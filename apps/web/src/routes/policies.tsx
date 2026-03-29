// apps/web/src/routes/policies.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Mail, CreditCard, Fingerprint, Key, Phone } from 'lucide-react';

export const Route = createFileRoute('/policies')({
  component: PoliciesPage,
});

function PoliciesPage() {
  const queryClient = useQueryClient();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy'],
    queryFn: async () => {
      const res = await client.api.policies.$get();
      if (!res.ok) throw new Error("Failed to fetch policy");
      return await res.json();
    }
  });

  const updatePolicy = useMutation({
    mutationFn: async (updates: any) => {
      const res = await client.api.policies.$post({ json: updates });
      if (!res.ok) throw new Error("Failed to update policy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy'] });
    }
  });

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Loading security profile...</div>;

  const handleToggle = (field: string, checked: boolean) => {
    updatePolicy.mutate({ [field]: checked });
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <header className="space-y-1">
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">DLP Policies</h2>
        <p className="text-muted-foreground text-lg">Define granular rules for data interception and redaction across the organization.</p>
      </header>

      <Card className="rounded-3xl border-border shadow-2xl shadow-black/20 bg-card overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-border p-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-foreground" />
            <CardTitle className="text-2xl font-black tracking-tight">Active Protection Rules</CardTitle>
          </div>
          <CardDescription className="text-base font-medium">
            Toggle which sensitive data patterns the gateway should proactively redact.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <PolicyItem 
              icon={<Mail className="w-5 h-5" />}
              label="Email Addresses"
              description="Identify and mask SMTP-valid email formats."
              checked={policy?.blockEmails}
              onCheckedChange={(c: boolean) => handleToggle('blockEmails', c)}
              loading={updatePolicy.isPending}
            />
            <PolicyItem 
              icon={<Key className="w-5 h-5" />}
              label="API Keys & Secrets"
              description="Detect cloud provider keys (AWS, Stripe, GitHub)."
              checked={policy?.blockApiKeys}
              onCheckedChange={(c: boolean) => handleToggle('blockApiKeys', c)}
              loading={updatePolicy.isPending}
            />
            <PolicyItem 
              icon={<CreditCard className="w-5 h-5" />}
              label="Financial Information"
              description="Redact 16-digit payment card numbers (PANs)."
              checked={policy?.blockCreditCards}
              onCheckedChange={(c: boolean) => handleToggle('blockCreditCards', c)}
              loading={updatePolicy.isPending}
            />
            <PolicyItem 
              icon={<Fingerprint className="w-5 h-5" />}
              label="Identities (SSN)"
              description="Mask US Social Security Numbers and government IDs."
              checked={policy?.blockSSN}
              onCheckedChange={(c: boolean) => handleToggle('blockSSN', c)}
              loading={updatePolicy.isPending}
            />
            <PolicyItem 
              icon={<Phone className="w-5 h-5" />}
              label="Phone Numbers"
              description="Filter international and local telephone patterns."
              checked={policy?.blockPhones}
              onCheckedChange={(c: boolean) => handleToggle('blockPhones', c)}
              loading={updatePolicy.isPending}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="p-6 bg-secondary/20 rounded-2xl border border-border flex items-center gap-4">
        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium italic">
          Changes are applied globally to all Virtual API Keys within 500ms of selection.
        </p>
      </div>
    </div>
  );
}

function PolicyItem({ icon, label, description, checked, onCheckedChange, loading }: any) {
  return (
    <div className="flex items-center justify-between p-8 hover:bg-secondary/20 transition-colors group">
      <div className="flex items-start gap-6">
        <div className="mt-1 p-3 rounded-2xl bg-secondary group-hover:bg-background transition-colors border border-transparent group-hover:border-border group-hover:scale-110 group-hover:rotate-3 duration-200">
          {icon}
        </div>
        <div className="space-y-1">
          <Label className="text-xl font-bold tracking-tight cursor-pointer leading-none">{label}</Label>
          <p className="text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
        disabled={loading}
        className="data-[state=checked]:bg-foreground scale-125"
      />
    </div>
  );
}
