import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, plantType } = await req.json();
    
    if (!imageBase64 || !plantType) {
      throw new Error('Missing required fields: imageBase64 and plantType');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ${plantType} plant disease...`);

    // Define diseases for each plant type
    const diseaseKnowledge = {
      tomato: ['Early Blight', 'Late Blight', 'Leaf Mold', 'Septoria Leaf Spot', 'Bacterial Spot', 'Target Spot', 'Mosaic Virus', 'Yellow Leaf Curl', 'Healthy'],
      potato: ['Early Blight', 'Late Blight', 'Healthy'],
      pepper_bell: ['Bacterial Spot', 'Healthy']
    };

    const diseases = diseaseKnowledge[plantType as keyof typeof diseaseKnowledge] || [];

    // Call Lovable AI with multimodal input
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural AI specialized in ${plantType} plant disease detection. 
Analyze the leaf image and identify:
1. Disease name (one of: ${diseases.join(', ')})
2. Infection severity percentage (0-100%)
3. Confidence score (0-100%)
4. Brief recommendations for treatment

Respond ONLY with valid JSON in this exact format:
{
  "disease_name": "disease name",
  "severity_percentage": 0-100,
  "confidence_score": 0-100,
  "recommendations": "brief treatment recommendations"
}

Be accurate and scientific in your assessment. If the leaf appears healthy, set severity to 0.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${plantType} leaf for disease detection. Provide severity percentage and treatment recommendations.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI Response:', aiContent);

    // Parse AI response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI analysis result');
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedAnalysis, error: dbError } = await supabase
      .from('disease_analyses')
      .insert({
        plant_type: plantType,
        disease_name: analysisResult.disease_name,
        severity_percentage: analysisResult.severity_percentage,
        confidence_score: analysisResult.confidence_score,
        recommendations: analysisResult.recommendations,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save analysis to database');
    }

    console.log('Analysis saved successfully:', savedAnalysis.id);

    return new Response(
      JSON.stringify({
        ...analysisResult,
        id: savedAnalysis.id,
        plant_type: plantType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-plant-disease function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
