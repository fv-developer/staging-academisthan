import { useAuth } from '@/contexts/AuthContext';
import { tools } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

type SaveParams = {
  toolType: string;
  toolName: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  score: number | null;
};

export function useToolResultSaver() {
  const { user } = useAuth();
  const { toast } = useToast();

  const saveResult = async (params: SaveParams) => {
    if (!user) return; // silently skip for unauthenticated users

    try {
      await tools.saveResult({
        tool_name: params.toolName,
        tool_type: params.toolType,
        input_data: params.inputData,
        result_data: params.resultData,
        score: params.score !== null ? params.score : undefined,
      });

      toast({
        title: '✓ Result saved',
        description: 'Your score has been saved to your progress history.',
        duration: 2000,
      });
    } catch (e: any) {
      console.error('Error saving tool result:', e);
      toast({
        title: 'Failed to save result',
        description: e.message || 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return { saveResult, isAuthenticated: !!user };
}
