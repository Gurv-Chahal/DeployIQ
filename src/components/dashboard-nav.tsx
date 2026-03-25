"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function DashboardNav({
    userName,
    userEmail,
}: {
    userName: string;
    userEmail: string;
}) {
    return (
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm font-medium text-stone-900">{userName}</p>
                <p className="text-xs text-stone-500">{userEmail}</p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-stone-500 hover:text-stone-700"
            >
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
    );
}
