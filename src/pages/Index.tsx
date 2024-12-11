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
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center gap-8">
        <img 
          src="https://assets.stickpng.com/images/58595cd74f6ae202fedf2856.png" 
          alt="Clash Royale Logo" 
          className="w-64 h-auto mb-4"
        />
        <h1 className="text-3xl font-bold">Battle Tracker</h1>
        <Button 
          onClick={handleScrape} 
          disabled={isLoading}
        >
          {isLoading ? "Scraping..." : "Scrape Latest Battles"}
        </Button>
        
        <PlayerComparison />
      </div>
    </div>
  );
};

export default Index;