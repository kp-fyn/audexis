import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";
import { Button } from "./components/button";
import { Switch } from "./components/switch";
import { Label } from "./components/label";
import { Separator } from "./components/separator";
import { RadioGroup, RadioGroupItem } from "./components/radio-group";
import { Moon, Sun, Layout, Eye } from "lucide-react";
import { useUserConfig } from "./hooks/useUserConfig";

export default function Settings(): JSX.Element {
  const { config, setTheme, setView } = useUserConfig();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mt-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className=" flex gap-5 mt-8">
          <TabsTrigger value="view" className="flex items-center gap-2 pr-3 ">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View</span>
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2 pr-3 ">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Editor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>View Settings</CardTitle>
              <CardDescription>
                Customize how content is displayed in the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Color Theme</h3>
                <RadioGroup
                  value={config.theme}
                  onValueChange={(value) => {
                    setTheme(value as "dark" | "light");
                    window.app.updateConfig({ theme: value as "dark" | "light" });
                  }}
                  className="grid grid-cols-4 gap-4"
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      Light
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      Dark
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Layout Density</h3>
                  <RadioGroup
                    value={config.view}
                    onValueChange={(value) => {
                      setView(value as "simple" | "folder");
                    }}
                    className="grid grid-cols-3 gap-4 items-center "
                  >
                    <div>
                      <RadioGroupItem value="simple" id="simple" className="peer sr-only" />
                      <Label
                        htmlFor="simple"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Layout className="mb-3 h-6 w-6" />
                        Simple
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="folder" id="folder" className="peer sr-only" />
                      <Label
                        htmlFor="folder"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Layout className="mb-3 h-6 w-6" />
                        Folder
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch id="auto-save" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch id="high-contrast" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
