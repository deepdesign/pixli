import { cn } from "@/lib/utils";

import {
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
  type TabGroupProps,
  type TabListProps,
  type TabPanelsProps,
} from "@headlessui/react";
import type { ReactNode } from "react";

type TabsProps = TabGroupProps<"div">;

export const Tabs = ({ children, ...props }: TabsProps) => (
  <TabGroup {...props}>{children}</TabGroup>
);

type TabsTriggerListProps = TabListProps<"div"> & {
  className?: string;
  children: ReactNode;
};

export const TabsTriggerList = ({
  children,
  className,
  ...props
}: TabsTriggerListProps) => (
  <TabList className={cn("retro-tabs", className)} {...props}>
    {children}
  </TabList>
);

type PrimitiveTabProps = React.ComponentProps<typeof Tab>;

interface TabsTriggerProps
  extends Omit<PrimitiveTabProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
}

export const TabsTrigger = ({
  className,
  children,
  ...props
}: TabsTriggerProps) => (
  <Tab
    {...props}
    className={({ selected }: { selected: boolean }) =>
      cn("retro-tab", selected && "retro-tab-active", className)
    }
  >
    {children}
  </Tab>
);

type PrimitiveTabPanelsProps = TabPanelsProps<"div"> & {
  className?: string;
  children: ReactNode;
};

export const TabsPanels = ({
  className,
  children,
  ...props
}: PrimitiveTabPanelsProps) => (
  <TabPanels className={className} {...props}>
    {children}
  </TabPanels>
);

type PrimitiveTabPanelProps = React.ComponentProps<typeof TabPanel>;

interface TabsContentProps
  extends Omit<PrimitiveTabPanelProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
}

export const TabsContent = ({
  className,
  children,
  ...props
}: TabsContentProps) => (
  <TabPanel className={cn("tab-panel", className)} {...props}>
    {children}
  </TabPanel>
);
