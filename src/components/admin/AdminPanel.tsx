import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Newspaper, Calendar, Users, Shield, BarChart3, GraduationCap, Building2, Bot, FileCheck2, Mail } from 'lucide-react';
import { BlogManager } from './BlogManager';
import { NewsManager } from './NewsManager';
import { UserManager } from './UserManager';
import { EventManager } from './EventManager';
import { ProgramManager } from './ProgramManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { InstitutionManager } from './InstitutionManager';
import { AutomationDashboard } from './AutomationDashboard';
import { PendingBlogsQueue } from './PendingBlogsQueue';
import { EmailChangeRequestsManager } from './EmailChangeRequestsManager';
import { ConnectionsManager } from './ConnectionsManager';

export function AdminPanel() {
  const { role, isAdmin, isSuperAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Checking permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="bg-card border border-gold/20 rounded-2xl p-4 md:p-6 lg:p-8 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="font-serif text-lg md:text-xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">
            {isSuperAdmin ? 'Super Admin' : 'Admin'} · Manage content & users
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-xl p-1 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="analytics" className="rounded-lg gap-1.5 text-xs">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="blogs" className="rounded-lg gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Blogs
          </TabsTrigger>
          <TabsTrigger value="news" className="rounded-lg gap-1.5 text-xs">
            <Newspaper className="w-3.5 h-3.5" /> News
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" /> Events
          </TabsTrigger>
          <TabsTrigger value="programs" className="rounded-lg gap-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5" /> Programs
          </TabsTrigger>
          <TabsTrigger value="institutions" className="rounded-lg gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" /> Institutions
          </TabsTrigger>
          <TabsTrigger value="automation" className="rounded-lg gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> Automation
          </TabsTrigger>
          <TabsTrigger value="pending-blogs" data-tab="pending-blogs" className="rounded-lg gap-1.5 text-xs">
            <FileCheck2 className="w-3.5 h-3.5" /> AI Drafts
          </TabsTrigger>
          <TabsTrigger value="email-requests" className="rounded-lg gap-1.5 text-xs">
            <Mail className="w-3.5 h-3.5" /> Email Requests
          </TabsTrigger>
          <TabsTrigger value="connections" className="rounded-lg gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" /> Connections
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="users" className="rounded-lg gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="blogs">
          <BlogManager />
        </TabsContent>

        <TabsContent value="news">
          <NewsManager />
        </TabsContent>

        <TabsContent value="events">
          <EventManager />
        </TabsContent>

        <TabsContent value="programs">
          <ProgramManager />
        </TabsContent>

        <TabsContent value="institutions">
          <InstitutionManager />
        </TabsContent>

        <TabsContent value="automation">
          <AutomationDashboard />
        </TabsContent>

        <TabsContent value="pending-blogs">
          <PendingBlogsQueue />
        </TabsContent>

        <TabsContent value="email-requests">
          <EmailChangeRequestsManager />
        </TabsContent>
        <TabsContent value="connections">
          <ConnectionsManager />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="users">
            <UserManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
