import { LANGUAGES, useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LanguageSelector = () => {
  const { lang, changeLanguage } = useLanguage();

  return (
    <Select value={lang} onValueChange={(v) => changeLanguage(v as any)}>
      <SelectTrigger className="w-auto gap-1.5 h-9 px-2.5 border-border/50 bg-background/50">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.nativeLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
