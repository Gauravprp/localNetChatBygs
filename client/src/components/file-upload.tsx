import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef } from "react";

type FileUploadProps = {
  onFileSelect: (file: File) => void;
};

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,application/pdf,.doc,.docx,.txt"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleClick}
        title="Upload file"
      >
        <Upload className="h-4 w-4" />
      </Button>
    </>
  );
}
