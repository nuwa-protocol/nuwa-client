import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { useCurrentDocument } from "@/features/documents/hooks/use-document-current";
import { Button } from "@/shared/components/ui/button";

function PureArtifactCloseButton({ chatId }: { chatId: string }) {
  const { closeCurrentDocument } = useCurrentDocument();
  const navigate = useNavigate();

  return (
    <Button
      data-testid="artifact-close-button"
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        navigate(`/chat?cid=${chatId}`);
        closeCurrentDocument();
      }}
    >
      <X size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
