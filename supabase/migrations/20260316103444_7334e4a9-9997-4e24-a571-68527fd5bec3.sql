
CREATE TABLE public.tool_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_type TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own results"
  ON public.tool_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own results"
  ON public.tool_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON public.tool_results FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_tool_results_user_type ON public.tool_results(user_id, tool_type, created_at DESC);
