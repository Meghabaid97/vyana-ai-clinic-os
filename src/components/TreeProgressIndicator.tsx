import { TreeDeciduous } from "lucide-react";

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
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
      {/* Tree Icon */}
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <TreeDeciduous className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        {treesComplete > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
            {treesComplete}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-foreground">
            {treesComplete > 0 ? `${treesComplete} tree${treesComplete > 1 ? 's' : ''} saved` : 'Growing your forest'}
          </span>
          <span className="text-xs text-muted-foreground">
            {sheetsToNextTree.toLocaleString()} sheets to next 🌳
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progressToNextTree, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TreeProgressIndicator;