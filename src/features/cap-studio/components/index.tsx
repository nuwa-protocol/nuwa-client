import { Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useCurrentCap } from '@/shared/hooks';
import type { LocalCap } from '../types';
import { BatchCreate } from './batch-create';
import { DashboardHeader, DashboardLayout } from './layout/dashboard-layout';
import { MyCaps } from './my-caps';

export function CapStudio() {
  const navigate = useNavigate();
  const { setCurrentCap } = useCurrentCap();

  const handleEditCap = (cap: LocalCap) => {
    navigate(`/cap-studio/edit/${cap.id}`);
  };

  const handleTestCap = (cap: LocalCap) => {
    // Set this cap as the current cap for testing
    setCurrentCap(cap.capData);
    navigate(`/chat`);
  };

  const handleSubmitCap = (cap: LocalCap) => {
    navigate(`/cap-studio/submit/${cap.id}`);
  };

  const handleCreateNew = () => {
    navigate('/cap-studio/create');
  };

  const handleGoToMcpDebug = () => {
    navigate('/cap-studio/mcp');
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Cap Studio"
        description="Create, test, and publish powerful AI capabilities with integrated MCP tools"
        actions={
          <Button onClick={handleGoToMcpDebug} variant="outline" size="sm">
            <Bug className="mr-1" /> MCP Tools
          </Button>
        }
      />

      <MyCaps
        onEditCap={handleEditCap}
        onTestCap={handleTestCap}
        onSubmitCap={handleSubmitCap}
        onCreateNew={handleCreateNew}
      />
    </DashboardLayout>
  );
}

export { BatchCreate };
