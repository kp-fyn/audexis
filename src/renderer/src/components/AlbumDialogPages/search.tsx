import { ReactNode, useState } from "react";
import { AlertDialogHeader, AlertDialogTitle } from "../AlertDialog";
import { ItunesSearchOptions, searchItunes } from "node-itunes-search";
import InfiniteScroll from "react-infinite-scroll-component";
import { ChevronsLeft } from "lucide-react";
import { useChanges } from "../../hooks/useChanges";
import axios from "axios";
export default function SecondPage({ goToPreviousPage }: Props): ReactNode {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [page, setPage] = useState(0);
  const { setAlbumDialogValues } = useChanges();
  const handleSearch = async (): Promise<void> => {
    try {
      const options: ItunesSearchOptions = {
        term: search,
        entity: "album",
        limit: "10",
        offset: (page + 1 * 10).toString(),
      };
      if (!search) return;
      if (hasChanged) {
        setSearchResults([]);
        setHasMore(false);
        setPage(0);
        options.offset = "0";
      } else {
        options.offset = (page * 10).toString();
      }
      const results = await searchItunes({
        ...options,
      });
      if (results.resultCount === 10) setHasMore(true);
      if (hasChanged) {
        setSearchResults(results.results as unknown as SearchResult[]);
      } else {
        setSearchResults((prev) => [...prev, ...results.results] as unknown as SearchResult[]);
      }
      setHasChanged(false);
      setPage((prev) => prev + 1);
    } catch {
      setHasMore(false);
    }
  };

  return (
    <div className="h-full  overflow-auto" id="search">
      <div className="flex flex-col items-start justify-start ">
        <div className="w-full flex">
          <input
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            onKeyDown={(e) => {
              setHasChanged(true);
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="bg-transparent rounded-s  border-l border-y border-border w-full py-2 px-2 outline-none focus:border-primary transition-colors "
            placeholder="Search for an Album.."
          ></input>
          <button
            className={`border-y border-r rounded-e bg-accent text-white   py-2 px-2 ${focused ? "border-primary" : "border-border"}`}
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        <div id="search" className="h-[400px] w-full">
          <InfiniteScroll
            dataLength={searchResults.length}
            next={handleSearch}
            className="flex flex-col gap-4 w-full "
            hasMore={hasMore}
            loader={<h4>Loading...</h4>}
            endMessage={<p>No more results</p>}
            scrollableTarget="search"
          >
            {searchResults.map((result, i) => (
              <div
                key={result.collectionId + i}
                onClick={async () => {
                  const req = await axios.get(changeImageSize(result.artworkUrl100, "640x640"), {
                    responseType: "arraybuffer",
                  });

                  const arrayBuffer = req.data;
                  const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

                  setAlbumDialogValues({
                    album: result.collectionName,
                    albumArtist: result.artistName,
                    attachedPicture: {
                      buffer: Buffer.from(arrayBuffer),
                      mime: blob.type,
                      type: { id: 3 },
                      url: URL.createObjectURL(blob),
                    },
                    copyright: result.copyright,
                    year: result.releaseDate,
                    genre: result.primaryGenreName,
                  });
                  goToPreviousPage();
                }}
                className="flex px-4 gap-2 cursor-pointer hover:bg-accent/10 p-2 rounded w-full select-none"
              >
                <img src={changeImageSize(result.artworkUrl100, "200x200")} className="rounded" />
                <div className="flex flex-col">
                  <p className=" text-foreground font-bold text-lg">{result.collectionName}</p>
                  <p className="text-md text-muted-foreground">{result.artistName}</p>
                  <div className="flex gap-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.releaseDate).getFullYear()}
                    </p>
                    <p className="text-sm text-muted-foreground">{result.primaryGenreName}</p>
                  </div>
                </div>
              </div>
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
}
// regex sucks
function changeImageSize(url: string, newSize: string): string {
  return url.replace(/\/\d+x\d+bb\.jpg$/, `/${newSize}bb.jpg`);
}

interface Props {
  goToPreviousPage: () => void;
}
interface SearchResult {
  amgArtistId: number;
  artistId: number;
  artistName: string;
  artistViewUrl: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionCensoredName: string;
  collectionExplicitness: string;
  collectionId: number;
  collectionName: string;
  collectionPrice: number;
  collectionType: string;
  collectionViewUrl: string;
  copyright: string;
  country: string;
  currency: string;
  primaryGenreName: string;
  releaseDate: string;
  trackCount: number;
  wrapperType: string;
}
