import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-text",
        secondary:
          "bg-surface text-text-primary border border-border hover:bg-[#F4F4F5]",
        danger:
          "bg-surface text-danger border border-[#FEE2E2] hover:bg-[#FEF2F2]",
        ghost:
          "bg-transparent text-text-secondary hover:bg-[#F4F4F5] hover:text-text-primary",
      },
      size: {
        md: "px-5 py-2.5 text-[14px] gap-1.5",
        sm: "px-3 py-1.5 text-[13px] gap-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
