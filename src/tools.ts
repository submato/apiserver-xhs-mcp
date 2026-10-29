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

function result(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
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
    "xhs_search_notes",
    {
      title: "Search Xiaohongshu notes",
      description:
        "Search Xiaohongshu (RedNote) app notes by keyword with sorting and filters. Costs 60 API Server tokens per call.",
      inputSchema: {
        keyword: z.string().min(1).max(100).describe("Search keyword"),
        page: z.number().int().min(1).default(1).describe("Page number starting at 1"),
        searchId: z.string().optional().describe("searchId returned by the previous page"),
        sessionId: z.string().optional().describe("sessionId returned by the previous page"),
        sortType: z
          .enum([
            "general",
            "time_descending",
            "popularity_descending",
            "comment_descending",
            "collect_descending",
          ])
          .default("general"),
        filterNoteType: z.enum(["不限", "视频笔记", "普通笔记"]).default("不限"),
        filterNoteTime: z.enum(["不限", "一天内", "一周内", "半年内"]).default("不限"),
        filterNoteRange: z.enum(["不限", "已看过", "未看过", "已关注"]).default("不限"),
      },
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      call(() =>
        api.get("/api/xhs/appsearch", {
          keyword: input.keyword,
          page: input.page,
          searchId: input.searchId,
          sessionId: input.sessionId,
          sortType: input.sortType,
          filterNoteType: input.filterNoteType,
          filterNoteTime: input.filterNoteTime,
          filterNoteRange: input.filterNoteRange,
        }),
      ),
  );

  server.registerTool(
    "xhs_get_note",
    {
      title: "Get Xiaohongshu note",
      description:
        "Get details for a Xiaohongshu image/text note. Use xhs_get_video_note for video notes. Costs 40 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId }) => call(() => api.get("/api/xhs/notedetail", { noteId })),
  );

  server.registerTool(
    "xhs_get_video_note",
    {
      title: "Get Xiaohongshu video note",
      description:
        "Get the feed response for a Xiaohongshu video note. The first returned video is the requested note. Costs 40 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu video note ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId }) => call(() => api.get("/api/xhs/videonotedetail", { noteId })),
  );

  server.registerTool(
    "xhs_get_comments",
    {
      title: "Get Xiaohongshu comments",
      description:
        "Get one page of top-level comments for a Xiaohongshu note. Costs 20 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
        start: z.string().optional().describe("Last comment ID from the previous page"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId, start }) =>
      call(() => api.get("/api/xhs/getcomment", { noteId, start })),
  );

  server.registerTool(
    "xhs_get_subcomments",
    {
      title: "Get Xiaohongshu subcomments",
      description:
        "Get one page of replies to a top-level Xiaohongshu comment. Costs 20 API Server tokens.",
      inputSchema: {
        noteId: z.string().min(1).describe("Xiaohongshu note ID"),
        commentId: z.string().min(1).describe("Top-level comment ID"),
        start: z.string().optional().describe("Last reply ID from the previous page"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ noteId, commentId, start }) =>
      call(() => api.get("/api/xhs/getsubcomments", { noteId, commentId, start })),
  );

  server.registerTool(
    "xhs_search_users",
    {
      title: "Search Xiaohongshu users",
      description:
        "Search Xiaohongshu app users by keyword. Continue pagination with searchId. Costs 60 API Server tokens.",
      inputSchema: {
        keyword: z.string().min(1).max(100).describe("User search keyword"),
        page: z.number().int().min(1).default(1),
        searchId: z.string().optional().describe("searchId returned by the previous page"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ keyword, page, searchId }) =>
      call(() => api.get("/api/xhs/appusersearch", { keyword, page, searchId })),
  );

  server.registerTool(
    "xhs_get_user",
    {
      title: "Get Xiaohongshu user",
      description: "Get a Xiaohongshu app user profile. Costs 50 API Server tokens.",
      inputSchema: {
        userId: z.string().min(1).describe("Xiaohongshu user ID"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ userId }) => call(() => api.get("/api/xhs/appuserinfo", { userId })),
  );

  server.registerTool(
    "xhs_list_user_notes",
    {
      title: "List Xiaohongshu user notes",
      description:
        "List notes published by a Xiaohongshu app user. Continue pagination with cursor. Costs 40 API Server tokens.",
      inputSchema: {
        userId: z.string().min(1).describe("Xiaohongshu user ID"),
        cursor: z.string().optional().describe("Cursor returned by the previous page"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ userId, cursor }) =>
      call(() => api.get("/api/xhs/appuserposted", { userId, cursor })),
  );

  server.registerTool(
    "xhs_list_topic_notes",
    {
      title: "List Xiaohongshu topic notes",
      description:
        "List notes under a Xiaohongshu topic/tag with pagination fields from the previous response. Costs 20 API Server tokens.",
      inputSchema: {
        pageId: z.string().min(1).describe("Topic/tag ID"),
        first_load_time: z
          .string()
          .min(1)
          .describe("First request time as a millisecond Unix timestamp"),
        sort: z.enum(["hot", "time", "trend"]).default("hot"),
        session_id: z.string().optional(),
        last_note_ct: z.string().optional(),
        last_note_id: z.string().optional(),
        cursor_score: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
    },
    async (input) => call(() => api.get("/api/xhs/tagnotes", input)),
  );
}
