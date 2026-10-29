import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import { ApiServerError, createApiClient } from "./client.js";

type ApiClient = ReturnType<typeof createApiClient>;

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

function normalizeV2Response(data: unknown): unknown {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return data;
  }

  const response = data as Record<string, unknown>;
  if (typeof response.data !== "string") {
    return data;
  }

  try {
    return { ...response, data: JSON.parse(response.data) };
  } catch {
    return data;
  }
}

function result(data: unknown) {
  const normalized = normalizeV2Response(data);
  const isBusinessError =
    typeof normalized === "object" &&
    normalized !== null &&
    "code" in normalized &&
    (normalized as { code?: unknown }).code !== 0;

  return {
    content: [{ type: "text" as const, text: JSON.stringify(normalized, null, 2) }],
    ...(isBusinessError ? { isError: true } : {}),
  };
}

function failure(error: unknown) {
  const message =
    error instanceof ApiServerError || error instanceof Error
      ? error.message
      : "Unknown API Server error";

  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

async function call(operation: () => Promise<unknown>) {
  try {
    return result(await operation());
  } catch (error) {
    return failure(error);
  }
}

export function registerXhsTools(server: McpServer, api: ApiClient): void {
  server.registerTool(
    "xhs_v2_search_notes",
    {
      title: "Search Xiaohongshu notes (V2)",
      description:
        "Search Xiaohongshu (RedNote) notes through API Server V2. Costs 60 API Server tokens per call.",
      inputSchema: {
        keyword: z.string().min(1).max(100).describe("Search keyword"),
        page: z.number().int().min(1).default(1).describe("Page number starting at 1"),
        sort: z
          .enum([
            "综合",
            "最新",
            "最多点赞",
            "最多评论",
            "最多收藏",
            "英文优先",
          ])
          .default("综合"),
        noteType: z.enum(["不限", "视频笔记", "普通笔记"]).default("不限"),
        noteTime: z
          .enum(["不限", "一天内", "一周内", "一个月内", "一年内"])
          .default("不限"),
      },
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      call(() =>
        api.get("/api/xhs/v2/appsearch", {
          keyword: input.keyword,
          page: input.page,
          sort: input.sort,
          note_type: input.noteType,
          note_time: input.noteTime,
        }),
      ),
  );

  server.registerTool(
    "xhs_v2_get_note",
    {
      title: "Get Xiaohongshu note (V2)",
      description:
        "Get an adapted Xiaohongshu note detail response through API Server V2. Costs 45 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId }) => call(() => api.get("/api/xhs/v2/notedetail", { noteId })),
  );

  server.registerTool(
    "xhs_v2_get_full_note",
    {
      title: "Get full Xiaohongshu note (V2)",
      description:
        "Get the complete Xiaohongshu note detail response through API Server V2. Costs 60 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId }) => call(() => api.get("/api/xhs/v2/fullnotedetail", { noteId })),
  );

  server.registerTool(
    "xhs_v2_get_comments",
    {
      title: "Get Xiaohongshu comments (V2)",
      description:
        "Get one page of top-level comments through API Server V2, optionally sorted by newest or hottest. Costs 45 tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
        start: z.string().optional().describe("Last comment ID from the previous page"),
        sort: z.enum(["最新", "最热"]).optional().describe("Optional comment sort order"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId, start, sort }) =>
      call(() => api.get("/api/xhs/v2/getcomment", { noteId, start, sort })),
  );

  server.registerTool(
    "xhs_v2_get_subcomments",
    {
      title: "Get Xiaohongshu subcomments (V2)",
      description:
        "Get one page of replies to a top-level comment through API Server V2. Costs 45 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
        commentId: z.string().min(1).describe("Top-level comment ID"),
        start: z.string().optional().describe("Last reply ID from the previous page"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId, commentId, start }) =>
      call(() =>
        api.get("/api/xhs/v2/getsubcomments", { noteId, commentId, start }),
      ),
  );

  server.registerTool(
    "xhs_v2_get_user",
    {
      title: "Get Xiaohongshu user (V2)",
      description:
        "Get an adapted Xiaohongshu user profile through API Server V2. Costs 45 API Server tokens.",
      inputSchema: {
        userId: z.string().min(1).describe("Xiaohongshu user ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ userId }) => call(() => api.get("/api/xhs/v2/appuserinfo", { userId })),
  );

  server.registerTool(
    "xhs_v2_get_full_user",
    {
      title: "Get full Xiaohongshu user (V2)",
      description:
        "Get a complete Xiaohongshu user profile through API Server V2. Costs 60 API Server tokens.",
      inputSchema: {
        userId: z.string().min(1).describe("Xiaohongshu user ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ userId }) =>
      call(() => api.get("/api/xhs/v2/fulluserinfo", { userId })),
  );

  server.registerTool(
    "xhs_v2_list_user_notes",
    {
      title: "List Xiaohongshu user notes (V2)",
      description:
        "List notes published by a Xiaohongshu user through API Server V2. Continue pagination with cursor. Costs 60 tokens.",
      inputSchema: {
        userId: z.string().min(1).describe("Xiaohongshu user ID"),
        cursor: z.string().optional().describe("Cursor returned by the previous page"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ userId, cursor }) =>
      call(() => api.get("/api/xhs/v2/appuserposted", { userId, cursor })),
  );
}
