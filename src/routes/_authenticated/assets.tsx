import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { StatusBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Input } from "@/components/ui/input";
import { useAssets, useDebounced, useNetworkOverview } from "@/hooks/use-soc-data";
import type { Asset } from "@/services";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [
      { title: "Asset Management — SentinelOps" },
      { name: "description", content: "Inventory of servers, endpoints, cloud workloads and identities with criticality, risk score and patch status." },
      { property: "og:title", content: "Asset Management — SentinelOps" },
      { property: "og:description", content: "Risk-ranked asset inventory for the monitored estate." },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 250);
  const { data, isLoading, error, refetch } = useAssets(debounced);
  const overview = useNetworkOverview();

  const columns: Column<Asset>[] = [
    { key: "name", header: "Asset", className: "min-w-[240px]", render: (r) => (
      <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.name}</p><p className="mono truncate text-[11px] text-muted-foreground">{r.id} · {r.ip} · {r.os}</p></div>
    ) },
    { key: "type", header: "Type", render: (r) => <Chip tone="neutral">{r.type}</Chip> },
    { key: "crit", header: "Criticality", render: (r) => <Chip tone={r.criticality === "critical" ? "critical" : r.criticality === "high" ? "high" : "neutral"}>{r.criticality}</Chip> },
    { key: "risk", header: "Risk", render: (r) => <span className="mono text-xs">{r.riskScore}</span>, sortable: true, sortValue: (r) => r.riskScore },
    { key: "patch", header: "Patch status", render: (r) => <StatusBadge status={r.patchStatus} /> },
    { key: "owner", header: "Owner", render: (r) => <span className="text-xs text-muted-foreground">{r.source === "sensor" ? "Observed" : r.owner}</span> },
    { key: "alerts", header: "Alerts", render: (r) => <span className="mono text-xs">{r.alertIds.length}</span> },
    { key: "seen", header: "Last seen", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.lastSeen)}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Attack surface" title="Asset Management" description="Risk-ranked inventory of monitored servers, endpoints, cloud workloads and identities." />
      {overview.data && (
        <Panel className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Network sensor status</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {overview.data.sensorCount === 0
                  ? "No sensor is enrolled. Follow the Windows sensor instructions to report real network observations."
                  : `${overview.data.activeSensorCount} of ${overview.data.sensorCount} sensor${overview.data.sensorCount === 1 ? "" : "s"} actively reporting · ${overview.data.devices.length} observed device${overview.data.devices.length === 1 ? "" : "s"}`}
              </p>
              {overview.data.latestSnapshots[0] && (
                <p className="mono mt-2 text-[11px] text-muted-foreground">
                  {overview.data.latestSnapshots[0].connection.state} · SSID {overview.data.latestSnapshots[0].connection.ssid || "unavailable"} · IP {overview.data.latestSnapshots[0].connection.localIp || "unavailable"} · gateway {overview.data.latestSnapshots[0].connection.gateway || "unavailable"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {overview.data.sensors.map((sensor) => (
                <Chip key={sensor.id} tone={sensor.status === "active" ? "success" : sensor.status === "stale" ? "medium" : "neutral"}>
                  <span className={sensor.status === "active" ? "live-dot size-1.5 rounded-full bg-current" : "size-1.5 rounded-full bg-current"} />
                  {sensor.name}: {sensor.status === "active" ? "REPORTING" : sensor.status.toUpperCase()}
                </Chip>
              ))}
            </div>
          </div>
          {overview.data.sensors.some((sensor) => sensor.lastError) && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-medium">
              Collection warning: {overview.data.sensors.find((sensor) => sensor.lastError)?.lastError}
            </p>
          )}
        </Panel>
      )}
      <Panel className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets by name, IP, owner or OS…" className="h-9 pl-8" />
        </div>
      </Panel>
      <DataTable columns={columns} rows={data} rowKey={(r) => r.id} isLoading={isLoading} error={error} onRetry={() => void refetch()} emptyTitle="No assets found" emptyDescription="Adjust the search to locate assets in the inventory." />
    </>
  );
}
