import { Bug, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthHandler } from '@/features/auth/hooks/use-auth-handler';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/shared/hooks';
import { useLanguage } from '@/shared/hooks/use-language';
import { LogoutCard } from '../cards';

export function AboutSection() {
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuthHandler();
  const navigate = useNavigate();
  const version = __APP_VERSION__;
  const { did } = useAuth();

  // Logout logic
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
      toast.success(
        t('settings.profile.logout.success') || 'Successfully logged out',
      );
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error(t('settings.profile.logout.error') || 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const createGitHubIssueURL = () => {
    const owner = 'nuwa-protocol';
    const repo = 'nuwa-client';
    const title = '[Nuwa Client Feedback] PLEASE ENTER TITLE HERE';
    const body = `## Info\n- My DID: ${did}\n- Client Version: ${version}\n\n## Description\n PLEASE DESCRIBE THE ISSUE HERE...`;
    const labels = ['uncategorized'];

    const baseURL = `https://github.com/${owner}/${repo}/issues/new`;
    const params = new URLSearchParams();

    params.append('title', title);
    params.append('body', body);
    params.append('labels', labels.join(','));

    return `${baseURL}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Version Info & Feedback */}
      <div className="rounded-lg border p-6">
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Nuwa Client v{version}</h3>
            <div className="pt-2">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() =>
                  window.open(
                    'https://github.com/nuwa-ai/nuwa-client/releases',
                    '_blank',
                  )
                }
              >
                View Release Notes
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-medium">Feedback</h4>
                <p className="text-xs text-muted-foreground">
                  Have any issues or suggestions? Please let us know!
                </p>
              </div>
              <Link
                to={createGitHubIssueURL()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LogoutCard
        title={t('settings.profile.logout.title') || 'Logout'}
        description={
          t('settings.profile.logout.description') || 'Sign out of your account'
        }
        buttonLabel={t('settings.profile.logout.button') || 'Logout'}
        onClick={handleLogout}
        disabled={isLoggingOut}
        confirmationTitle={
          t('settings.profile.logout.confirmTitle') || 'Confirm Logout'
        }
        confirmationDescription={
          t('settings.profile.logout.confirmDescription') ||
          'Are you sure you want to logout? You will need to sign in again to continue using the application.'
        }
        confirmationButtonLabel={
          t('settings.profile.logout.confirmButton') || 'Logout'
        }
        cancelButtonLabel={t('settings.profile.logout.cancel') || 'Cancel'}
      />
    </div>
  );
}
