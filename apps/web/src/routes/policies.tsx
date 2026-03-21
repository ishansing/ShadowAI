// apps/web/src/routes/policies.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading policies...</div>;

  const handleToggle = (field: string, checked: boolean) => {
    updatePolicy.mutate({ [field]: checked });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">DLP Policies</h2>
        <p className="text-gray-500 mt-1">Configure what sensitive data gets redacted before reaching AI providers.</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Data Types</CardTitle>
          <CardDescription>
            Toggle which data types should be blocked in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold cursor-pointer" htmlFor="block-emails">Email Addresses</Label>
              <p className="text-sm text-gray-500">Block addresses like john@company.com</p>
            </div>
            <Switch 
              id="block-emails"
              checked={policy?.blockEmails} 
              onCheckedChange={(c) => handleToggle('blockEmails', c)} 
              disabled={updatePolicy.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold cursor-pointer" htmlFor="block-api-keys">API Keys & Secrets</Label>
              <p className="text-sm text-gray-500">Block AWS, Stripe, GitHub, and OpenAI keys</p>
            </div>
            <Switch 
              id="block-api-keys"
              checked={policy?.blockApiKeys} 
              onCheckedChange={(c) => handleToggle('blockApiKeys', c)} 
              disabled={updatePolicy.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold cursor-pointer" htmlFor="block-credit-cards">Credit Card Numbers</Label>
              <p className="text-sm text-gray-500">Block 16-digit PANs and similar patterns</p>
            </div>
            <Switch 
              id="block-credit-cards"
              checked={policy?.blockCreditCards} 
              onCheckedChange={(c) => handleToggle('blockCreditCards', c)} 
              disabled={updatePolicy.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold cursor-pointer" htmlFor="block-ssn">Social Security Numbers</Label>
              <p className="text-sm text-gray-500">Block standard US SSN formats (XXX-XX-XXXX)</p>
            </div>
            <Switch 
              id="block-ssn"
              checked={policy?.blockSSN} 
              onCheckedChange={(c) => handleToggle('blockSSN', c)} 
              disabled={updatePolicy.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold cursor-pointer" htmlFor="block-phones">Phone Numbers</Label>
              <p className="text-sm text-gray-500">Block standard phone number formats</p>
            </div>
            <Switch 
              id="block-phones"
              checked={policy?.blockPhones} 
              onCheckedChange={(c) => handleToggle('blockPhones', c)} 
              disabled={updatePolicy.isPending}
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
