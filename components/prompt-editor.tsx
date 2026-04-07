import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PRESETS } from "@/config/presets";

interface PromptEditorProps {
  prompt: string;
  promptOpen: boolean;
  selectedPreset: string;
  onPromptChange: (value: string) => void;
  onPromptOpenChange: (open: boolean) => void;
}

export function PromptEditor({
  prompt,
  promptOpen,
  selectedPreset,
  onPromptChange,
  onPromptOpenChange,
}: PromptEditorProps) {
  return (
    <Collapsible open={promptOpen} onOpenChange={onPromptOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground px-0"
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          프롬프트 추가하기
          {promptOpen ? (
            <ChevronDown data-icon="inline-end" aria-hidden="true" />
          ) : (
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 pt-2">
          <Field>
            <FieldLabel htmlFor="prompt-input" className="sr-only">
              프롬프트
            </FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="prompt-input"
                placeholder="ex) 이 글을 요약해줘"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={2}
              />
              {prompt && (
                <InputGroupAddon align="inline-end" className="self-start pt-2">
                  <InputGroupButton
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onPromptChange("")}
                    aria-label="프롬프트 지우기"
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </Field>
          <ToggleGroup
            type="single"
            value={selectedPreset}
            onValueChange={onPromptChange}
            spacing={2}
            className="flex flex-wrap justify-start"
          >
            {PRESETS.map((preset) => (
              <ToggleGroupItem
                key={preset}
                value={preset}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                {preset}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
