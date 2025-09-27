import { Separator } from '@fe/components/ui/base-separator';

export default function SeparatorDemo() {
  return (
    <div className="text-foreground">
      <div className="space-y-1">
        <h4 className="text-sm leading-none font-medium">ReUI</h4>
        <p className="text-muted-foreground text-sm">
          A free ReUI UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <a
          href="https://reui.io"
          className="hover:text-primary hover:underline hover:underline-offset-2"
        >
          ReUI
        </a>
        <Separator orientation="vertical" />
        <a
          href="https://reui.io/docs"
          className="hover:text-primary hover:underline hover:underline-offset-2"
        >
          Docs
        </a>
        <Separator orientation="vertical" />
        <a
          href="https://github.com/keenthemes/reui"
          className="hover:text-primary hover:underline hover:underline-offset-2"
        >
          Source
        </a>
      </div>
    </div>
  );
}
