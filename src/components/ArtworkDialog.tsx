import { validateImage } from "image-validator";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, ReactNode, Dispatch, SetStateAction } from "react";
import { Image } from "../../electron/electron-env";
export default function ArtworkDialog({ src, setImage, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Track Artwork</DialogTitle>
        </DialogHeader>
        <div className="w-full h-full flex flex-col items-center">
          <img
            onClick={() => {
              inputRef.current?.click();
            }}
            src={src}
            className={"h-40 w-40  rounded-xl"}
          />
          <Input
            ref={inputRef}
            type={"file"}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              console.log(file.type);
              validateImage(file).then((res) => {
                if (!res) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                  const data = e.target?.result;
                  setImage(data as string);
                };
                reader.readAsDataURL(file);
              });
            }}
          ></Input>
        </div>

        <DialogFooter>
          <Button variant="secondary">Cancel</Button>
          <Button
            onClick={() => {
              inputRef.current?.click();
            }}
            className="ml-auto"
          >
            Upload Artwork
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface Props {
  src: string | undefined;
  children: ReactNode;
  setImage: Dispatch<SetStateAction<Image | string | null>>;
}
