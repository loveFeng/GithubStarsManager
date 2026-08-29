import { Calendar, ExternalLink, Package, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { UpdateService } from '../services/updateService';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export const UpdateNotificationBanner: React.FC = () => {
  const { updateNotification, dismissUpdateNotification, language } = useAppStore(useShallow((state) => ({
    updateNotification: state.updateNotification,
    dismissUpdateNotification: state.dismissUpdateNotification,
    language: state.language,
  })));
  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  if (!updateNotification || updateNotification.dismissed) return null;

  const handleOpenReleaseNotes = () => {
    UpdateService.openDownloadUrl(updateNotification.downloadUrl);
    dismissUpdateNotification();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="border-b border-border bg-muted dark:border-border dark:bg-muted/40" role="status">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center space-x-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20"><Package className="h-4 w-4 text-primary" /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center space-x-2">
                <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{t('发现新版本', 'New Version Available')} v{updateNotification.version}</h4>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground dark:text-muted-foreground"><Calendar className="h-3 w-3 shrink-0" /><span>{formatDate(updateNotification.releaseDate)}</span></div>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground dark:text-muted-foreground">{updateNotification.changelog.slice(0, 2).join(' • ')}{updateNotification.changelog.length > 2 && '...'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('请更新 Docker 镜像后刷新页面。', 'Update your Docker image, then refresh this page.')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center space-x-2">
            <Button type="button" size="sm" variant="outline" onClick={handleOpenReleaseNotes} className="h-8 gap-1.5 px-3 text-xs">
              <ExternalLink className="h-3 w-3" /><span>{t('更新说明', 'Release notes')}</span>
            </Button>
            <Button type="button" size="sm" onClick={handleRefresh} className="h-8 gap-1.5 px-3 text-xs">
              <span>{t('刷新', 'Refresh')}</span>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={dismissUpdateNotification} aria-label={t('关闭', 'Close')} className="h-8 w-8 text-primary"><X className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>{t('关闭', 'Close')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
