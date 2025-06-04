import React, { useState, useEffect, KeyboardEvent, useRef } from "react";
import { cn } from "../lib/utils";
import { TagOption } from "../../../types";

interface MentionsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onMention?: (user: TagOption) => void;
  symbol: string;
  closingSymbol?: string;
  placeholder?: string;
  items: TagOption[];
  setInputValue: (value: string) => void;
  value: string;
}

const Input = React.forwardRef<HTMLInputElement, MentionsInputProps>(
  (
    {
      className,
      type,
      onMention,
      placeholder,
      onChange,
      items,
      symbol,
      closingSymbol,
      setInputValue,
      value,
      ...props
    },
    ref
  ) => {
    const inputValue = value;
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredItems, setFilteredItems] = useState<TagOption[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [filteredItems]);

    const inputRef = useRef<HTMLInputElement>();

    const setRef = (element: HTMLInputElement): void => {
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
      inputRef.current = element;
    };

    const suggestionsRef = useRef<HTMLDivElement>(null);

    const scrollSelectedItemIntoView = (index: number): void => {
      if (!suggestionsRef.current) return;

      const suggestionItems = suggestionsRef.current.children;
      if (suggestionItems[index]) {
        const selectedItem = suggestionItems[index] as HTMLDivElement;
        const container = suggestionsRef.current;

        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elementTop = selectedItem.offsetTop;
        const elementBottom = elementTop + selectedItem.offsetHeight;

        if (elementBottom > containerBottom) {
          container.scrollTop = elementBottom - container.clientHeight;
        } else if (elementTop < containerTop) {
          container.scrollTop = elementTop;
        }
      }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setInputValue(value);
      onChange?.(e);

      const cursorPos = e.target.selectionStart || 0;
      setCursorPosition(cursorPos);

      const lastAtSymbol = value.lastIndexOf(symbol, cursorPos);
      if (lastAtSymbol !== -1) {
        const searchTerm = value.slice(lastAtSymbol + 1, cursorPos).toLowerCase();
        const filtered = items.filter(
          (item) =>
            item.label.toLowerCase().includes(searchTerm) ||
            item.value.toLowerCase().includes(searchTerm)
        );
        setFilteredItems(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };

    const insertMention = (item: TagOption): void => {
      if (!inputRef.current) return;
      const lastAtSymbol = inputValue.lastIndexOf(symbol, cursorPosition);
      const newValue =
        inputValue.slice(0, lastAtSymbol) +
        `${symbol}${item.value}${closingSymbol ?? ""}` +
        inputValue.slice(cursorPosition);

      setInputValue(newValue);
      setShowSuggestions(false);
      onMention?.(item);
      if (!inputRef.current) return;
      onChange?.(inputRef.current as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
      if (!showSuggestions || filteredItems.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex = prev < filteredItems.length - 1 ? prev + 1 : prev;
            scrollSelectedItemIntoView(newIndex + 1);
            return newIndex;
          });
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : prev;
            scrollSelectedItemIntoView(newIndex - 1);
            return newIndex;
          });
          break;

        case "Enter":
          e.preventDefault();
          insertMention(filteredItems[selectedIndex]);
          break;
        case "Tab":
          e.preventDefault();
          insertMention(filteredItems[selectedIndex]);
          break;
        case "Escape":
          setShowSuggestions(false);
          break;
      }
    };

    return (
      <div className="relative w-full">
        <input
          {...props}
          ref={setRef}
          type={type}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full disabled:bg-muted px-4 py-2 border border-border focus:ring-primary rounded-lg focus:ring-2 bg-transparent outline-none",
            className
          )}
        />

        {showSuggestions && filteredItems.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-[51] left-0 right-0 mt-1 border border-primary bg-background ring-primary rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredItems.map((item, index) => (
              <div
                key={item.value}
                onClick={() => insertMention(item)}
                className={cn(
                  "px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-2",
                  selectedIndex === index && "bg-muted"
                )}
              >
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "MentionsInput";
export default Input;
