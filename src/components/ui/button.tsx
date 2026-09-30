import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-xs",
        outline:
          "border-primary/40 bg-transparent text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted/60 hover:text-foreground",
        destructive:
          "bg-destructive/20 text-destructive-foreground hover:bg-destructive/30 border border-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 min-h-[40px] px-4 py-2 gap-2 text-sm",
        xs: "h-7 min-h-[28px] px-2.5 text-xs gap-1",
        sm: "h-9 min-h-[36px] px-3.5 text-xs gap-1.5",
        lg: "h-12 min-h-[48px] px-6 text-sm font-semibold tracking-wider uppercase gap-2.5",
        icon: "size-10 min-h-[40px]",
        "icon-xs": "size-7 min-h-[28px]",
        "icon-sm": "size-9 min-h-[36px]",
        "icon-lg": "size-12 min-h-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
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
