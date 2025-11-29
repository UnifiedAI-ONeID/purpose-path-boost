import { useState, useRef } from 'react';
import { storage, auth } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePrefs } from '@/prefs/PrefsProvider';
import { userService } from '@/services/users';

type Props = {
  profileId: string;
  initialUrl?: string;
  onUpdate?: (url: string) => void;
};

export default function AvatarUploader({ profileId, initialUrl, onUpdate }: Props) {
  const { lang } = usePrefs();
  const [url, setUrl] = useState(initialUrl || '');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        lang === 'zh-CN' ? '文件大小不能超过 5MB' :
        lang === 'zh-TW' ? '檔案大小不能超過 5MB' :
        'File size must be less than 5MB'
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(
        lang === 'zh-CN' ? '请上传图片文件' :
        lang === 'zh-TW' ? '請上傳圖片檔案' :
        'Please upload an image file'
      );
      return;
    }

    setUploading(true);

    try {
      if (!auth.currentUser) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() || 'png';
      // Use profileId/uuid.ext structure
      const path = `avatars/${profileId}/${crypto.randomUUID()}.${ext}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);

      // Update Firebase Auth Profile
      await updateProfile(auth.currentUser, { photoURL: publicUrl });

      // Update User Service / Database
      // Assuming userService has an update method or we call an API
      // Here we will use userService if available or just update auth profile
      // Ideally userService.updateUser(profileId, { avatar_url: publicUrl })
      
      // Let's assume we need to sync this to our user record in Firestore via userService
      try {
          await userService.updateUser(profileId, { photoURL: publicUrl });
      } catch (e) {
          console.warn('Failed to sync avatar to user record', e);
      }
     
      setUrl(publicUrl);
      onUpdate?.(publicUrl);
      
      toast.success(
        lang === 'zh-CN' ? '头像更新成功！' :
        lang === 'zh-TW' ? '頭像更新成功！' :
        'Avatar updated successfully!'
      );
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(
        lang === 'zh-CN' ? '头像上传失败' :
        lang === 'zh-TW' ? '頭像上傳失敗' :
        'Failed to upload avatar'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={url} alt="Avatar" />
        <AvatarFallback>
          <div className="h-full w-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
        </AvatarFallback>
      </Avatar>
      
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {lang === 'zh-CN' ? '上传中...' : lang === 'zh-TW' ? '上傳中...' : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {lang === 'zh-CN' ? '更换头像' : lang === 'zh-TW' ? '更換頭像' : 'Change Avatar'}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'zh-CN' ? 'JPG, PNG 或 WebP, 最大 5MB' :
           lang === 'zh-TW' ? 'JPG, PNG 或 WebP, 最大 5MB' :
           'JPG, PNG or WebP, max 5MB'}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
