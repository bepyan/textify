import { Info } from 'lucide-react';

import { Button } from '~/components/ui/base-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/base-tooltip';

export default function BaseTooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>
          <Info className="h-4 w-4" />
          Default tooltip
        </TooltipTrigger>
        <TooltipContent>
          <p>Get detailed information about this feature.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
