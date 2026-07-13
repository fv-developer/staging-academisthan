import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

export function ImageUpload({ value, onChange, label = 'Cover Image', folder = 'covers' }: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.includes('admin-uploads') ? 'url' : 'upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Only image files allowed', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be under 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from('admin-uploads')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('admin-uploads')
      .getPublicUrl(path);

    onChange(publicUrl);
    setUploading(false);
    toast({ title: 'Image uploaded! ✨' });
  };

  const clearImage = () => {
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <button
          type="button"
          onClick={() => setMode(mode === 'upload' ? 'url' : 'upload')}
          className="text-[10px] text-gold hover:underline font-medium"
        >
          {mode === 'upload' ? 'Paste URL instead' : 'Upload file instead'}
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="relative border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-gold/40 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Uploading...</span>
              </div>
            ) : value ? (
              <div className="relative">
                <img src={value} alt="Preview" className="max-h-32 mx-auto rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground py-2">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Click to upload (max 5MB)</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="rounded-xl text-xs"
          />
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={clearImage} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
