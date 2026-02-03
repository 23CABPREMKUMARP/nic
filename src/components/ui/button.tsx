import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'outline' | 'ghost';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', ...props }, ref) => {
    const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 active:scale-95 flex items-center gap-2 justify-center shadow-lg";
    const variants = {
        primary: "bg-[#0f3b28] text-white hover:bg-[#1a5c40] border border-[#2d6a4f] shadow-green-900/30",
        secondary: "bg-white text-[#0f3b28] hover:bg-gray-100",
        glass: "backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 shadow-white/5",
        danger: "bg-red-600 text-white hover:bg-red-700 border border-red-500",
        outline: "bg-transparent border-2 border-green-600 text-green-700 hover:bg-green-50 shadow-none",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 shadow-none hover:shadow-sm border border-transparent"
    };

    return (
        <button
            ref={ref}
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button };
