"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./AlertDialog";

import { cn } from "../lib/utils";

import { useChanges } from "../hooks/useChanges";
import FirstPage from "./AlbumDialogPages/first";
import SecondPage from "./AlbumDialogPages/search";
import AllAlbums from "./AlbumDialogPages/allAlbums";
import { ChevronsLeft, XIcon } from "lucide-react";
import AlbumSettings from "./AlbumDialogPages/albumSettings";

type Page = {
  id: number;
  title: string;
  description: string;
  content: ReactNode;
};

export default function AlbumDialog(): ReactNode {
  const { albumDialogOpen, closeAlbumDialog, initialDialogPage } = useChanges();

  const [currentPage, setCurrentPage] = useState<number>(initialDialogPage);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setCurrentPage(initialDialogPage);
  }, [initialDialogPage]);
  useEffect(() => {
    return (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const goToNextPage = (num?: number): void => {
    if (currentPage < pages.length && !isAnimating) {
      if (num && num < 1 && num >= pages.length) return;
      setDirection("forward");
      setIsAnimating(true);

      timeoutRef.current = setTimeout(() => {
        if (currentPage === pages.length - 1) return;
        setCurrentPage((prev) => num ?? prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToPreviousPage = (num?: number): void => {
    if (currentPage > 0 && !isAnimating) {
      if (num && num < 0 && num >= pages.length) return;
      setDirection("backward");
      setIsAnimating(true);

      timeoutRef.current = setTimeout(() => {
        if (currentPage === 0) return;
        if (num === 0) {
          setCurrentPage(0);
        } else {
          setCurrentPage((prev) => num ?? prev - 1);
        }
        setIsAnimating(false);
      }, 300);
    }
  };
  const pages: Page[] = [
    {
      id: 0,
      title: "All Albums",
      description: "All your albums in one place",
      content: <AllAlbums goToNextPage={goToNextPage} />,
    },
    {
      id: 1,
      title: "Album Settings",
      description: "Edit album settings",
      content: <AlbumSettings goToPreviousPage={goToPreviousPage} />,
    },
    {
      id: 2,
      title: "New Album",
      description: "Create a new album",
      content: <FirstPage goToNextPage={goToNextPage} />,
    },
    {
      id: 3,
      title: "Search",
      description: "Search for an album",
      content: <SecondPage goToPreviousPage={goToPreviousPage} />,
    },
  ];
  const page = pages[currentPage];
  if (!page) {
    setCurrentPage(0);

    return <></>;
  }
  console.log({ currentPage, initialDialogPage });

  return (
    <AlertDialog open={albumDialogOpen}>
      <AlertDialogContent className="  p-0 max-h-[75%] w-[75%] overflow-auto">
        <div className="flex flex-col">
          <AlertDialogHeader className="flex flex-row  mt-4 px-4 py-2">
            <div className="flex flex-col flex-1">
              {initialDialogPage !== currentPage && (
                <button
                  className="text-primary hover:underline px-0 flex"
                  onClick={() => goToPreviousPage(currentPage === 2 ? 0 : currentPage - 1)}
                >
                  <ChevronsLeft /> Back
                </button>
              )}
              <AlertDialogTitle className="mt-1"> {page.title} </AlertDialogTitle>
              <AlertDialogDescription> {page.description} </AlertDialogDescription>
            </div>

            <div className="ml-auto">
              <button className="hover:bg-hover px-2 py-1 rounded-md" onClick={closeAlbumDialog}>
                <XIcon />
              </button>
            </div>
          </AlertDialogHeader>

          <div
            className={cn(
              "p-6 transition-transform duration-300 ease-in-out",
              isAnimating && direction === "forward" && "animate-slide-out-to-left",
              isAnimating && direction === "backward" && "animate-slide-out-to-right"
            )}
          >
            {page.content}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
