import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackHeaderProps {
  title?: string;
  to?: string;
  rightSlot?: React.ReactNode;
}

const BackHeader = ({ title, to, rightSlot }: BackHeaderProps) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (to) navigate(to);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/app");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border safe-area-top">
      <div className="px-4 sm:px-5 h-12 sm:h-14 flex items-center gap-2">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="flex-1 truncate text-base font-semibold text-foreground">{title}</h1>
        )}
        {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
      </div>
    </header>
  );
};

export default BackHeader;
