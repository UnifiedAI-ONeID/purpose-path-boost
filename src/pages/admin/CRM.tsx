import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

const getAdminCrm = httpsCallable(functions, 'admin-crm');

export default function CRM() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, newThisWeek: 0, activeDeals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await getAdminCrm();
      const data = result.data as any; // Assuming data is of a certain type

      if (data?.ok) {
        const leadsData = data.leads;
        setContacts(leadsData);
        setStats({
          total: leadsData.length,
          newThisWeek: leadsData.filter(l => 
            new Date(l.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          activeDeals: leadsData.filter(l => l.stage !== 'closed').length
        });
      }
    } catch (error) {
      console.error('Error loading CRM data:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AdminShell><div className="p-6">Loading CRM...</div></AdminShell>;
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">CRM & Contacts</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Week</p>
                <p className="text-2xl font-bold">{stats.newThisWeek}</p>
              </div>
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{stats.activeDeals}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Contact List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Contacts</h2>
            <div className="space-y-4">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                    <div className="flex gap-2 mt-1">
                      {contact.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs bg-accent px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
