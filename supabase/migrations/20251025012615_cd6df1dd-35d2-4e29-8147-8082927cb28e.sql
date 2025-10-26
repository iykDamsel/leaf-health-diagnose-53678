-- Create plant disease analysis table
CREATE TABLE IF NOT EXISTS public.disease_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_type TEXT NOT NULL CHECK (plant_type IN ('tomato', 'potato', 'pepper_bell')),
  disease_name TEXT NOT NULL,
  severity_percentage INTEGER NOT NULL CHECK (severity_percentage >= 0 AND severity_percentage <= 100),
  confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  image_url TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disease_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read analyses (public app)
CREATE POLICY "Anyone can view disease analyses" 
ON public.disease_analyses 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert analyses
CREATE POLICY "Anyone can create disease analyses" 
ON public.disease_analyses 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_disease_analyses_created_at ON public.disease_analyses(created_at DESC);
CREATE INDEX idx_disease_analyses_plant_type ON public.disease_analyses(plant_type);