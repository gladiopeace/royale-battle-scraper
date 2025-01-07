import PlayerComparison from "@/components/PlayerComparison";

const Index = () => {
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
          
          <div className="w-full max-w-4xl bg-card/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-muted">
            <PlayerComparison />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;