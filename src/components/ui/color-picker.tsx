"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
    color: string | null;
    onChange: (color: string) => void;
    disabled?: boolean;
}

const presetColors = [
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#a855f7", // purple
];

export function ColorPicker({ color, onChange, disabled }: ColorPickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-border"
                    disabled={disabled}
                >
                    <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: color || "#6b7280" }}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-background border-border" align="start">
                <div className="grid grid-cols-6 gap-2">
                    {presetColors.map((presetColor) => (
                        <button
                            key={presetColor}
                            className={cn(
                                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                color === presetColor
                                    ? "border-white ring-2 ring-primary"
                                    : "border-transparent"
                            )}
                            style={{ backgroundColor: presetColor }}
                            onClick={() => {
                                onChange(presetColor);
                                setOpen(false);
                            }}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
