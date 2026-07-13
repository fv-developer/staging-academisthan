import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CKEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CKEditor({ value, onChange, placeholder }: CKEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Dynamic script loader
  useEffect(() => {
    if ((window as any).CKEDITOR) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.ckeditor.com/ckeditor5/39.0.1/super-build/ckeditor.js';
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = (err) => {
      console.error('Failed to load CKEditor 5 super-build script', err);
      setErrorMsg('Failed to load script from CDN');
      setIsFailed(true);
    };
    document.head.appendChild(script);
  }, []);

  // 2. Initialize CKEditor 5 ClassicEditor
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || editorRef.current || isFailed) return;

    const CKEDITOR = (window as any).CKEDITOR;
    if (!CKEDITOR || !CKEDITOR.ClassicEditor) {
      console.error('CKEDITOR namespace is not loaded');
      setErrorMsg('CKEDITOR namespace not found on window');
      setIsFailed(true);
      return;
    }

    // Custom Base64 upload adapter class
    class Base64UploadAdapter {
      loader: any;
      constructor(loader: any) {
        this.loader = loader;
      }
      upload() {
        return this.loader.file.then(
          (file: File) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({ default: reader.result });
              };
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(file);
            })
        );
      }
      abort() {}
    }

    // Upload adapter plugin
    function Base64UploadAdapterPlugin(editor: any) {
      editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new Base64UploadAdapter(loader);
      };
    }

    // Initialize Classic Editor
    CKEDITOR.ClassicEditor.create(containerRef.current, {
      licenseKey: '', 
      removePlugins: [
        'RealTimeCollaborativeComments',
        'RealTimeCollaborativeTrackChanges',
        'RealTimeCollaborativeRevisionHistory',
        'PresenceList',
        'Comments',
        'TrackChanges',
        'TrackChangesData',
        'RevisionHistory',
        'WProofreader',
        'MathType',
        'Pagination',
        'ExportPdf',
        'ExportWord',
        'ImportWord',
        'EasyImage',
        'DocumentOutline',
        'TableOfContents',
        'FormatPainter',
        'Template',
        'SlashCommand',
        'PasteFromOfficeEnhanced'
      ],
      extraPlugins: [Base64UploadAdapterPlugin],
      placeholder: placeholder || 'Write your post contents here...',
      toolbar: {
        items: [
          'undo', 'redo', '|',
          'findAndReplace', '|',
          'heading', '|',
          'bold', 'italic', 'underline', 'strikethrough', '|',
          'fontSize', 'fontColor', 'fontBackgroundColor', '|',
          'alignment', '|',
          'bulletedList', 'numberedList', '|',
          'outdent', 'indent', '|',
          'link', 'uploadImage', 'blockQuote', 'insertTable', 'mediaEmbed', 'codeBlock', 'htmlEmbed', '|',
          'horizontalLine'
        ],
        shouldNotGroupWhenFull: true
      },
      image: {
        toolbar: [
          'imageTextAlternative', 'toggleImageCaption', '|',
          'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
          'resizeImage'
        ]
      },
      mediaEmbed: {
        previewsInData: true
      },
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
          { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
          { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
        ]
      },
      htmlSupport: {
        allow: [
          {
            name: /.*/,
            attributes: true,
            classes: true,
            styles: true
          }
        ]
      }
    })
      .then((editor: any) => {
        editorRef.current = editor;
        setIsEditorReady(true);

        if (value) {
          editor.setData(value);
        }

        editor.model.document.on('change:data', () => {
          const data = editor.getData();
          onChange(data);
        });
      })
      .catch((err: any) => {
        console.error('Error initializing CKEditor 5:', err);
        setErrorMsg(err.message || String(err));
        setIsFailed(true);
      });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy().then(() => {
          editorRef.current = null;
          setIsEditorReady(false);
        });
      }
    };
  }, [isScriptLoaded, isFailed]);

  // 3. Keep editor updated from external value changes
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const currentData = editorRef.current.getData();
      if (value !== currentData) {
        editorRef.current.setData(value || '');
      }
    }
  }, [value, isEditorReady]);

  if (isFailed) {
    return (
      <div className="space-y-1.5 w-full">
        <span className="text-[10px] text-amber-500 font-semibold block">Standard Text Editor Active (Rich Editor failed to load: {errorMsg})</span>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your post contents here...'}
          className="rounded-xl min-h-[250px] text-xs font-mono"
        />
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-[300px] border border-input rounded-xl overflow-hidden bg-background ckeditor-wrapper">
      {!isEditorReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 gap-2">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
          <span className="text-xs text-muted-foreground">Preparing CKEditor 5...</span>
        </div>
      )}
      <div ref={containerRef} className="prose prose-sm dark:prose-invert max-w-none min-h-[250px] p-2 focus:outline-none" />

      <style>{`
        .ckeditor-wrapper .ck-editor__editable_inline {
          min-height: 250px;
          max-height: 500px;
          font-size: 0.85rem !important;
          line-height: 1.6 !important;
        }
        .ckeditor-wrapper .ck-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid var(--border) !important;
          background: var(--muted) !important;
        }
        .ckeditor-wrapper .ck-editor__main > div {
          border: none !important;
          background: transparent !important;
          color: var(--foreground) !important;
        }
        .ck-button {
          color: var(--foreground) !important;
        }
        .ck-dropdown__panel {
          background: var(--popover) !important;
          border-color: var(--border) !important;
        }
        .ck-list__item {
          background: var(--popover) !important;
        }
        .ck-list__item:hover {
          background: var(--muted) !important;
        }
        .ck.ck-editor__editable_inline {
          padding: 1rem !important;
        }
        /* WYSIWYG overrides to bypass page global CSS reset */
        .ck-content h1 {
          font-size: 2.25rem !important;
          font-weight: 800 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1rem !important;
          line-height: 1.25 !important;
          color: var(--foreground) !important;
        }
        .ck-content h2 {
          font-size: 1.75rem !important;
          font-weight: 700 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3 !important;
          color: var(--foreground) !important;
        }
        .ck-content h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          color: var(--foreground) !important;
        }
        .ck-content h4 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: var(--foreground) !important;
        }
        .ck-content h5 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: var(--foreground) !important;
        }
        .ck-content h6 {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: var(--foreground) !important;
        }
        .ck-content ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
        }
        .ck-content ol {
          list-style-type: decimal !important;
          padding-left: 2rem !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
        }
        .ck-content li {
          display: list-item !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .ck-content table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        .ck-content table th, 
        .ck-content table td {
          border: 1px solid var(--border, #e5e7eb) !important;
          padding: 0.75rem !important;
          min-width: 2em !important;
        }
        .ck-content table th {
          background-color: var(--muted, #f3f4f6) !important;
          font-weight: bold !important;
        }
        .ck-content blockquote {
          border-left: 4px solid var(--gold, #d97706) !important;
          padding-left: 1.25rem !important;
          color: var(--muted-foreground, #6b7280) !important;
          font-style: italic !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1.5rem !important;
        }
      `}</style>
    </div>
  );
}
