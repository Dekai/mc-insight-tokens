import { Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, ThemeType } from "@/contexts/ThemeContext";

const themes: { value: ThemeType; label: string; icon: string }[] = [
  { value: "mastercard", label: "Mastercard", icon: "💳" },
  { value: "chatgpt", label: "ChatGPT", icon: "🤖" },
];

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value as ThemeType)}>
      <SelectTrigger className="w-[140px] bg-card border-border">
        <Palette className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        {themes.map((t) => (
          <SelectItem key={t.value} value={t.value} className="cursor-pointer">
            <span className="flex items-center gap-2">
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
