export async function sendDonationNotification({
  ownerEmail,
  ownerName,
  donorName,
  amount,
  projectTitle,
}: {
  ownerEmail: string;
  ownerName: string;
  donorName: string;
  amount: number;
  projectTitle: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "INEF Platform <noreply@resend.dev>",
      to: ownerEmail,
      subject: `${donorName} donated ${formatted} to your project`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;">
          <h2 style="color:#0f172a;">New donation received!</h2>
          <p>Hi ${ownerName},</p>
          <p><strong>${donorName}</strong> just donated <strong style="color:#059669;">${formatted}</strong> to your project <strong>"${projectTitle}"</strong>.</p>
          <p>Log in to see all your supporters and track your funding progress.</p>
          <br/>
          <p style="color:#64748b;font-size:13px;">— INEF Education Impact Platform</p>
        </div>
      `,
    }),
  });
}
