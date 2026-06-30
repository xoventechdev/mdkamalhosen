import { prisma } from "@/lib/prisma";
import { MessagesInbox, type MessageRow } from "@/components/admin/messages-inbox";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const rows = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
  });
  const items: MessageRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    ipPrefix: r.ipPrefix,
    readAt: r.readAt,
    archived: r.archived,
    createdAt: r.createdAt,
  }));
  return (
    <div className="space-y-6">
      <MessagesInbox rows={items} />
    </div>
  );
}