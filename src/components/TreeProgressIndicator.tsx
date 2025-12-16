import { TreeDeciduous, Leaf, Sparkles } from "lucide-react";

interface TreeProgressIndicatorProps {
  consultations: number;
}

const TreeProgressIndicator = ({ consultations }: TreeProgressIndicatorProps) => {
  const paperSaved = consultations * 5;
  const sheetsPerTree = 8000;
  const treesComplete = Math.floor(paperSaved / sheetsPerTree);
  const progressToNextTree = ((paperSaved % sheetsPerTree) / sheetsPerTree) * 100;
  const sheetsToNextTree = sheetsPerTree - (paperSaved % sheetsPerTree);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/20 p-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <TreeDeciduous className="h-6 w-6 text-white" />
              </div>
              {treesComplete > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md animate-pulse">
                  {treesComplete}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                {treesComplete > 0 ? (
                  <>
                    <span>{treesComplete} Tree{treesComplete > 1 ? 's' : ''} Saved!</span>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </>
                ) : (
                  'Growing Your Forest'
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                You're saving the planet! 🌍
              </p>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold text-emerald-600">{paperSaved.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">sheets saved</p>
          </div>
        </div>

        {/* Progress section */}
        <div className="bg-background/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">Progress to next tree</span>
            </div>
            <span className="text-sm font-semibold text-emerald-600">
              {Math.round(progressToNextTree)}%
            </span>
          </div>
          
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-full transition-all duration-700 relative"
              style={{ width: `${Math.max(progressToNextTree, 3)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {sheetsToNextTree.toLocaleString()} more sheets to plant your next tree 🌳
          </p>
        </div>
      </div>
    </div>
  );
};

export default TreeProgressIndicator;