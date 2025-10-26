import { useState } from "react";
import { Upload, Leaf, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AnalysisResult from "@/components/AnalysisResult";
import AnalysisHistory from "@/components/AnalysisHistory";

type PlantType = 'tomato' | 'potato' | 'pepper_bell';

interface AnalysisData {
  id: string;
  disease_name: string;
  severity_percentage: number;
  confidence_score: number;
  recommendations: string;
  plant_type: PlantType;
}

const Index = () => {
  const [selectedPlant, setSelectedPlant] = useState<PlantType>('tomato');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload a leaf image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-plant-disease', {
        body: {
          imageBase64: selectedImage,
          plantType: selectedPlant,
        },
      });

      if (error) throw error;

      setAnalysisResult(data);
      setRefreshHistory(prev => prev + 1);
      
      toast({
        title: "Analysis complete",
        description: `Disease detected: ${data.disease_name}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze the image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Plant Disease Detection
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered disease detection for Tomato, Potato, and Pepper Bell plants with severity assessment
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Upload Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Upload & Analyze
              </h2>
              
              {/* Plant Type Selection */}
              <div className="mb-6">
                <Label className="text-base mb-3 block">Select Plant Type</Label>
                <RadioGroup value={selectedPlant} onValueChange={(value) => setSelectedPlant(value as PlantType)}>
                  <div className="grid grid-cols-3 gap-4">
                    <label className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlant === 'tomato' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}>
                      <RadioGroupItem value="tomato" id="tomato" />
                      <span className="font-medium">🍅 Tomato</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlant === 'potato' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}>
                      <RadioGroupItem value="potato" id="potato" />
                      <span className="font-medium">🥔 Potato</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlant === 'pepper_bell' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}>
                      <RadioGroupItem value="pepper_bell" id="pepper_bell" />
                      <span className="font-medium">🌶️ Pepper</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label htmlFor="image-upload" className="text-base">Upload Leaf Image</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Selected leaf" className="max-h-64 mx-auto rounded-lg" />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing}
                className="w-full text-lg py-6"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Analyze Disease
                  </>
                )}
              </Button>
            </div>

            {/* Info Alert */}
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Upload a clear image of the plant leaf for accurate disease detection and severity assessment.
              </p>
            </div>
          </Card>

          {/* Results Section */}
          <div>
            {analysisResult ? (
              <AnalysisResult result={analysisResult} />
            ) : (
              <Card className="p-6 h-full flex items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground">
                  <Leaf className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Analysis results will appear here</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* History Section */}
        <AnalysisHistory key={refreshHistory} />
      </div>
    </div>
  );
};

export default Index;
