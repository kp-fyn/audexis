"use client";
import ImageSVG from "@/components/ImageSVG";
import RenamingSVG from "@/components/RenamingSVG";
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";

export default function Features() {
  const { theme } = useTheme();
  const features = getFeatures();
  return (
    <section className="px-4 xl:px-24 py-16 bg-linear-to-t  from-background to-primary/20 rounded-lg mt-24">
      <div className="">
        <div className="mb-12">
          <h2 className="text-4xl md:text-4xl text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-2xl ">
            Powerful features designed to make audio metadata editing fast,
            efficient, and enjoyable.
          </p>
        </div>
        <div className="flex flex-col gap-12">
          {features.map((feature, index) => (
            <Feature
              key={index}
              index={index}
              theme={theme}
              title={feature.title}
              description={feature.description}
              img={feature.img}
              ext={feature.ext}
              SVG={feature.SVG}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({
  theme,
  title,
  description,
  img,
  index,
  ext,
  SVG,
}: FeatureProps) {
  const flexDirection = index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row";
  console.log(SVG);
  return (
    <div className=" px-4  py-12 flex flex-col rounded   lg:px-">
      <div className={`flex flex-col ${flexDirection} gap-12 lg:gap-24`}>
        <div className=" flex flex-col w-full  lg:w-3/4 lg:px-12 gap-4  md:mt-12">
          <div className="rounded-full     p-3 w-fit">
            <SVG className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-3xl font-semibold text-foreground ">{title}</h3>
          <p className="text-md text-muted-foreground  ">{description}</p>
        </div>
        <div className=" flex aspect-video  justify-center w-full  mb-8 md:mb-0">
          <Image
            width={1200}
            height={800}
            src={`${img}-${theme}${ext}`}
            alt="Multi Image aspect-video Editing Support in Audexis"
            className="rounded-lg border border-border shadow-xl "
          />
        </div>
      </div>
    </div>
  );
}

type FeatureProps = {
  title: string;
  description: string;
  img: string;
  ext: string;
  index: number;
  theme: "light" | "dark";
  SVG: any;
};
type PartialFeatureProps = Omit<FeatureProps, "index" | "theme">;
function getFeatures(): PartialFeatureProps[] {
  return [
    {
      title: " Multi Image Editing Support",
      description: `Audexis lets you view, add, replace, and remove multiple embedded
            images within a single audio file—not just the main album cover.
            Many formats support secondary artwork like back covers, disc
            images, logos, and booklets, and Audexis gives you full control over
            all of them. Whether you're managing high-resolution album art or
            cleaning up unnecessary images, you can easily organize and edit
            every artwork entry in one place.`,
      img: "/image-editing",
      ext: ".png",
      SVG: ImageSVG,
    },
    {
      title: "Pattern-Based Renaming",
      description: `Audexis includes a powerful renaming system that lets you automatically
        rename files using customizable patterns built from any metadata tag. You can combine
        fields like artist, album, track number, title, year, or even custom tags to create 
        consistent naming formats that match your library’s organization style. Audexis
        generates clean, predictable filenames with a single click, perfect for keeping
        large collections neat and searchable.`,
      img: "/renaming",
      ext: ".png",
      SVG: RenamingSVG,
    },
  ];
}
