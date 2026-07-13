import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
      const { error } = await supabase.from('tool_results').insert([{
        user_id: user.id,
        tool_type: params.toolType,
        tool_name: params.toolName,
        input_data: params.inputData as any,
        result_data: params.resultData as any,
        score: params.score,
      }]);

      if (error) {
        console.error('Failed to save tool result:', error);
      } else {
        toast({
          title: '✓ Result saved',
          description: 'Your score has been saved to your progress history.',
          duration: 2000,
        });
      }
    } catch (e) {
      console.error('Error saving tool result:', e);
    }
  };

  return { saveResult, isAuthenticated: !!user };
}
