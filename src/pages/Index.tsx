import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold">Clash Royale Battle Tracker</h1>
        <Button 
          onClick={handleScrape} 
          disabled={isLoading}
        >
          {isLoading ? "Scraping..." : "Scrape Latest Battles"}
        </Button>
      </div>
    </div>
  );
};

export default Index;