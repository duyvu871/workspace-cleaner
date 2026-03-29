import { FolderSearch } from 'lucide-react'
import type { SystemInfo } from '@shared/types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface HeaderProps {
  systemInfo: SystemInfo | undefined
  isLoading: boolean
}

export function Header({ systemInfo, isLoading }: HeaderProps) {
  return (
    <header className="flex-shrink-0 border-b border-border bg-card shadow-sm z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderSearch className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Workspace Cleaner
            </h1>
            <p className="text-xs text-muted-foreground">
              Scan &amp; delete unused dev folders and Docker data
            </p>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-7 w-32" />
        ) : systemInfo ? (
          <Badge variant="secondary" className="text-xs font-medium">
            {systemInfo.platform} / {systemInfo.arch}
          </Badge>
        ) : null}
      </div>
    </header>
  )
}
