import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Copy, Check, ChevronDown, Download } from "lucide-react";
import { buildCopyText } from "@/lib/utils";
import { CHATGPT_ICON, CLAUDE_ICON } from "@/components/icons";

interface SplitCopyButtonProps {
  markdown: string;
  prompt: string;
  copied: boolean;
  onCopy: () => void;
  title?: string;
}

export function SplitCopyButton({
  markdown,
  prompt,
  copied,
  onCopy,
  title,
}: SplitCopyButtonProps) {
  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title ? `${title}.md` : "feedme.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const copyText = buildCopyText(prompt, markdown);

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        data-copied={copied ? "true" : undefined}
      >
        {copied ? (
          <Check data-testid="copy-check-icon" data-icon="inline-start" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
        복사하기
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="열기 옵션"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleDownload}>
              <Download data-icon="inline-start" aria-hidden="true" />
              마크다운 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://chatgpt.com/?q=${encodeURIComponent(copyText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CHATGPT_ICON}
                ChatGPT에서 열기
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://claude.ai/new?q=${encodeURIComponent(copyText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CLAUDE_ICON}
                Claude에서 열기
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
