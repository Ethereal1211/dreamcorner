import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';

interface AvatarUploadProps {
  currentUrl: string;
  fallback: React.ReactNode;
  onUploaded: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap: Record<string, string> = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

export function AvatarUpload({
  currentUrl,
  fallback,
  onUploaded,
  size = 'md',
  label,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      const dataloom = await getDataloom();
      const { data, error } = await dataloom
        .storage
        .from(getDefaultBucketId())
        .uploadFile(file);

      if (error || !data) {
        const msg =
          (error as { message?: string })?.message ??
          (error as { error_msg?: string })?.error_msg ??
          '上传失败';
        throw new Error(msg);
      }

      onUploaded(data.download_url);
      toast.success('头像上传成功');
    } catch (err: unknown) {
      logger.error('头像上传失败', err);
      toast.error(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const sizeClass = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shadow-lg shrink-0`}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={label || '头像'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-xl font-bold">{fallback}</span>
          )}
        </div>
        <Button
          size="icon"
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white/20 backdrop-blur border border-white/30 hover:bg-white/30"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label={label ? `上传${label}头像` : '上传头像'}
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : (
            <Camera size={14} className="text-white" />
          )}
        </Button>
        {currentUrl && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500"
            onClick={() => onUploaded('')}
            aria-label="移除头像"
          >
            <X size={12} />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
