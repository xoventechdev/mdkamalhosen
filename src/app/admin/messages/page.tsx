import { connect, MessageModel, toClient } from "@/lib/db";
import { MessagesInbox, type MessageRow } from "@/components/admin/messages-inbox";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await connect();
  const docs = await MessageModel.find({}).sort({ createdAt: -1 }).lean();
  const rows = toClient(docs) as unknown as Array<{
    id: string;
    name: string;
    email: string;
    subject?: string | null;
    message: string;
    ipPrefix?: string | null;
    readAt?: Date | null;
    archived: boolean;
    createdAt?: Date;
  }>;
  const items: MessageRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject ?? null,
    message: r.message,
    ipPrefix: r.ipPrefix ?? null,
    readAt: r.readAt ?? null,
    archived: r.archived,
    createdAt: r.createdAt ?? new Date(0),
  }));
  return (
    <div className="space-y-6">
      <MessagesInbox rows={items} />
    </div>
  );
}