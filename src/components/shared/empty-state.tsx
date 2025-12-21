import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Icon
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {description}
              </p>
            )}
          </div>
          {action && (
            <Button onClick={action.onClick} className="mt-2">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
