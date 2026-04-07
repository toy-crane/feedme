import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { PluggableList } from "unified";

export const REMARK_PLUGINS: PluggableList = [remarkGfm];
export const REHYPE_PLUGINS: PluggableList = [rehypeHighlight];
