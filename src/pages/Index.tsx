import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import PlayerComparison from "@/components/PlayerComparison";
import { useState } from "react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-clan-battles');
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: `Processed ${data.battlesProcessed} battles`,
      });
      
      console.log("Scraping result:", data);
    } catch (error) {
      console.error("Error scraping battles:", error);
      toast({
        title: "Error",
        description: "Failed to scrape battles. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8">
          <img 
            src="https://supercell.com/images/53c91cc7ddf17d5b6fa13cae4762af1b/main_logo_clashroyale.5e3fbb70__1_.webp" 
            alt="Clash Royale Logo" 
            className="w-80 h-auto mb-4 animate-pulse"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Battle Tracker
          </h1>
          <Button 
            onClick={handleScrape} 
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? "Scraping..." : "Scrape Latest Battles"}
          </Button>
          
          <div className="w-full max-w-4xl bg-card/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-muted">
            <PlayerComparison />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;