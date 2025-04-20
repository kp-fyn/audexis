import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/button";
import { useUserConfig } from "./hooks/useUserConfig";
import { Moon, Sun, Grid, Files, ArrowRight, Check } from "lucide-react";
type ThemeType = "light" | "dark";
type ViewType = "simple" | "folder";
export default function Onboarding(): ReactNode {
  const { setTheme, config, setView } = useUserConfig();

  const [step, setStep] = useState(0);

  const selectTheme = (theme: ThemeType): void => {
    setTheme(theme);
  };
  const handleComplete = (): void => {
    window.app.updateConfig({
      theme: config.theme,
      onboarding: false,
      view: config.view,
    });
    window.app.closeOnboarding();
    window.close();
  };

  const selectView = (view: ViewType): void => {
    setView(view);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center ">
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="theme-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl w-full mx-auto p-8"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Welcome to Audexis</h1>
              <p className="text-xl text-muted-foreground">
                Let&apos;s personalize your experience
              </p>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose your theme</h2>
              <p className="text-muted-foreground">
                Select the theme that works best for you. You can change this later in settings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <ThemeOption
                title="Light Mode"
                icon={<Sun className="h-12 w-12" />}
                isSelected={config.theme === "light"}
                onClick={() => selectTheme("light")}
              />

              <ThemeOption
                title="Dark Mode"
                icon={<Moon className="h-12 w-12" />}
                isSelected={config.theme !== "light"}
                onClick={() => selectTheme("dark")}
              />
            </div>

            <div className="flex justify-center">
              <Button size="lg" onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl w-full mx-auto p-8"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Almost Done!</h1>
              <p className="text-xl text-muted-foreground">
                One more step to customize your experience
              </p>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose your view</h2>
              <p className="text-muted-foreground">
                Select how you&apos;d like to view your content. You can change this later in
                settings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <ViewOption
                title="Simple View"
                icon={<Grid className="h-12 w-12" />}
                isSelected={config.view === "simple"}
                onClick={() => selectView("simple")}
                subtitle="A simple and clean view for quick access to your files."
              />

              <ViewOption
                title="File View"
                icon={<Files className="h-12 w-12" />}
                isSelected={config.view === "folder"}
                onClick={() => selectView("folder")}
                subtitle="A detailed view for managing and organizing your files. (Best for managing & organizing albums)"
              />
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" size="lg" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button size="lg" onClick={handleComplete}>
                Get Started
                <Check className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
interface OptionProps {
  title: string;
  icon: ReactNode;
  isSelected: boolean;
  onClick: () => void;
  subtitle?: string;
}

function ThemeOption({ title, icon, isSelected, onClick, subtitle }: OptionProps): ReactNode {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/50"
      }`}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1"
        >
          <Check className="h-5 w-5" />
        </motion.div>
      )}
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-medium mb-4">{title}</h3>
      <div className="w-full rounded-md overflow-hidden shadow-md">
        <span>{subtitle}</span>
      </div>
    </motion.div>
  );
}

function ViewOption({ title, icon, isSelected, onClick, subtitle }: OptionProps): ReactNode {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/50"
      }`}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1"
        >
          <Check className="h-5 w-5" />
        </motion.div>
      )}
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <span className="w-full text-muted-foreground text-sm text-center">{subtitle}</span>
    </motion.div>
  );
}
