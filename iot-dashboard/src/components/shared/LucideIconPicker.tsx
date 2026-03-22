import { useMemo, useState } from "react";
import { createElement } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getFeatureLucideIcon } from "@/lib/featureLucideIcon";
import { FEATURE_MODULE_STRINGS, UI_STRINGS } from "@/constants/strings";

type IconRecord = Record<string, unknown>;

interface LucideIconPickerProps {
    value: string; // lucide icon export name, or "" for none
    onChange: (next: string) => void;
    disabled?: boolean;
}

const ICON_NONE_VALUE = "";

function getAllLucideIconNames(): string[] {
    const record = Icons as unknown as IconRecord;
    return Object.keys(record).filter((k) => typeof record[k] === "function");
}

export default function LucideIconPicker({
    value,
    onChange,
    disabled,
}: LucideIconPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const iconNames = useMemo(() => getAllLucideIconNames(), []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return iconNames.slice(0, 250);
        return iconNames
            .filter((name) => name.toLowerCase().includes(q))
            .slice(0, 250);
    }, [iconNames, query]);

    const selectedIcon: LucideIcon = getFeatureLucideIcon(value || null);

    const handlePick = (next: string): void => {
        onChange(next);
        setOpen(false);
        setQuery("");
    };

    const currentIconName = value || UI_STRINGS.N_A;

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start gap-3 dark:border-border",
                            !value && "text-muted-foreground",
                        )}
                    >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-muted/30 dark:border-border dark:bg-muted/30">
                            {createElement(selectedIcon, {
                                className: "h-4 w-4 text-foreground dark:text-foreground",
                            })}
                        </span>
                        <span className="truncate text-sm">{currentIconName}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[520px] p-0"
                    align="start"
                    sideOffset={8}
                >
                    <Command>
                        <CommandInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder={FEATURE_MODULE_STRINGS.ICON_SEARCH_PLACEHOLDER}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {FEATURE_MODULE_STRINGS.ICON_PICKER_EMPTY}
                            </CommandEmpty>
                            <CommandGroup heading={FEATURE_MODULE_STRINGS.ICON_PICKER_GROUP}>
                                <CommandItem
                                    key={ICON_NONE_VALUE}
                                    value={UI_STRINGS.N_A}
                                    onSelect={() => handlePick(ICON_NONE_VALUE)}
                                    className="justify-between"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-muted-foreground">
                                            {UI_STRINGS.N_A}
                                        </span>
                                    </span>
                                    {value === ICON_NONE_VALUE ? <Check className="h-4 w-4" /> : null}
                                </CommandItem>
                                {filtered.map((name) => {
                                    const Icon = getFeatureLucideIcon(name);
                                    return (
                                        <CommandItem
                                            key={name}
                                            value={name}
                                            onSelect={() => handlePick(name)}
                                            className="justify-between"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-muted/30 dark:border-border dark:bg-muted/30">
                                                    {createElement(Icon, {
                                                        className: "h-4 w-4 text-foreground dark:text-foreground",
                                                    })}
                                                </span>
                                                <span className="truncate text-sm">{name}</span>
                                            </span>
                                            {value === name ? <Check className="h-4 w-4" /> : null}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

