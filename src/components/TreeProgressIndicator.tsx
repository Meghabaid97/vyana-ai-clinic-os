import { TreeDeciduous } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
    <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl p-5 border border-green-500/20">
      <div className="flex items-center gap-4">
        {/* Tree Icon with count */}
        <div className="relative">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <TreeDeciduous className="h-7 w-7 text-white" />
          </div>
          {treesComplete > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
              {treesComplete}
            </span>
          )}
        </div>

        {/* Progress info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground">
              🌳 {treesComplete > 0 ? `${treesComplete} Tree${treesComplete > 1 ? 's' : ''} Saved!` : 'Growing Your Forest'}
            </h4>
            <span className="text-sm font-medium text-green-600">
              {paperSaved.toLocaleString()} sheets saved
            </span>
          </div>
          
          <Progress 
            value={progressToNextTree} 
            className="h-3 bg-green-100 dark:bg-green-900/30"
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            {sheetsToNextTree.toLocaleString()} more sheets to save your next tree 🌱
          </p>
        </div>
      </div>
    </div>
  );
};

export default TreeProgressIndicator;